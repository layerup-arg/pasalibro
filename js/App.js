import { CONFIG } from './config.js';
import { ApiClient } from './core/ApiClient.js';
import { AuthClient } from './core/AuthClient.js';
import { Router } from './core/Router.js';

import { ConfigRepository } from './repositories/ConfigRepository.js';
import { VersionRepository } from './repositories/VersionRepository.js';
import { ProfileRepository } from './repositories/ProfileRepository.js';
import { SchoolRepository } from './repositories/SchoolRepository.js';
import { CatalogRepository } from './repositories/CatalogRepository.js';
import { OfferRepository } from './repositories/OfferRepository.js';
import { WantRepository } from './repositories/WantRepository.js';
import { MemberRepository } from './repositories/MemberRepository.js';

import { AppStatusModel } from './models/AppStatusModel.js';
import { SessionModel } from './models/SessionModel.js';
import { CatalogAdminModel } from './models/CatalogAdminModel.js';
import { SellModel } from './models/SellModel.js';
import { SearchModel } from './models/SearchModel.js';
import { BuyMatchesModel } from './models/BuyMatchesModel.js';
import { MembersAdminModel } from './models/MembersAdminModel.js';

import { LayoutView } from './views/LayoutView.js';

import { HomeController } from './controllers/HomeController.js';
import { JoinController } from './controllers/JoinController.js';
import { AdminController } from './controllers/AdminController.js';
import { AdminMembersController } from './controllers/AdminMembersController.js';
import { SellController } from './controllers/SellController.js';
import { SearchController } from './controllers/SearchController.js';
import { MatchesController } from './controllers/MatchesController.js';
import { NotFoundController } from './controllers/NotFoundController.js';

/**
 * Punto de armado de la app (composition root).
 * Acá se crean UNA vez el login, el cliente, los repositorios y los modelos,
 * y se registran las rutas. Para agregar una pantalla nueva:
 *   1. crear su View en js/views/
 *   2. crear su Controller en js/controllers/
 *   3. registrar la ruta en #registerRoutes()
 */
export class App {
  constructor(root) {
    this.root = root;

    // Infraestructura
    this.auth = new AuthClient(CONFIG.supabase);
    this.api = new ApiClient({ ...CONFIG.supabase, getToken: () => this.auth.getAccessToken() });

    // Repositorios (acceso a datos)
    this.repos = {
      config: new ConfigRepository(this.api),
      version: new VersionRepository(CONFIG.github),
      profiles: new ProfileRepository(this.api),
      schools: new SchoolRepository(this.api),
      catalog: new CatalogRepository(this.api),
      offers: new OfferRepository(this.api),
      wants: new WantRepository(this.api),
      members: new MemberRepository(this.api),
    };

    // Modelos compartidos
    this.models = {
      status: new AppStatusModel({
        configRepo: this.repos.config,
        versionRepo: this.repos.version,
        isConfigured: this.api.isConfigured,
      }),
      session: new SessionModel({
        auth: this.auth,
        profileRepo: this.repos.profiles,
        schoolRepo: this.repos.schools,
      }),
      catalogAdmin: new CatalogAdminModel(this.repos.catalog),
      membersAdmin: new MembersAdminModel(this.repos.members),
      sell: new SellModel({
        catalogRepo: this.repos.catalog,
        offerRepo: this.repos.offers,
        wantRepo: this.repos.wants,
        profileRepo: this.repos.profiles,
      }),
      search: new SearchModel({
        catalogRepo: this.repos.catalog,
        wantRepo: this.repos.wants,
        offerRepo: this.repos.offers,
      }),
      buyMatches: new BuyMatchesModel({
        catalogRepo: this.repos.catalog,
        wantRepo: this.repos.wants,
        offerRepo: this.repos.offers,
      }),
    };
  }

  async start() {
    // 1. Layout fijo
    this.layout = new LayoutView(this.root);
    this.layout.render({ appName: CONFIG.appName });
    this.layout.onAction('logout', () => this.#confirmLogout());
    this.models.session.on('change', s => this.#syncLayout(s));
    this.models.status.on('change', () => this.#syncLayout(this.models.session.state));

    // 2. Login: leer tokens de la URL ANTES de que el router mire el #hash
    await this.auth.init();

    // 3. Pantallas
    this.router = new Router(this.layout.outlet, { notFound: () => new NotFoundController() });
    this.#registerRoutes();
    this.router.start();

    // 4. Datos iniciales
    this.models.status.load();
    this.models.session.load();
  }

  #registerRoutes() {
    const { session, status, catalogAdmin, membersAdmin, sell, search, buyMatches } = this.models;
    this.router.add('/', () => new HomeController({ session, status }));
    this.router.add('/unirme', () => new JoinController({ session }));
    this.router.add('/admin', () => new AdminController({ session, catalog: catalogAdmin }));
    this.router.add('/admin/miembros', () => new AdminMembersController({ session, members: membersAdmin }));
    this.router.add('/vendo', () => new SellController({ session, sell }));
    this.router.add('/compro', () => new SearchController({ session, search }));
    this.router.add('/busco', () => new SearchController({ session, search })); // link viejo
    this.router.add('/coincidencias', () => new MatchesController({ mode: 'busco', session, buyMatches, sell }));
    this.router.add('/coincidencias/:mode', ({ mode }) => new MatchesController({ mode, session, buyMatches, sell }));
  }

  #syncLayout(session) {
    const loggedIn = session.status !== SessionModel.STATUS.ANONYMOUS && session.status !== SessionModel.STATUS.LOADING;
    this.layout.setUser(loggedIn ? { fullName: session.fullName } : null);
    this.layout.setSchoolName(session.school?.name ?? this.models.status.state.schoolName);
  }

  async #confirmLogout() {
    if (!confirm('¿Cerrar sesión?')) return;
    await this.models.session.logout();
    location.hash = '#/';
  }
}
