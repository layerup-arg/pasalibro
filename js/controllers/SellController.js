import { Controller } from '../core/Controller.js';
import { SellView } from '../views/SellView.js';
import { SessionModel } from '../models/SessionModel.js';

/**
 * Pantalla "Vendo" (#/vendo). Requiere sesión iniciada y escuela.
 */
export class SellController extends Controller {
  /**
   * @param {object} deps
   * @param {SessionModel} deps.session
   * @param {import('../models/SellModel.js').SellModel} deps.sell
   */
  constructor({ session, sell }) {
    super();
    this.session = session;
    this.sell = sell;
    this.started = false;
  }

  async mount(container) {
    await super.mount(container);
    this.view = new SellView(container);
    this.#bindActions();

    this.listen(this.sell, 'change', () => this.#render());
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
    this.sell.load({ userId: user.id, schoolId: school.id });
  }

  #render() {
    if (!this.started) return;
    this.view.render({
      ...this.sell.state,
      offerByBook: this.sell.offerByBook,
      canPublish: this.sell.canPublish,
      openCount: this.sell.openCount,
    });
  }

  #bindActions() {
    const m = this.sell;
    this.view.onAction('save-phone', ({ phone }) => m.savePhone(phone));
    this.view.onAction('edit-phone', () => m.editPhone());
    this.view.onAction('cancel-phone', () => m.cancelPhone());
    this.view.onAction('grade', ({ id }) => m.selectGrade(id));
    this.view.onAction('offer', ({ id }) => m.offer(id));
    this.view.onAction('status', ({ id, status }) => m.setStatus(id, status));
    this.view.onAction('remove', ({ id }) => m.remove(id));
  }
}
