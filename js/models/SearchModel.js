import { Model } from '../core/Model.js';

/**
 * "Busco": la mamá marca los libros que necesita y los guarda.
 *
 * Trabaja con una copia local de la selección: marcar/desmarcar no toca la base
 * hasta que toca "Guardar". Ahí se calcula la diferencia y se agregan/quitan solo los cambios.
 */
export class SearchModel extends Model {
  #context = null; // "usuaria|escuela" de la última carga

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
      saved: new Set(),      // ids de libros guardados en la base
      selected: new Set(),   // ids marcados en pantalla (copia de trabajo)
      gradeOf: {},           // { bookId: gradeId } para contar por pestaña
      available: {},         // { bookId: cuántas otras mamás lo tienen disponible }
      loading: true,
      saving: false,
      notice: null,
      error: null,
    });
    this.catalogRepo = catalogRepo;
    this.wantRepo = wantRepo;
    this.offerRepo = offerRepo;
  }

  /** ¿Hay cambios sin guardar? */
  get isDirty() {
    const { saved, selected } = this.state;
    if (saved.size !== selected.size) return true;
    for (const id of selected) if (!saved.has(id)) return true;
    return false;
  }

  /** Cuántos libros marcados hay en cada grado: { gradeId: cantidad } */
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

      const saved = new Set(mine.map(w => w.book_id));
      // Si salió de la pantalla sin guardar, al volver conserva lo que había marcado.
      const sameContext = this.#context === `${userId}|${schoolId}`;
      const selected = sameContext && this.isDirty ? new Set(this.state.selected) : new Set(saved);
      this.#context = `${userId}|${schoolId}`;

      const gradeOf = { ...(sameContext ? this.state.gradeOf : {}), ...Object.fromEntries(mine.map(w => [w.book_id, w.book.grade_id])) };
      const keep = grades.find(g => g.id === this.state.gradeId && counts[g.id]);
      const firstWithBooks = grades.find(g => counts[g.id]);
      this.setState({
        grades: grades.map(g => ({ ...g, bookCount: counts[g.id] ?? 0 })),
        saved,
        selected,
        gradeOf,
        gradeId: (keep ?? firstWithBooks ?? grades[0])?.id ?? null,
      });
      await this.#loadBooks();
    } catch (err) {
      this.#fail(err);
    }
  }

  /** Cambiar de grado NO pierde lo marcado: la selección es de toda la escuela. */
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

  // ---------- Selección ----------
  toggle(bookId) {
    const id = Number(bookId);
    const selected = new Set(this.state.selected);
    selected.has(id) ? selected.delete(id) : selected.add(id);
    this.setState({ selected, notice: null, error: null });
  }

  /** Marca todos los del grado; si ya estaban todos, los desmarca. */
  toggleAllInGrade() {
    const ids = this.state.books.map(b => b.id);
    const selected = new Set(this.state.selected);
    const allOn = ids.length && ids.every(id => selected.has(id));
    ids.forEach(id => (allOn ? selected.delete(id) : selected.add(id)));
    this.setState({ selected, notice: null, error: null });
  }

  /** Vuelve a lo que estaba guardado. */
  discard() {
    this.setState({ selected: new Set(this.state.saved), notice: null, error: null });
  }

  // ---------- Guardar ----------
  /** @returns {Promise<boolean>} true si quedó todo guardado */
  async save() {
    if (!this.isDirty) return true;
    const { saved, selected, userId } = this.state;
    const toAdd = [...selected].filter(id => !saved.has(id));
    const toRemove = [...saved].filter(id => !selected.has(id));

    this.setState({ saving: true, error: null, notice: null });
    try {
      await this.wantRepo.add(toAdd);
      await this.wantRepo.removeMany(userId, toRemove);
      this.setState({
        saved: new Set(selected),
        saving: false,
        notice: `Guardado: buscás ${selected.size} ${selected.size === 1 ? 'libro' : 'libros'}`,
      });
      return true;
    } catch (err) {
      this.#fail(err);
      this.setState({ saving: false });
      return false;
    }
  }

  #fail(err) {
    console.error('[SearchModel]', err);
    this.setState({ loading: false, error: err.message || 'Algo salió mal. Probá de nuevo.', notice: null });
  }
}
