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
}
