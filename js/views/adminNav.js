/**
 * Selector de sección compartido por las pantallas de Administrar.
 * @param {'libros'|'miembros'} active
 */
export const adminNav = (active) => `
  <nav class="section-nav" aria-label="Secciones de administración">
    <a class="section-link ${active === 'libros' ? 'on' : ''}" href="#/admin">📚 Libros</a>
    <a class="section-link ${active === 'miembros' ? 'on' : ''}" href="#/admin/miembros">👥 Miembros</a>
  </nav>`;
