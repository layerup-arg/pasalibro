/**
 * Catálogo de cada escuela: grados (`grades`) y libros por grado (`books`).
 * Escribir solo lo pueden hacer admins (lo controla RLS en Supabase).
 */
export class CatalogRepository {
  /** @param {import('../core/ApiClient.js').ApiClient} api */
  constructor(api) {
    this.api = api;
  }

  // ---------- Grados ----------
  getGrades(schoolId) {
    return this.api.select('grades', {
      select: 'id,name,sort_order',
      school_id: `eq.${schoolId}`,
      order: 'sort_order.asc,name.asc',
    });
  }

  async addGrade(schoolId, name, sortOrder) {
    const [row] = await this.api.insert('grades', { school_id: schoolId, name, sort_order: sortOrder });
    return row;
  }

  // ---------- Libros ----------
  /** Todos los libros del grado, incluidos los ocultos (para el admin). */
  getBooks(gradeId) {
    return this.api.select('books', {
      select: 'id,title,estimated_price,active',
      grade_id: `eq.${gradeId}`,
      order: 'title.asc',
    });
  }

  /** @param {Array<{title: string, estimated_price: number|null}>} books */
  addBooks(gradeId, books) {
    return this.api.insert('books', books.map(b => ({ grade_id: gradeId, ...b })));
  }

  async updateBook(id, changes) {
    const [row] = await this.api.update('books', { id: `eq.${id}` }, changes);
    return row;
  }

  deleteBook(id) {
    return this.api.remove('books', { id: `eq.${id}` });
  }
}
