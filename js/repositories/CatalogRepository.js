import { compareBooks } from '../utils/language.js';

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
  /** Todos los libros del grado, incluidos los ocultos (para el admin). Ordenados por idioma y título. */
  async getBooks(gradeId) {
    const rows = await this.api.select('books', {
      select: 'id,title,author,publisher,estimated_price,language,active',
      grade_id: `eq.${gradeId}`,
    });
    return rows.sort(compareBooks);
  }

  /** Solo los libros visibles para las familias. Ordenados por idioma y título. */
  async getActiveBooks(gradeId) {
    const rows = await this.api.select('books', {
      select: 'id,title,author,publisher,estimated_price,language',
      grade_id: `eq.${gradeId}`,
      active: 'eq.true',
    });
    return rows.sort(compareBooks);
  }

  /** Cantidad de libros visibles por grado: { [gradeId]: cantidad } */
  async countActiveByGrade(gradeIds) {
    if (!gradeIds.length) return {};
    const rows = await this.api.select('books', {
      select: 'grade_id',
      grade_id: `in.(${gradeIds.join(',')})`,
      active: 'eq.true',
    });
    return rows.reduce((acc, r) => ({ ...acc, [r.grade_id]: (acc[r.grade_id] ?? 0) + 1 }), {});
  }

  /** @param {Array<{title: string, author: string|null, publisher: string|null, estimated_price: number|null}>} books */
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
