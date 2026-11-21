import { Controller } from '../core/Controller.js';
import { HomeView } from '../views/HomeView.js';
import { SessionModel } from '../models/SessionModel.js';

/**
 * Pantalla de inicio: portada (sin sesión) o panel (con sesión y escuela).
 * Si la usuaria está logueada pero sin escuela, la manda a #/unirme.
 */
export class HomeController extends Controller {
  /**
   * @param {object} deps
   * @param {SessionModel} deps.session
   * @param {import('../models/AppStatusModel.js').AppStatusModel} deps.status
   */
  constructor({ session, status }) {
    super();
    this.session = session;
    this.status = status;
  }

  async mount(container) {
    await super.mount(container);
    this.view = new HomeView(container);

    this.view.onAction('login', () => this.session.loginWithGoogle());
    this.view.onAction('search', () => location.hash = '#/busco');
    this.view.onAction('publish', () => location.hash = '#/vendo');
    this.view.onAction('admin', () => location.hash = '#/admin');

    this.listen(this.session, 'change', () => this.#render());
    this.listen(this.status, 'change', s => this.view.updateStatus(s));
    this.#render();
  }

  #render() {
    const session = this.session.state;
    if (session.status === SessionModel.STATUS.NEEDS_SCHOOL) {
      location.hash = '#/unirme';
      return;
    }
    this.view.render({ session, status: this.status.state });
  }
}
