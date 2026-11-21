import { Model } from '../core/Model.js';

/**
 * Estado general de la app: conexión a la base, datos de la escuela y versión.
 * Es compartido: lo usan el layout (nombre de la escuela) y la pantalla de inicio.
 */
export class AppStatusModel extends Model {
  static DB = Object.freeze({ LOADING: 'loading', OK: 'ok', ERROR: 'error', UNCONFIGURED: 'unconfigured' });

  /**
   * @param {object} deps
   * @param {import('../repositories/ConfigRepository.js').ConfigRepository} deps.configRepo
   * @param {import('../repositories/VersionRepository.js').VersionRepository} deps.versionRepo
   * @param {boolean} deps.isConfigured
   */
  constructor({ configRepo, versionRepo, isConfigured }) {
    super({
      db: AppStatusModel.DB.LOADING,
      schoolName: null,
      version: null,
      error: null,
    });
    this.configRepo = configRepo;
    this.versionRepo = versionRepo;
    this.isConfigured = isConfigured;
  }

  async load() {
    await Promise.all([this.#loadConfig(), this.#loadVersion()]);
  }

  async #loadConfig() {
    if (!this.isConfigured) {
      this.setState({ db: AppStatusModel.DB.UNCONFIGURED });
      return;
    }
    try {
      const config = await this.configRepo.getAll();
      this.setState({ db: AppStatusModel.DB.OK, schoolName: config.school_name ?? null });
    } catch (err) {
      console.error('[AppStatusModel] config', err);
      this.setState({ db: AppStatusModel.DB.ERROR, error: err.message });
    }
  }

  async #loadVersion() {
    try {
      this.setState({ version: await this.versionRepo.getLatest() });
    } catch {
      this.setState({ version: { sha: 'local', date: null } });
    }
  }
}
