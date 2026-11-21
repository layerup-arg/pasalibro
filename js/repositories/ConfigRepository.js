/**
 * Acceso a la tabla `pasalibro_config` (pares clave/valor).
 * Los repositorios son la ÚNICA capa que conoce nombres de tablas y columnas.
 */
export class ConfigRepository {
  static TABLE = 'pasalibro_config';

  /** @param {import('../core/ApiClient.js').ApiClient} api */
  constructor(api) {
    this.api = api;
  }

  /** Devuelve un objeto { clave: valor }. */
  async getAll() {
    const rows = await this.api.select(ConfigRepository.TABLE, { select: 'key,value' });
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  }
}
