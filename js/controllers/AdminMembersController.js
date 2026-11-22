import { Controller } from '../core/Controller.js';
import { MembersView } from '../views/MembersView.js';
import { SessionModel } from '../models/SessionModel.js';
import { MembersAdminModel } from '../models/MembersAdminModel.js';

/**
 * Administrar › Miembros (#/admin/miembros). Solo para admins.
 */
export class AdminMembersController extends Controller {
  /**
   * @param {object} deps
   * @param {SessionModel} deps.session
   * @param {MembersAdminModel} deps.members
   */
  constructor({ session, members }) {
    super();
    this.session = session;
    this.members = members;
    this.started = false;
  }

  get adminSchools() {
    return this.session.state.schools.filter(s => s.role === 'admin');
  }

  async mount(container) {
    await super.mount(container);
    this.view = new MembersView(container);
    this.#bindActions();
    this.listen(this.members, 'change', () => this.#render());
    this.listen(this.session, 'change', () => this.#start());
    this.#start();
  }

  #start() {
    const { status } = this.session.state;
    if (status === SessionModel.STATUS.LOADING || this.started) return;
    if (!this.adminSchools.length) { location.hash = '#/'; return; }
    this.started = true;
    const current = this.adminSchools.find(s => s.id === this.members.state.schoolId) ?? this.adminSchools[0];
    this.members.load(current.id);
  }

  #render() {
    if (!this.started) return;
    this.view.render({
      ...this.members.state,
      schools: this.adminSchools,
      members: this.members.sortedMembers,
      adminCount: this.members.adminCount,
      canDemote: m => this.members.canDemote(m),
      meId: this.session.state.user?.id,
    });
  }

  #bindActions() {
    const { ADMIN, MEMBER } = MembersAdminModel.ROLE;

    this.view.onAction('school', ({ value }) => this.members.load(value));

    this.view.onAction('make-admin', ({ id, name }) => {
      const ok = confirm(`¿Hacer admin a ${name}?\n\nVa a poder cargar y editar grados y libros, y nombrar otros admins.`);
      if (ok) this.members.setRole(id, ADMIN);
    });

    this.view.onAction('remove-admin', async ({ id, name, me }) => {
      const isMe = me === 'true';
      const msg = isMe
        ? '¿Quitarte el rol de admin?\n\nVas a dejar de ver la sección Administrar.'
        : `¿Quitarle el rol de admin a ${name}?`;
      if (!confirm(msg)) return;
      const ok = await this.members.setRole(id, MEMBER);
      // Si me lo saqué a mí: refrescar la sesión (desaparece Administrar) y volver al inicio.
      if (ok && isMe) {
        await this.session.load();
        location.hash = '#/';
      }
    });
  }
}
