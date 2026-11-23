import { Controller } from '../core/Controller.js';
import { MatchesView } from '../views/MatchesView.js';
import { SessionModel } from '../models/SessionModel.js';

/**
 * Coincidencias (#/coincidencias/busco · #/coincidencias/vendo).
 * PENDIENTE: por ahora solo muestra cuántos libros busca u ofrece.
 */
export class MatchesController extends Controller {
  /**
   * @param {object} deps
   * @param {'busco'|'vendo'} deps.mode
   * @param {SessionModel} deps.session
   * @param {import('../models/SearchModel.js').SearchModel} deps.search
   * @param {import('../models/SellModel.js').SellModel} deps.sell
   */
  constructor({ mode, session, search, sell }) {
    super();
    this.mode = mode === 'vendo' ? 'vendo' : 'busco';
    this.session = session;
    this.search = search;
    this.sell = sell;
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
    const count = this.mode === 'vendo' ? this.sell.openCount : this.search.state.selected.size;
    this.view.render({ mode: this.mode, count });
  }
}
