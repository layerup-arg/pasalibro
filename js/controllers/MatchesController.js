import { Controller } from '../core/Controller.js';
import { BuyMatchesView } from '../views/BuyMatchesView.js';
import { SessionModel } from '../models/SessionModel.js';

/**
 * Coincidencias (#/coincidencias): quién tiene los libros de mi lista.
 * Solo existe del lado del comprador: es quien inicia el contacto.
 */
export class MatchesController extends Controller {
  /**
   * @param {object} deps
   * @param {SessionModel} deps.session
   * @param {import('../models/BuyMatchesModel.js').BuyMatchesModel} deps.buyMatches
   */
  constructor({ session, buyMatches }) {
    super();
    this.session = session;
    this.buyMatches = buyMatches;
    this.started = false;
  }

  async mount(container) {
    await super.mount(container);
    this.view = new BuyMatchesView(container);
    this.view.onAction('toggle', ({ id }) => this.buyMatches.toggle(id));
    this.view.onAction('contact', ({ id }) => this.#contact(id));
    this.listen(this.buyMatches, 'change', () => this.#render());
    this.listen(this.session, 'change', () => this.#start());
    this.#start();
  }

  #start() {
    const { status, user, school } = this.session.state;
    if (status === SessionModel.STATUS.LOADING || this.started) return;
    if (status !== SessionModel.STATUS.READY) { location.hash = '#/'; return; }
    this.started = true;
    this.buyMatches.load({ userId: user.id, schoolId: school.id });
    this.#render();
  }

  /**
   * Abre WhatsApp en una pestaña nueva. La pestaña se abre YA (dentro del click) para que
   * el navegador no la bloquee, y se le pone la dirección cuando llega el número.
   */
  async #contact(sellerId) {
    const tab = window.open('', '_blank');
    const { fullName, school } = this.session.state;
    const link = await this.buyMatches.contact(sellerId, { buyerName: fullName, schoolName: school?.name });
    if (!link) { tab?.close(); return; }
    if (tab) tab.location.href = link;
    else location.href = link;
  }

  #render() {
    if (!this.started) return;
    this.view.render(this.buyMatches.state);
  }
}
