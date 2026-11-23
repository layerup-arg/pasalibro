import { Controller } from '../core/Controller.js';
import { SearchView } from '../views/SearchView.js';
import { SessionModel } from '../models/SessionModel.js';

/**
 * Pantalla "Busco" (#/busco). Requiere sesión iniciada y escuela.
 */
export class SearchController extends Controller {
  /**
   * @param {object} deps
   * @param {SessionModel} deps.session
   * @param {import('../models/SearchModel.js').SearchModel} deps.search
   */
  constructor({ session, search }) {
    super();
    this.session = session;
    this.search = search;
    this.started = false;
  }

  async mount(container) {
    await super.mount(container);
    this.view = new SearchView(container);
    this.#bindActions();

    this.listen(this.search, 'change', () => this.#render());
    this.listen(this.session, 'change', () => this.#start());
    this.#start();
  }

  #start() {
    const { status, user, school } = this.session.state;
    if (status === SessionModel.STATUS.LOADING || this.started) return;
    if (status !== SessionModel.STATUS.READY) {
      location.hash = '#/';
      return;
    }
    this.started = true;
    this.search.load({ userId: user.id, schoolId: school.id });
  }

  #render() {
    if (!this.started) return;
    this.view.render({
      ...this.search.state,
      selectedByGrade: this.search.selectedByGrade,
    });
  }

  #bindActions() {
    const m = this.search;
    this.view.onAction('grade', ({ id }) => m.selectGrade(id));
    this.view.onAction('want', ({ id }) => m.want(id));
    this.view.onAction('unwant', ({ id }) => m.unwant(id));
    this.view.onAction('matches', () => { location.hash = '#/coincidencias/busco'; });
  }
}
