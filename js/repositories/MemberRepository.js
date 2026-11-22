/**
 * Miembros de una escuela (`school_members` + nombre de `profiles`).
 * Cambiar roles solo lo pueden hacer admins (RLS) y la base no deja la escuela sin admin.
 */
export class MemberRepository {
  /** @param {import('../core/ApiClient.js').ApiClient} api */
  constructor(api) {
    this.api = api;
  }

  /** [{ userId, fullName, role, joinedAt }] */
  async getBySchool(schoolId) {
    const rows = await this.api.select('school_members', {
      select: 'user_id,role,joined_at,profile:profiles(full_name)',
      school_id: `eq.${schoolId}`,
      order: 'joined_at.asc',
    });
    return rows.map(r => ({
      userId: r.user_id,
      fullName: r.profile?.full_name || 'Sin nombre',
      role: r.role,
      joinedAt: r.joined_at ? new Date(r.joined_at) : null,
    }));
  }

  async setRole(schoolId, userId, role) {
    const rows = await this.api.update('school_members',
      { school_id: `eq.${schoolId}`, user_id: `eq.${userId}` },
      { role });
    if (!rows?.length) throw new Error('No tenés permiso para cambiar este rol.');
    return rows[0];
  }
}
