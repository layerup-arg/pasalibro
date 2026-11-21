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
    window.addEventListener('beforeunload', this.#warnUnsaved);
    this.#start();
  }

  unmount() {
    window.removeEventListener('beforeunload', this.#warnUnsaved);
    super.unmount();
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
      isDirty: this.search.isDirty,
      selectedByGrade: this.search.selectedByGrade,
    });
  }

  #bindActions() {
    const m = this.search;
    this.view.onAction('grade', ({ id }) => m.selectGrade(id));
    this.view.onAction('toggle', ({ id }) => m.toggle(id));
    this.view.onAction('toggle-all', () => m.toggleAllInGrade());
    this.view.onAction('save', () => m.save());
    this.view.onAction('discard', () => m.discard());
    // Ir a las coincidencias: primero guarda lo pendiente para que la otra pantalla vea la lista real.
    this.view.onAction('matches', async () => {
      if (await m.save()) location.hash = '#/coincidencias';
    });
  }

  /** Avisa si cierra la pestaña con cambios sin guardar. */
  #warnUnsaved = (event) => {
    if (this.search.isDirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  };
}
