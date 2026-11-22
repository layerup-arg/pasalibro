import { Model } from '../core/Model.js';

/**
 * Administrar › Miembros: quiénes están en la escuela y quiénes son admin.
 *
 * Regla: la escuela siempre tiene al menos un admin.
 * La app lo respeta deshabilitando el botón, y la base lo garantiza
 * (supabase/004_un_admin_minimo.sql) aunque se intente por otro lado.
 */
export class MembersAdminModel extends Model {
  static ROLE = Object.freeze({ ADMIN: 'admin', MEMBER: 'member' });

  /** @param {import('../repositories/MemberRepository.js').MemberRepository} memberRepo */
  constructor(memberRepo) {
    super({
      schoolId: null,
      members: [],
      busyUserId: null,
      loading: true,
      notice: null,
      error: null,
    });
    this.repo = memberRepo;
  }

  get adminCount() {
    return this.state.members.filter(m => m.role === MembersAdminModel.ROLE.ADMIN).length;
  }

  /** ¿Se le puede quitar el admin? (no si es el único) */
  canDemote(member) {
    return member.role === MembersAdminModel.ROLE.ADMIN && this.adminCount > 1;
  }

  /** Admins primero, después por nombre. */
  get sortedMembers() {
    return [...this.state.members]
      .sort((a, b) => (a.role === b.role ? a.fullName.localeCompare(b.fullName, 'es') : a.role === 'admin' ? -1 : 1));
  }

  async load(schoolId) {
    this.setState({ schoolId, loading: true, error: null, notice: null });
    try {
      this.setState({ members: await this.repo.getBySchool(schoolId), loading: false });
    } catch (err) {
      this.#fail(err);
    }
  }

  /** @returns {Promise<boolean>} */
  async setRole(userId, role) {
    const member = this.state.members.find(m => m.userId === userId);
    if (!member || member.role === role) return false;
    if (role === MembersAdminModel.ROLE.MEMBER && !this.canDemote(member)) {
      this.setState({ error: 'La escuela tiene que tener al menos un admin.', notice: null });
      return false;
    }

    this.setState({ busyUserId: userId, error: null, notice: null });
    try {
      await this.repo.setRole(this.state.schoolId, userId, role);
      this.setState({
        members: this.state.members.map(m => (m.userId === userId ? { ...m, role } : m)),
        notice: role === MembersAdminModel.ROLE.ADMIN
          ? `${member.fullName} ahora es admin`
          : `${member.fullName} ya no es admin`,
      });
      return true;
    } catch (err) {
      this.#fail(err);
      return false;
    } finally {
      this.setState({ busyUserId: null });
    }
  }

  #fail(err) {
    console.error('[MembersAdminModel]', err);
    this.setState({ loading: false, error: err.message || 'Algo salió mal. Probá de nuevo.', notice: null });
  }
}
