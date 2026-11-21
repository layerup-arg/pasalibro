import { Controller } from '../core/Controller.js';
import { MatchesView } from '../views/MatchesView.js';
import { SessionModel } from '../models/SessionModel.js';

/**
 * Coincidencias (#/coincidencias). PENDIENTE: por ahora solo muestra cuántos libros busca.
 */
export class MatchesController extends Controller {
  /**
   * @param {object} deps
   * @param {SessionModel} deps.session
   * @param {import('../models/SearchModel.js').SearchModel} deps.search
   */
  constructor({ session, search }) {
    super();
    this.session = session;
    this.search = search;
  }

  async mount(container) {
    await super.mount(container);
    this.view = new MatchesView(container);
    this.listen(this.session, 'change', () => this.#render());
    this.#render();
  }

  #render() {
    const { status } = this.session.state;
    if (status === SessionModel.STATUS.LOADING) return;
    if (status !== SessionModel.STATUS.READY) { location.hash = '#/'; return; }
    this.view.render({ count: this.search.state.saved.size });
  }
}
