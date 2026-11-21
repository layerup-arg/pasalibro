import { CONFIG } from './config.js';
import { ApiClient } from './core/ApiClient.js';
import { AuthClient } from './core/AuthClient.js';
import { Router } from './core/Router.js';

import { ConfigRepository } from './repositories/ConfigRepository.js';
import { VersionRepository } from './repositories/VersionRepository.js';
import { ProfileRepository } from './repositories/ProfileRepository.js';
import { SchoolRepository } from './repositories/SchoolRepository.js';
import { CatalogRepository } from './repositories/CatalogRepository.js';

import { AppStatusModel } from './models/AppStatusModel.js';
import { SessionModel } from './models/SessionModel.js';
import { CatalogAdminModel } from './models/CatalogAdminModel.js';

import { LayoutView } from './views/LayoutView.js';

import { HomeController } from './controllers/HomeController.js';
import { JoinController } from './controllers/JoinController.js';
import { AdminController } from './controllers/AdminController.js';
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
    const { session, status, catalogAdmin } = this.models;
    this.router.add('/', () => new HomeController({ session, status }));
    this.router.add('/unirme', () => new JoinController({ session }));
    this.router.add('/admin', () => new AdminController({ session, catalog: catalogAdmin }));
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
