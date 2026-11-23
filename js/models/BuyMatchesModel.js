import { Model } from '../core/Model.js';
import { whatsappLink } from '../utils/phone.js';

/**
 * Coincidencias desde Compro (#/coincidencias/busco):
 * qué usuarios tienen disponibles libros de mi lista, ordenados por cuántos tienen.
 * El objetivo es comprarle lo más posible a la misma persona.
 */
export class BuyMatchesModel extends Model {
  /**
   * @param {object} deps
   * @param {import('../repositories/CatalogRepository.js').CatalogRepository} deps.catalogRepo
   * @param {import('../repositories/WantRepository.js').WantRepository} deps.wantRepo
   * @param {import('../repositories/OfferRepository.js').OfferRepository} deps.offerRepo
   */
  constructor({ catalogRepo, wantRepo, offerRepo }) {
    super({
      loading: true,
      error: null,
      gradeNames: {},   // { gradeId: '3° grado' }
      myBooks: [],      // libros de mi lista (de esta escuela)
      sellers: [],      // ver #buildSellers
      openId: null,     // usuario con el panel abierto
      contactingId: null, // usuario al que se está contactando
    });
    this.catalogRepo = catalogRepo;
    this.wantRepo = wantRepo;
    this.offerRepo = offerRepo;
  }

  async load({ userId, schoolId }) {
    this.setState({ loading: true, error: null, openId: null });
    try {
      const [grades, wants] = await Promise.all([
        this.catalogRepo.getGrades(schoolId),
        this.wantRepo.getMineWithBooks(userId),
      ]);
      const order = Object.fromEntries(grades.map(g => [g.id, g.sort_order]));
      const inSchool = book => book && book.active !== false && book.grade_id in order;
      const byGradeThenTitle = (a, b) => (order[a.grade_id] - order[b.grade_id]) || a.title.localeCompare(b.title);

      const myBooks = wants.map(w => w.book).filter(inSchool).sort(byGradeThenTitle);
      const sellerIds = await this.offerRepo.getSellersOf(myBooks.map(b => b.id), userId);
      const offers = await this.offerRepo.getAvailableBySellers(sellerIds);

      this.setState({
        gradeNames: Object.fromEntries(grades.map(g => [g.id, g.name])),
        myBooks,
        sellers: this.#buildSellers(offers.filter(o => inSchool(o.book)), myBooks, byGradeThenTitle),
        loading: false,
      });
    } catch (err) {
      console.error('[BuyMatchesModel]', err);
      this.setState({ loading: false, error: err.message || 'No pudimos cargar las coincidencias.' });
    }
  }

  /** Abre el panel de un usuario (o lo cierra si ya estaba abierto). */
  toggle(sellerId) {
    this.setState({ openId: this.state.openId === sellerId ? null : sellerId, error: null });
  }

  /**
   * "Iniciar contacto": registra el contacto y devuelve el link de WhatsApp
   * con un saludo y la lista de libros de mi lista que tiene ese vendedor.
   * @returns {Promise<string|null>} link a wa.me, o null si falló (queda el error en el estado)
   */
  async contact(sellerId, { buyerName, schoolName }) {
    const seller = this.state.sellers.find(s => s.id === sellerId);
    if (!seller) return null;
    this.setState({ contactingId: sellerId, error: null });
    try {
      const res = await this.offerRepo.contactSeller(seller.matches.map(b => b.offerId));
      if (!res?.whatsapp) throw new Error(`${seller.name} no tiene un WhatsApp cargado.`);
      const text = this.#message({ seller: res.seller_name || seller.name, books: seller.matches, buyerName, schoolName });
      return whatsappLink(res.whatsapp, text);
    } catch (err) {
      console.error('[BuyMatchesModel]', err);
      this.setState({ error: err.message || 'No pudimos iniciar el contacto.' });
      return null;
    } finally {
      this.setState({ contactingId: null });
    }
  }

  #message({ seller, books, buyerName, schoolName }) {
    const first = s => (s || '').trim().split(/\s+/)[0];
    const { gradeNames } = this.state;
    return [
      `¡Hola ${first(seller)}! Soy ${first(buyerName)}${schoolName ? `, de ${schoolName}` : ''}. 👋`,
      `Vi en PasaLibro que tenés estos libros que estoy buscando:`,
      '',
      ...books.map(b => `• ${b.title}${gradeNames[b.grade_id] ? ` (${gradeNames[b.grade_id]})` : ''}`),
      '',
      `¿Siguen disponibles? ¡Gracias!`,
    ].join('\n');
  }

  /**
   * Arma, por usuario:
   *   { id, name, matches: [libro], missing: [libro], others: [libro], matchTotal }
   *   matches = de mi lista que tiene · missing = de mi lista que no tiene · others = otros que vende
   * Ordenados por más coincidencias; a igualdad, por mayor monto de referencia y luego por nombre.
   */
  #buildSellers(offers, myBooks, sortBooks) {
    const wanted = new Set(myBooks.map(b => b.id));
    const bySeller = new Map();
    for (const o of offers) {
      if (!bySeller.has(o.seller_id)) {
        bySeller.set(o.seller_id, { id: o.seller_id, name: o.seller?.full_name || 'Usuario', books: new Map() });
      }
      bySeller.get(o.seller_id).books.set(o.book.id, { ...o.book, offerId: o.id });
    }

    return [...bySeller.values()]
      .map(s => {
        const books = [...s.books.values()];
        const matches = books.filter(b => wanted.has(b.id)).sort(sortBooks);
        const others = books.filter(b => !wanted.has(b.id)).sort(sortBooks);
        const has = new Set(matches.map(b => b.id));
        return {
          id: s.id,
          name: s.name,
          matches,
          missing: myBooks.filter(b => !has.has(b.id)),
          others,
          matchTotal: matches.reduce((sum, b) => sum + (Number(b.estimated_price) || 0), 0),
        };
      })
      .filter(s => s.matches.length)
      .sort((a, b) => (b.matches.length - a.matches.length) || (b.matchTotal - a.matchTotal) || a.name.localeCompare(b.name));
  }
}
