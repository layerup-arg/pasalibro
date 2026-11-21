/**
 * Perfil de la usuaria (`profiles`) y su WhatsApp privado (`profile_contact`).
 */
export class ProfileRepository {
  /** @param {import('../core/ApiClient.js').ApiClient} api */
  constructor(api) {
    this.api = api;
  }

  async getById(userId) {
    const rows = await this.api.select('profiles', { select: 'id,full_name', id: `eq.${userId}` });
    return rows[0] ?? null;
  }

  async getMyWhatsapp(userId) {
    const rows = await this.api.select('profile_contact', { select: 'whatsapp', user_id: `eq.${userId}` });
    return rows[0]?.whatsapp ?? null;
  }

  saveMyWhatsapp(userId, whatsapp) {
    return this.api.upsert('profile_contact', { user_id: userId, whatsapp, updated_at: new Date().toISOString() });
  }
}
