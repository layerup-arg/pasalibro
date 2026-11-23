import { Model } from '../core/Model.js';

/**
 * "Busco" / "Compro": la mamá toca "Lo quiero" en los libros que necesita.
 * Igual que en Vendo, cada click se guarda solo en la base (no hay botón Guardar).
 */
export class SearchModel extends Model {
  /**
   * @param {object} deps
   * @param {import('../repositories/CatalogRepository.js').CatalogRepository} deps.catalogRepo
   * @param {import('../repositories/WantRepository.js').WantRepository} deps.wantRepo
   * @param {import('../repositories/OfferRepository.js').OfferRepository} deps.offerRepo
   */
  constructor({ catalogRepo, wantRepo, offerRepo }) {
    super({
      userId: null,
      schoolId: null,
      grades: [],            // [{ id, name, sort_order, bookCount }]
      gradeId: null,
      books: [],             // libros visibles del grado elegido
      selected: new Set(),   // ids de libros que quiero (guardados en la base)
      gradeOf: {},           // { bookId: gradeId } para contar por pestaña
      available: {},         // { bookId: cuántos otros usuarios lo tienen disponible }
      busyBookId: null,      // libro que se está guardando
      loading: true,
      notice: null,
      error: null,
    });
    this.catalogRepo = catalogRepo;
    this.wantRepo = wantRepo;
    this.offerRepo = offerRepo;
  }

  /** Cuántos libros quiero en cada grado: { gradeId: cantidad } */
  get selectedByGrade() {
    const { selected, gradeOf } = this.state;
    const counts = {};
    for (const id of selected) counts[gradeOf[id]] = (counts[gradeOf[id]] ?? 0) + 1;
    return counts;
  }

  // ---------- Carga ----------
  async load({ userId, schoolId }) {
    this.setState({ userId, schoolId, loading: true, error: null, notice: null });
    try {
      const [grades, wants] = await Promise.all([
        this.catalogRepo.getGrades(schoolId),
        this.wantRepo.getMine(userId),
      ]);
      const counts = await this.catalogRepo.countActiveByGrade(grades.map(g => g.id));
      const gradeIds = new Set(grades.map(g => g.id));
      const mine = wants.filter(w => gradeIds.has(w.book?.grade_id));

      const keep = grades.find(g => g.id === this.state.gradeId && counts[g.id]);
      const firstWithBooks = grades.find(g => counts[g.id]);
      this.setState({
        grades: grades.map(g => ({ ...g, bookCount: counts[g.id] ?? 0 })),
        selected: new Set(mine.map(w => w.book_id)),
        gradeOf: Object.fromEntries(mine.map(w => [w.book_id, w.book.grade_id])),
        gradeId: (keep ?? firstWithBooks ?? grades[0])?.id ?? null,
      });
      await this.#loadBooks();
    } catch (err) {
      this.#fail(err);
    }
  }

  async selectGrade(gradeId) {
    this.setState({ gradeId: Number(gradeId), loading: true, notice: null, error: null });
    await this.#loadBooks();
  }

  async #loadBooks() {
    const { gradeId, userId } = this.state;
    if (!gradeId) { this.setState({ books: [], loading: false }); return; }
    try {
      const books = await this.catalogRepo.getActiveBooks(gradeId);
      const available = await this.offerRepo.countAvailableByBooks(books.map(b => b.id), userId);
      const gradeOf = { ...this.state.gradeOf };
      books.forEach(b => { gradeOf[b.id] = gradeId; });
      this.setState({ books, available, gradeOf, loading: false });
    } catch (err) {
      this.#fail(err);
    }
  }

  // ---------- Lo quiero / Quitar ----------
  /** "Lo quiero": lo agrega a mi lista y se guarda al instante. */
  async want(bookId) {
    const id = Number(bookId);
    if (this.state.selected.has(id)) return;
    await this.#run(id, async () => {
      await this.wantRepo.add([id]);
      const book = this.state.books.find(b => b.id === id);
      this.setState({
        selected: new Set([...this.state.selected, id]),
        notice: `Agregaste "${book?.title ?? 'el libro'}"`,
      });
    });
  }

  /** "Quitar": lo saca de mi lista. */
  async unwant(bookId) {
    const id = Number(bookId);
    if (!this.state.selected.has(id)) return;
    await this.#run(id, async () => {
      await this.wantRepo.removeMany(this.state.userId, [id]);
      const selected = new Set(this.state.selected);
      selected.delete(id);
      this.setState({ selected, notice: 'Quitado de tu lista' });
    });
  }

  async #run(bookId, fn) {
    this.setState({ busyBookId: bookId, error: null, notice: null });
    try {
      await fn();
    } catch (err) {
      this.#fail(err);
    } finally {
      this.setState({ busyBookId: null });
    }
  }

  #fail(err) {
    console.error('[SearchModel]', err);
    this.setState({ loading: false, error: err.message || 'Algo salió mal. Probá de nuevo.', notice: null });
  }
}
