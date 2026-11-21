/**
 * "Busco": libros que las mamás necesitan (`wants`).
 * Cada mamá crea y borra solo los suyos (lo controla RLS).
 */
export class WantRepository {
  /** @param {import('../core/ApiClient.js').ApiClient} api */
  constructor(api) {
    this.api = api;
  }

  /** Cuántas mamás buscan cada libro: { [bookId]: cantidad } */
  async countByBooks(bookIds) {
    if (!bookIds.length) return {};
    const rows = await this.api.select('wants', { select: 'book_id', book_id: `in.(${bookIds.join(',')})` });
    return rows.reduce((acc, r) => ({ ...acc, [r.book_id]: (acc[r.book_id] ?? 0) + 1 }), {});
  }

  /** Mis búsquedas, con el grado de cada libro: [{ book_id, book: { grade_id } }] */
  getMine(userId) {
    return this.api.select('wants', {
      select: 'book_id,book:books(grade_id)',
      user_id: `eq.${userId}`,
    });
  }

  add(bookIds) {
    if (!bookIds.length) return Promise.resolve([]);
    return this.api.insert('wants', bookIds.map(id => ({ book_id: id })), { returning: false });
  }

  removeMany(userId, bookIds) {
    if (!bookIds.length) return Promise.resolve();
    return this.api.remove('wants', { user_id: `eq.${userId}`, book_id: `in.(${bookIds.join(',')})` });
  }
}
