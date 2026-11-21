/**
 * Escuelas y membresías (`schools`, `school_members`) + RPC join_school.
 */
export class SchoolRepository {
  /** @param {import('../core/ApiClient.js').ApiClient} api */
  constructor(api) {
    this.api = api;
  }

  /** Escuelas a las que pertenece la usuaria: [{ id, name, role }] */
  async getMine(userId) {
    const rows = await this.api.select('school_members', {
      select: 'role,school:schools(id,name)',
      user_id: `eq.${userId}`,
    });
    return rows
      .filter(r => r.school)
      .map(r => ({ id: r.school.id, name: r.school.name, role: r.role }));
  }

  /** Se une con el código de invitación. Devuelve el id de la escuela. */
  join(code) {
    return this.api.rpc('join_school', { p_code: code });
  }
}
