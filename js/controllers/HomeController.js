import { Controller } from '../core/Controller.js';
import { HomeView } from '../views/HomeView.js';

/**
 * Pantalla de inicio.
 * Dibuja la vista con el estado actual y la refresca cuando AppStatusModel cambia.
 */
export class HomeController extends Controller {
  /** @param {import('../models/AppStatusModel.js').AppStatusModel} statusModel */
  constructor(statusModel) {
    super();
    this.statusModel = statusModel;
  }

  async mount(container) {
    await super.mount(container);
    this.view = new HomeView(container);
    this.view.render(this.statusModel.state);

    this.listen(this.statusModel, 'change', state => this.view.updateStatus(state));

    // Acciones de la vista (se activan cuando existan esas pantallas)
    this.view.onAction('search', () => location.hash = '#/buscar');
    this.view.onAction('publish', () => location.hash = '#/publicar');
  }
}
