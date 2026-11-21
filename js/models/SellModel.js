import { Model } from '../core/Model.js';
import { OfferRepository } from '../repositories/OfferRepository.js';
import { normalizeArPhone } from '../utils/phone.js';

const { AVAILABLE, RESERVED, SOLD } = OfferRepository.STATUS;

/**
 * "Vendo": qué libros ofrece la mamá, grado por grado.
 *
 * Regla: para publicar tiene que tener su WhatsApp cargado (es por donde la contactan).
 */
export class SellModel extends Model {
  /**
   * @param {object} deps
   * @param {import('../repositories/CatalogRepository.js').CatalogRepository} deps.catalogRepo
   * @param {OfferRepository} deps.offerRepo
   * @param {import('../repositories/WantRepository.js').WantRepository} deps.wantRepo
   * @param {import('../repositories/ProfileRepository.js').ProfileRepository} deps.profileRepo
   */
  constructor({ catalogRepo, offerRepo, wantRepo, profileRepo }) {
    super({
      userId: null,
      schoolId: null,
      grades: [],          // [{ id, name, sort_order, bookCount, myCount }]
      gradeId: null,
      books: [],           // libros visibles del grado elegido
      offers: [],          // todas mis publicaciones
      wantCounts: {},      // { bookId: cuántas lo buscan }
      whatsapp: null,
      editingPhone: false,
      busyBookId: null,
      loading: true,
      notice: null,
      error: null,
    });
    this.catalogRepo = catalogRepo;
    this.offerRepo = offerRepo;
    this.wantRepo = wantRepo;
    this.profileRepo = profileRepo;
  }

  get canPublish() {
    return Boolean(this.state.whatsapp);
  }

  /**
   * La publicación que representa a cada libro: la abierta (disponible/reservado) si hay,
   * si no la última vendida. { [bookId]: offer }
   */
  get offerByBook() {
    const map = {};
    for (const o of this.state.offers) {           // vienen de la más nueva a la más vieja
      const current = map[o.book_id];
      if (!current || (current.status === SOLD && o.status !== SOLD)) map[o.book_id] = o;
    }
    return map;
  }

  /** Cantidad de libros que estoy ofreciendo ahora (no vendidos). */
  get openCount() {
    return Object.values(this.offerByBook).filter(o => o.status !== SOLD).length;
  }

  // ---------- Carga ----------
  async load({ userId, schoolId }) {
    this.setState({ userId, schoolId, loading: true, error: null, notice: null });
    try {
      const [grades, offers, whatsapp] = await Promise.all([
        this.catalogRepo.getGrades(schoolId),
        this.offerRepo.getMine(userId),
        this.profileRepo.getMyWhatsapp(userId),
      ]);
      const counts = await this.catalogRepo.countActiveByGrade(grades.map(g => g.id));
      const gradeIds = new Set(grades.map(g => g.id));
      const schoolOffers = offers.filter(o => gradeIds.has(o.book?.grade_id));

      const keep = grades.find(g => g.id === this.state.gradeId && counts[g.id]);
      const firstWithBooks = grades.find(g => counts[g.id]);
      this.setState({
        grades: grades.map(g => ({ ...g, bookCount: counts[g.id] ?? 0 })),
        offers: schoolOffers,
        whatsapp,
        editingPhone: !whatsapp,
        gradeId: (keep ?? firstWithBooks ?? grades[0])?.id ?? null,
      });
      this.#refreshMyCounts();
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
    const { gradeId } = this.state;
    if (!gradeId) { this.setState({ books: [], loading: false }); return; }
    try {
      const books = await this.catalogRepo.getActiveBooks(gradeId);
      const wantCounts = await this.wantRepo.countByBooks(books.map(b => b.id));
      this.setState({ books, wantCounts, loading: false });
    } catch (err) {
      this.#fail(err);
    }
  }

  // ---------- WhatsApp ----------
  editPhone() {
    this.setState({ editingPhone: true, notice: null, error: null });
  }

  cancelPhone() {
    if (this.state.whatsapp) this.setState({ editingPhone: false, error: null });
  }

  async savePhone(input) {
    const whatsapp = normalizeArPhone(input);
    if (!whatsapp) {
      return this.#error('Ese número no parece un celular. Escribilo con código de área, por ejemplo 11 2345 6789.');
    }
    try {
      await this.profileRepo.saveMyWhatsapp(this.state.userId, whatsapp);
      this.setState({ whatsapp, editingPhone: false, notice: 'WhatsApp guardado', error: null });
      return true;
    } catch (err) {
      this.#fail(err);
      return false;
    }
  }

  // ---------- Publicaciones ----------
  /** "Lo tengo": publica el libro (o lo vuelve a publicar si el anterior ya se vendió). */
  async offer(bookId) {
    if (!this.canPublish) return this.#error('Primero cargá tu WhatsApp, así te pueden contactar.');
    const id = Number(bookId);
    const current = this.offerByBook[id];
    if (current && current.status !== SOLD) return;
    await this.#run(id, async () => {
      const created = await this.offerRepo.create(id);
      const book = this.state.books.find(b => b.id === id);
      this.setState({
        offers: [{ ...created, book: { grade_id: this.state.gradeId } }, ...this.state.offers],
        notice: `Publicaste "${book?.title ?? 'el libro'}"`,
      });
    });
  }

  async setStatus(offerId, status) {
    if (![AVAILABLE, RESERVED, SOLD].includes(status)) return;
    const id = Number(offerId);
    const offer = this.state.offers.find(o => o.id === id);
    if (!offer || offer.status === status) return;
    await this.#run(offer.book_id, async () => {
      await this.offerRepo.setStatus(id, status);
      const labels = { [AVAILABLE]: 'disponible', [RESERVED]: 'reservado', [SOLD]: 'vendido' };
      this.setState({
        offers: this.state.offers.map(o => (o.id === id ? { ...o, status } : o)),
        notice: `Marcado como ${labels[status]}`,
      });
    });
  }

  async remove(offerId) {
    const id = Number(offerId);
    const offer = this.state.offers.find(o => o.id === id);
    if (!offer) return;
    await this.#run(offer.book_id, async () => {
      await this.offerRepo.remove(id);
      this.setState({ offers: this.state.offers.filter(o => o.id !== id), notice: 'Publicación quitada' });
    });
  }

  // ---------- Helpers ----------
  async #run(bookId, fn) {
    this.setState({ busyBookId: bookId, error: null, notice: null });
    try {
      await fn();
    } catch (err) {
      this.#fail(err);
    } finally {
      this.setState({ busyBookId: null });
      this.#refreshMyCounts();
    }
  }

  /** Cuántos libros tengo publicados (no vendidos) en cada grado, para las pestañas. */
  #refreshMyCounts() {
    const open = Object.values(this.offerByBook).filter(o => o.status !== SOLD);
    const byGrade = open.reduce((acc, o) => ({ ...acc, [o.book?.grade_id]: (acc[o.book?.grade_id] ?? 0) + 1 }), {});
    this.setState({ grades: this.state.grades.map(g => ({ ...g, myCount: byGrade[g.id] ?? 0 })) });
  }

  #error(message) {
    this.setState({ error: message, notice: null });
    return false;
  }

  #fail(err) {
    console.error('[SellModel]', err);
    this.setState({ loading: false, error: err.message || 'Algo salió mal. Probá de nuevo.', notice: null });
  }
}
