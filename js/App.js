import { CONFIG } from './config.js';
import { ApiClient } from './core/ApiClient.js';
import { Router } from './core/Router.js';

import { ConfigRepository } from './repositories/ConfigRepository.js';
import { VersionRepository } from './repositories/VersionRepository.js';

import { AppStatusModel } from './models/AppStatusModel.js';

import { LayoutView } from './views/LayoutView.js';

import { HomeController } from './controllers/HomeController.js';
import { NotFoundController } from './controllers/NotFoundController.js';

/**
 * Punto de armado de la app (composition root).
 * Acá se crean UNA vez el cliente, los repositorios y los modelos,
 * y se registran las rutas. Para agregar una pantalla nueva:
 *   1. crear su View en js/views/
 *   2. crear su Controller en js/controllers/
 *   3. registrar la ruta en #registerRoutes()
 */
export class App {
  constructor(root) {
    this.root = root;

    // Infraestructura
    this.api = new ApiClient(CONFIG.supabase);

    // Repositorios (acceso a datos)
    this.repos = {
      config: new ConfigRepository(this.api),
      version: new VersionRepository(CONFIG.github),
    };

    // Modelos compartidos
    this.models = {
      status: new AppStatusModel({
        configRepo: this.repos.config,
        versionRepo: this.repos.version,
        isConfigured: this.api.isConfigured,
      }),
    };
  }

  start() {
    // Layout fijo
    this.layout = new LayoutView(this.root);
    this.layout.render({ appName: CONFIG.appName });
    this.models.status.on('change', s => this.layout.setSchoolName(s.schoolName));

    // Pantallas
    this.router = new Router(this.layout.outlet, { notFound: () => new NotFoundController() });
    this.#registerRoutes();
    this.router.start();

    // Datos iniciales
    this.models.status.load();
  }

  #registerRoutes() {
    this.router.add('/', () => new HomeController(this.models.status));
  }
}
