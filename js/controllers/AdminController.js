import { Controller } from '../core/Controller.js';
import { AdminView } from '../views/AdminView.js';
import { SessionModel } from '../models/SessionModel.js';

/**
 * Pantalla Administrar (#/admin). Solo para admins de alguna escuela.
 */
export class AdminController extends Controller {
  /**
   * @param {object} deps
   * @param {SessionModel} deps.session
   * @param {import('../models/CatalogAdminModel.js').CatalogAdminModel} deps.catalog
   */
  constructor({ session, catalog }) {
    super();
    this.session = session;
    this.catalog = catalog;
    this.started = false;
  }

  /** Escuelas donde la usuaria es admin. */
  get adminSchools() {
    return this.session.state.schools.filter(s => s.role === 'admin');
  }

  async mount(container) {
    await super.mount(container);
    this.view = new AdminView(container);
    this.#bindActions();

    this.listen(this.catalog, 'change', () => this.#render());
    this.listen(this.session, 'change', () => this.#start());
    this.#start();
  }

  /** Espera a que la sesión esté lista; si no es admin, vuelve al inicio. */
  #start() {
    const { status } = this.session.state;
    if (status === SessionModel.STATUS.LOADING || this.started) return;
    if (!this.adminSchools.length) {
      location.hash = '#/';
      return;
    }
    this.started = true;
    const current = this.adminSchools.find(s => s.id === this.catalog.state.schoolId) ?? this.adminSchools[0];
    this.catalog.load(current.id);
  }

  #render() {
    if (!this.started) return;
    this.view.render({ ...this.catalog.state, schools: this.adminSchools });
  }

  #bindActions() {
    const c = this.catalog;
    const v = () => this.view;

    v().onAction('school', ({ value }) => c.load(value));
    v().onAction('grade', ({ id }) => c.selectGrade(id));
    v().onAction('add-grade', async ({ name }) => { if (await c.addGrade(name)) v().clearDraft('name'); });
    v().onAction('add-books', async ({ text }) => { if (await c.addBooks(text)) v().clearDraft('text'); });
    v().onAction('edit', ({ id }) => c.startEdit(id));
    v().onAction('cancel-edit', () => c.cancelEdit());
    v().onAction('save-book', ({ id, title, author, publisher, price }) => c.saveBook(id, { title, author, publisher, price }));
    v().onAction('toggle', ({ id }) => c.toggleActive(id));
    v().onAction('delete', ({ id, title }) => {
      const ok = confirm(`¿Borrar "${title}"?\n\nTambién se borran las publicaciones de las familias para este libro. Si solo querés que no aparezca, usá "Ocultar".`);
      if (ok) c.deleteBook(id);
    });
  }
}
