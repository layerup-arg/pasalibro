/**
 * "Busco": libros que las mamás necesitan (`wants`).
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
}
