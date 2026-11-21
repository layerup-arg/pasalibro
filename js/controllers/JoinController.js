import { Controller } from '../core/Controller.js';
import { JoinView } from '../views/JoinView.js';
import { SessionModel } from '../models/SessionModel.js';

/**
 * Ingreso del código de invitación.
 * Solo tiene sentido con sesión iniciada y sin escuela; si no, vuelve al inicio.
 */
export class JoinController extends Controller {
  /** @param {{ session: SessionModel }} deps */
  constructor({ session }) {
    super();
    this.session = session;
  }

  async mount(container) {
    await super.mount(container);
    this.view = new JoinView(container);

    this.view.onAction('join', ({ code }) => this.#join(code));
    this.view.onAction('logout', () => this.session.logout());

    this.listen(this.session, 'change', () => this.#show());
    this.#show();
  }

  #show() {
    if (this.#guard()) this.view.render({ fullName: this.session.state.fullName });
  }

  /** Devuelve true si corresponde mostrar esta pantalla. */
  #guard() {
    const { status } = this.session.state;
    if (status === SessionModel.STATUS.LOADING) return false;
    if (status !== SessionModel.STATUS.NEEDS_SCHOOL) {
      location.hash = '#/';
      return false;
    }
    return true;
  }

  async #join(code) {
    const { fullName } = this.session.state;
    this.view.render({ fullName, code, busy: true });
    const result = await this.session.joinSchool(code);
    if (!result.ok) this.view.render({ fullName, code, error: result.error });
    // si salió bien, SessionModel cambia a READY y #guard() nos lleva al inicio
  }
}
