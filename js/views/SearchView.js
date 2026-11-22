import { View } from '../core/View.js';
import { esc } from '../utils/html.js';
import { bookInfo } from './bookInfo.js';

/**
 * Pantalla "Busco".
 *
 * Acciones que emite:
 *   'grade' {id} · 'toggle' {id} · 'toggle-all'
 *   'save' · 'discard' · 'matches'
 */
export class SearchView extends View {
  template(s) {
    return `
      <a class="back" href="#/">← Inicio</a>
      <div class="page-head">
        <div>
          <h1 class="page-title">Busco</h1>
          <p class="page-lead">Marcá los libros que necesitás y guardá. Después te mostramos qué mamá tiene más de tu lista.</p>
        </div>
      </div>

      ${s.error ? `<div class="alert" role="alert">${esc(s.error)}</div>` : ''}
      ${s.notice ? `<div class="notice" role="status">✓ ${esc(s.notice)}</div>` : ''}

      ${this.#tabs(s)}
      ${this.#panel(s)}
      ${this.#bar(s)}`;
  }

  // ------------------------------------------------------------------
  #tabs({ grades, gradeId, selectedByGrade }) {
    if (!grades.length) return '';
    return `
      <nav class="tabs" aria-label="Grados">
        ${grades.map(g => `
          <button class="tab ${g.id === gradeId ? 'active' : ''} ${g.bookCount ? '' : 'no-books'}" data-action="grade" data-id="${g.id}">
            ${esc(g.name.replace(/\s*grado$/i, ''))}
            ${selectedByGrade[g.id] ? `<span class="badge">${selectedByGrade[g.id]}</span>` : ''}
          </button>`).join('')}
      </nav>`;
  }

  #panel({ grades, gradeId, books, selected, available, loading }) {
    const grade = grades.find(g => g.id === gradeId);
    if (!grade) return '<p class="muted pad">Tu escuela todavía no cargó grados.</p>';
    const allOn = books.length && books.every(b => selected.has(b.id));
    return `
      <section class="panel">
        <div class="panel-head">
          <h2>${esc(grade.name)}</h2>
          ${books.length && !loading
            ? `<button class="link-btn inline small" data-action="toggle-all">${allOn ? 'Desmarcar todos' : 'Marcar todos'}</button>`
            : ''}
        </div>
        ${loading ? '<p class="muted pad">Cargando…</p>'
          : !books.length ? '<p class="muted pad">La escuela todavía no cargó libros para este grado.</p>'
          : `<ul class="book-list">${books.map(b => this.#row(b, selected.has(b.id), available[b.id] ?? 0)).join('')}</ul>`}
      </section>`;
  }

  #row(book, on, available) {
    return `
      <li>
        <button class="pick-row ${on ? 'on' : ''}" data-action="toggle" data-id="${book.id}"
                role="checkbox" aria-checked="${on}">
          <span class="check" aria-hidden="true">${on ? '✓' : ''}</span>
          <span class="book-main">
            ${bookInfo(book, { tags: available
              ? `<span class="tag ok">${available} ${available === 1 ? 'mamá lo tiene' : 'mamás lo tienen'}</span>`
              : '<span class="tag">nadie lo ofrece todavía</span>' })}
          </span>
        </button>
      </li>`;
  }

  #bar({ selected, saved, isDirty, saving }) {
    const n = selected.size;
    return `
      <div class="action-bar">
        <div class="bar-info">
          <strong>${n} ${n === 1 ? 'libro marcado' : 'libros marcados'}</strong>
          ${isDirty
            ? `<span class="bar-warn">Cambios sin guardar · <button class="link-btn inline small" data-action="discard" ${saving ? 'disabled' : ''}>Deshacer</button></span>`
            : saved.size ? '<span class="muted">Todo guardado</span>' : ''}
        </div>
        <div class="bar-buttons">
          <button class="btn btn-light sm" data-action="save" ${!isDirty || saving ? 'disabled' : ''}>
            ${saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button class="btn btn-primary sm" data-action="matches" ${!n || saving ? 'disabled' : ''}>
            Ver quién los tiene →
          </button>
        </div>
      </div>`;
  }
}
