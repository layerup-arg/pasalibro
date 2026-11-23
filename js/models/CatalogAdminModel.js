import { Model } from '../core/Model.js';
import { DEFAULT_LANGUAGE, parseLanguage } from '../utils/language.js';
import { parsePrice } from '../utils/format.js';

/**
 * Estado y reglas de la pantalla Administrar:
 * grados de una escuela, grado elegido y sus libros.
 */
export class CatalogAdminModel extends Model {
  /** @param {import('../repositories/CatalogRepository.js').CatalogRepository} catalogRepo */
  constructor(catalogRepo) {
    super({
      schoolId: null,
      grades: [],
      gradeId: null,
      books: [],
      loading: true,
      editingId: null,   // libro en edición
      notice: null,      // mensaje de éxito
      error: null,
    });
    this.repo = catalogRepo;
  }

  get currentGrade() {
    const { grades, gradeId } = this.state;
    return grades.find(g => g.id === gradeId) ?? null;
  }

  // ---------- Carga ----------
  async load(schoolId, preferredGradeId = null) {
    this.setState({ schoolId, loading: true, error: null, notice: null });
    try {
      const grades = await this.repo.getGrades(schoolId);
      const keep = grades.find(g => g.id === (preferredGradeId ?? this.state.gradeId));
      const gradeId = keep?.id ?? grades[0]?.id ?? null;
      this.setState({ grades, gradeId });
      await this.#loadBooks();
    } catch (err) {
      this.#fail(err);
    }
  }

  async selectGrade(gradeId) {
    this.setState({ gradeId: Number(gradeId), editingId: null, notice: null, error: null, loading: true });
    await this.#loadBooks();
  }

