import { Model } from '../core/Model.js';

/**
 * Quién está usando la app y a qué escuela pertenece.
 *
 * status:
 *   LOADING      → todavía no sabemos
 *   ANONYMOUS    → no inició sesión
 *   NEEDS_SCHOOL → inició sesión pero no está en ninguna escuela (pedir código)
 *   READY        → logueada y con escuela
 */
export class SessionModel extends Model {
  static STATUS = Object.freeze({
    LOADING: 'loading',
    ANONYMOUS: 'anonymous',
    NEEDS_SCHOOL: 'needs_school',
    READY: 'ready',
  });

  /**
   * @param {object} deps
   * @param {import('../core/AuthClient.js').AuthClient} deps.auth
   * @param {import('../repositories/ProfileRepository.js').ProfileRepository} deps.profileRepo
   * @param {import('../repositories/SchoolRepository.js').SchoolRepository} deps.schoolRepo
   */
  constructor({ auth, profileRepo, schoolRepo }) {
    super({
      status: SessionModel.STATUS.LOADING,
      user: null,        // { id, email }
      fullName: null,
      schools: [],       // [{ id, name, role }]
      school: null,      // escuela activa
      isAdmin: false,
      error: null,
    });
    this.auth = auth;
    this.profileRepo = profileRepo;
    this.schoolRepo = schoolRepo;

    // Si la sesión vence o se cierra desde otro lado, recargamos.
    this.auth.on('change', () => this.load());
  }

  get isReady() {
    return this.state.status === SessionModel.STATUS.READY;
  }

  async load() {
    const { STATUS } = SessionModel;
    if (!this.auth.isLoggedIn) {
      this.setState({
        status: STATUS.ANONYMOUS, user: null, fullName: null, schools: [], school: null, isAdmin: false,
        error: this.auth.lastError,
      });
      return;
    }

    const { id, email, user_metadata: meta = {} } = this.auth.user;
    try {
      const [profile, schools] = await Promise.all([
        this.profileRepo.getById(id),
        this.schoolRepo.getMine(id),
      ]);
      const school = schools[0] ?? null; // por ahora: una escuela activa
      this.setState({
        status: school ? STATUS.READY : STATUS.NEEDS_SCHOOL,
        user: { id, email },
        fullName: profile?.full_name || meta.full_name || email,
        schools,
        school,
        isAdmin: school?.role === 'admin',
        error: null,
      });
    } catch (err) {
      console.error('[SessionModel] load', err);
      this.setState({ status: STATUS.ANONYMOUS, error: 'No pudimos cargar tu cuenta. Probá de nuevo.' });
    }
  }

  loginWithGoogle() {
    this.auth.signInWithGoogle();
  }

  logout() {
    return this.auth.signOut();
  }

  /** @returns {Promise<{ok: boolean, error?: string}>} */
  async joinSchool(code) {
    const clean = String(code ?? '').trim();
    if (!clean) return { ok: false, error: 'Ingresá el código de invitación.' };
    try {
      await this.schoolRepo.join(clean);
      await this.load();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || 'No pudimos validar el código.' };
    }
  }
}
