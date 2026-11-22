import { View } from '../core/View.js';
import { esc } from '../utils/html.js';
import { adminNav } from './adminNav.js';

/**
 * Administrar › Miembros.
 *
 * Acciones que emite:
 *   'school' {value}                      cambiar de escuela (si administra más de una)
 *   'make-admin' {id, name}               dar rol admin
 *   'remove-admin' {id, name}             quitar rol admin
 *
 * El buscador por nombre filtra en pantalla (no redibuja), así no se pierde el foco al escribir.
 */
export class MembersView extends View {
  /** Conserva el texto del buscador entre redibujos. */
  render(data) {
    const query = this.root.querySelector('#member-filter')?.value ?? '';
    super.render(data);
    const input = this.root.querySelector('#member-filter');
    if (input && query) { input.value = query; this.#applyFilter(query); }
  }

  template({ schools, schoolId, members, meId, adminCount, canDemote, busyUserId, loading, notice, error }) {
    const school = schools.find(s => s.id === schoolId);
    return `
      <a class="back" href="#/">← Inicio</a>
      <div class="page-head">
        <h1 class="page-title">Administrar</h1>
        ${schools.length > 1 ? this.#schoolSelect(schools, schoolId) : `<p class="page-sub">${esc(school?.name ?? '')}</p>`}
      </div>
      ${adminNav('miembros')}

      ${error ? `<div class="alert" role="alert">${esc(error)}</div>` : ''}
      ${notice ? `<div class="notice" role="status">✓ ${esc(notice)}</div>` : ''}

      <section class="panel">
        <div class="panel-head">
          <h2>Miembros</h2>
          <span class="muted">${members.length} ${members.length === 1 ? 'persona' : 'personas'} · ${adminCount} ${adminCount === 1 ? 'admin' : 'admins'}</span>
        </div>
        ${members.length > 6 ? `
          <div class="pad filter-box">
            <input class="input" id="member-filter" type="search" placeholder="Buscar por nombre…" autocomplete="off">
          </div>` : ''}
        ${loading ? '<p class="muted pad">Cargando…</p>'
          : `<ul class="book-list" id="member-list">${members.map(m => this.#row(m, m.userId === meId, canDemote(m), busyUserId === m.userId)).join('')}</ul>
             <p class="muted pad no-results" hidden>Nadie coincide con esa búsqueda.</p>`}
      </section>

      <p class="hint pad">
        Los admins pueden cargar y editar grados y libros, y nombrar otros admins.
        Para que alguien aparezca acá, tiene que entrar con Google y poner el código de invitación de la escuela.
      </p>`;
  }

  afterRender() {
    this.root.querySelector('#member-filter')?.addEventListener('input', e => this.#applyFilter(e.target.value));
  }

  // ------------------------------------------------------------------
  #row(m, isMe, canDemote, busy) {
    const admin = m.role === 'admin';
    const initial = esc(m.fullName.trim().charAt(0).toUpperCase() || '?');
    const since = m.joinedAt ? `desde ${m.joinedAt.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}` : '';
    const button = admin
      ? `<button class="btn btn-light sm" data-action="remove-admin" data-id="${esc(m.userId)}" data-name="${esc(m.fullName)}" data-me="${isMe}"
                 ${!canDemote || busy ? 'disabled' : ''} title="${canDemote ? '' : 'Es el único admin de la escuela'}">
           ${busy ? '…' : 'Quitar admin'}
         </button>`
      : `<button class="btn btn-primary sm" data-action="make-admin" data-id="${esc(m.userId)}" data-name="${esc(m.fullName)}" ${busy ? 'disabled' : ''}>
           ${busy ? '…' : 'Hacer admin'}
         </button>`;
    return `
      <li class="book-row member-row" data-name="${esc(m.fullName.toLowerCase())}">
        <span class="member-avatar ${admin ? 'admin' : ''}" aria-hidden="true">${initial}</span>
        <div class="book-main">
          <span class="book-title">${esc(m.fullName)} ${isMe ? '<span class="tag">vos</span>' : ''}</span>
          <span class="book-meta">${admin ? '<span class="tag role-admin">admin</span>' : 'miembro'} ${since ? `· ${since}` : ''}</span>
        </div>
        <div class="row-actions">${button}</div>
      </li>`;
  }

  #schoolSelect(schools, schoolId) {
    return `
      <select class="input select" data-action="school" aria-label="Escuela">
        ${schools.map(s => `<option value="${esc(s.id)}" ${s.id === schoolId ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}
      </select>`;
  }

  #applyFilter(text) {
    const q = String(text).trim().toLowerCase();
    let shown = 0;
    this.root.querySelectorAll('.member-row').forEach(li => {
      const match = !q || li.dataset.name.includes(q);
      li.hidden = !match;
      if (match) shown++;
    });
    const empty = this.root.querySelector('.no-results');
    if (empty) empty.hidden = shown > 0;
  }
}