  async #loadBooks() {
    const { gradeId } = this.state;
    if (!gradeId) { this.setState({ books: [], loading: false }); return; }
    try {
      const books = await this.repo.getBooks(gradeId);
      this.setState({ books, loading: false });
    } catch (err) {
      this.#fail(err);
    }
  }

  // ---------- Libros ----------
  /**
   * Agrega uno o varios libros. Una línea por libro, campos separados por ";":
   *   título ; autor ; editorial ; precio ; idioma     (solo el título es obligatorio; idioma: en/es, por defecto es)
   *   "El Equipo de Mate 3"
   *   "El Nombre Secreto ; Fulana ; Editorial Sur ; 25000"
   *   "El Equipo de Mate 3 ; 25000"            (formato viejo: título ; precio, sigue andando)
   */
  async addBooks(text) {
    const { books, gradeId } = this.state;
    const { items, invalid } = CatalogAdminModel.parseLines(text);
    if (invalid.length) return this.#error(`Precio o idioma inválido en: ${invalid.join(', ')}`);
    if (!items.length) return this.#error('Escribí al menos un título.');

    const existing = new Set(books.map(b => b.title.toLowerCase()));
    const seen = new Set();
    const toAdd = items.filter(b => {
      const key = b.title.toLowerCase();
      if (existing.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const skipped = items.length - toAdd.length;
    if (!toAdd.length) return this.#error('Esos libros ya estaban cargados en este grado.');

    try {
      await this.repo.addBooks(gradeId, toAdd);
      await this.#loadBooks();
      const msg = `${toAdd.length} ${toAdd.length === 1 ? 'libro agregado' : 'libros agregados'}`;
      this.setState({ notice: skipped ? `${msg} (${skipped} ya estaban)` : msg, error: null });
      return true;
    } catch (err) {
      this.#fail(err);
      return false;
    }
  }

  startEdit(id) {
    this.setState({ editingId: Number(id), notice: null, error: null });
  }

  cancelEdit() {
    this.setState({ editingId: null });
  }

  async saveBook(id, { title, author, publisher, price, language }) {
    const cleanTitle = String(title ?? '').trim();
    const estimated_price = parsePrice(price);
    if (!cleanTitle) return this.#error('El título no puede quedar vacío.');
    if (Number.isNaN(estimated_price)) return this.#error('El precio tiene que ser un número.');
    const dup = this.state.books.some(b => b.id !== Number(id) && b.title.toLowerCase() === cleanTitle.toLowerCase());
    if (dup) return this.#error('Ya hay otro libro con ese título en este grado.');

    try {
      await this.repo.updateBook(id, {
        title: cleanTitle,
        author: CatalogAdminModel.clean(author),
        publisher: CatalogAdminModel.clean(publisher),
        estimated_price,
        language: parseLanguage(language) ?? DEFAULT_LANGUAGE,
      });
      this.setState({ editingId: null, notice: 'Cambios guardados', error: null });
      await this.#loadBooks();
    } catch (err) {
      this.#fail(err);
    }
  }

  async toggleActive(id) {
    const book = this.state.books.find(b => b.id === Number(id));
    if (!book) return;
    try {
      await this.repo.updateBook(book.id, { active: !book.active });
      this.setState({ notice: book.active ? 'Libro oculto para las familias' : 'Libro visible otra vez', error: null });
      await this.#loadBooks();
    } catch (err) {
      this.#fail(err);
    }
  }

  async deleteBook(id) {
    try {
      await this.repo.deleteBook(id);
      this.setState({ notice: 'Libro borrado', error: null, editingId: null });
      await this.#loadBooks();
    } catch (err) {
      this.#fail(err);
    }
  }

  // ---------- Grados ----------
  async addGrade(name) {
    const clean = String(name ?? '').trim();
    if (!clean) return this.#error('Escribí el nombre del grado.');
    if (this.state.grades.some(g => g.name.toLowerCase() === clean.toLowerCase())) {
      return this.#error('Ese grado ya existe.');
    }
    const nextOrder = Math.max(0, ...this.state.grades.map(g => g.sort_order)) + 1;
    try {
      const grade = await this.repo.addGrade(this.state.schoolId, clean, nextOrder);
      await this.load(this.state.schoolId, grade.id);
      this.setState({ notice: `Grado "${clean}" creado` });
      return true;
    } catch (err) {
      this.#fail(err);
      return false;
    }
  }

  // ---------- Helpers ----------
  /**
   * Separa el texto pegado en { items: [{title, author, publisher, estimated_price, language}], invalid: [títulos con precio o idioma mal] }
   * Formato por línea: título ; autor ; editorial ; precio ; idioma  (también acepta tabs, por si se pega desde una planilla)
   */
  static parseLines(text) {
    const items = [];
    const invalid = [];
    String(text ?? '').split(/\r?\n/).forEach(line => {
      const parts = line.split(/[;\t]/).map(p => p.trim());
      const title = (parts[0] ?? '').replace(/^\s*[-•*·]\s*/, '').trim();
      if (!title) return;

      let [, author = '', publisher = '', rawPrice = '', rawLang = ''] = parts;
      // Formato viejo "título ; precio": si hay solo 2 campos y el segundo es un número, es el precio.
      if (parts.length === 2 && author && !Number.isNaN(parsePrice(author))) {
        rawPrice = author;
        author = '';
      }
      const estimated_price = parsePrice(rawPrice);
      const language = rawLang ? parseLanguage(rawLang) : DEFAULT_LANGUAGE;
      if (Number.isNaN(estimated_price) || !language) { invalid.push(title); return; }
      items.push({
        title,
        author: CatalogAdminModel.clean(author),
        publisher: CatalogAdminModel.clean(publisher),
        estimated_price,
        language,
      });
    });
    return { items, invalid };
  }

  /** Texto opcional: vacío → null. */
  static clean(value) {
    const v = String(value ?? '').trim();
    return v || null;
  }

  #error(message) {
    this.setState({ error: message, notice: null });
    return false;
  }

  #fail(err) {
    console.error('[CatalogAdminModel]', err);
    this.setState({ loading: false, error: err.message || 'Algo salió mal. Probá de nuevo.', notice: null });
  }
}
