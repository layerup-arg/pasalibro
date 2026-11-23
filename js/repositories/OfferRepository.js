/**
 * "Vendo": publicaciones de libros (`offers`).
 * Cada mamá solo puede crear, cambiar y borrar las suyas (lo controla RLS).
 */
export class OfferRepository {
  static STATUS = Object.freeze({ AVAILABLE: 'available', RESERVED: 'reserved', SOLD: 'sold' });

  /** @param {import('../core/ApiClient.js').ApiClient} api */
  constructor(api) {
    this.api = api;
  }

  /** Mis publicaciones (todas, la más nueva primero), con el grado de cada libro. */
  getMine(userId) {
    return this.api.select('offers', {
      select: 'id,book_id,status,created_at,book:books(grade_id)',
      seller_id: `eq.${userId}`,
      order: 'created_at.desc',
    });
  }

  /** Cuántas OTRAS mamás tienen disponible cada libro: { [bookId]: cantidad } */
  async countAvailableByBooks(bookIds, excludeUserId) {
    if (!bookIds.length) return {};
    const rows = await this.api.select('offers', {
      select: 'book_id,seller_id',
      book_id: `in.(${bookIds.join(',')})`,
      status: `eq.${OfferRepository.STATUS.AVAILABLE}`,
    });
    return rows
      .filter(r => r.seller_id !== excludeUserId)
      .reduce((acc, r) => ({ ...acc, [r.book_id]: (acc[r.book_id] ?? 0) + 1 }), {});
  }

  /** Ids de los OTROS usuarios que tienen disponible alguno de estos libros. */
  async getSellersOf(bookIds, excludeUserId) {
    if (!bookIds.length) return [];
    const rows = await this.api.select('offers', {
      select: 'seller_id',
      book_id: `in.(${bookIds.join(',')})`,
      status: `eq.${OfferRepository.STATUS.AVAILABLE}`,
      seller_id: `neq.${excludeUserId}`,
    });
    return [...new Set(rows.map(r => r.seller_id))];
  }

  /** Todo lo que tienen disponible estos usuarios, con el nombre y los datos del libro. */
  getAvailableBySellers(sellerIds) {
    if (!sellerIds.length) return Promise.resolve([]);
    return this.api.select('offers', {
      select: 'id,book_id,seller_id,seller:profiles(full_name),book:books(id,title,author,publisher,estimated_price,language,grade_id,active)',
      seller_id: `in.(${sellerIds.join(',')})`,
      status: `eq.${OfferRepository.STATUS.AVAILABLE}`,
    });
  }

  /**
   * "Contactar": registra el contacto por estas publicaciones (todas del mismo vendedor)
   * y devuelve { seller_name, whatsapp }. El WhatsApp es privado: solo se obtiene por acá.
   */
  async contactSeller(offerIds) {
    const rows = await this.api.rpc('contact_seller', { p_offers: offerIds });
    return rows?.[0] ?? null;
  }

  async create(bookId) {
    const [row] = await this.api.insert('offers', { book_id: bookId });
    return row;
  }

  async setStatus(offerId, status) {
    const [row] = await this.api.update('offers', { id: `eq.${offerId}` }, { status });
    return row;
  }

  remove(offerId) {
    return this.api.remove('offers', { id: `eq.${offerId}` });
  }

  /** Borra todas mis publicaciones de un libro (abiertas y vendidas): el libro queda "limpio". */
  removeAllForBook(userId, bookId) {
    return this.api.remove('offers', { seller_id: `eq.${userId}`, book_id: `eq.${bookId}` });
  }
}
