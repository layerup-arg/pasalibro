import { View } from '../core/View.js';
import { esc } from '../utils/html.js';
import { bookInfo } from './bookInfo.js';

/**
 * Pantalla "Busco".
 *
 * Acciones que emite:
 *   'grade' {id} · 'want' {id} · 'unwant' {id} · 'matches'
 * Cada click se guarda solo (igual que Vendo).
 */
export class SearchView extends View {
  template(s) {
    return `
      <a class="back" href="#/">← Inicio</a>
      <div class="page-head">
        <div>
          <h1 class="page-title">Busco</h1>
          <p class="page-lead">Tocá "Lo quiero" en los libros que necesitás; se guarda solo. Después te mostramos qué mamá tiene más de tu lista.</p>
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

  #panel({ grades, gradeId, books, selected, available, loading, busyBookId }) {
    const grade = grades.find(g => g.id === gradeId);
    if (!grade) return '<p class="muted pad">Tu escuela todavía no cargó grados.</p>';
    const mine = books.filter(b => selected.has(b.id)).length;
    return `
      <section class="panel">
        <div class="panel-head">
          <h2>${esc(grade.name)}</h2>
          <span class="muted">${mine ? `querés ${mine} de ${books.length}` : `${books.length} ${books.length === 1 ? 'libro' : 'libros'}`}</span>
        </div>
        ${loading ? '<p class="muted pad">Cargando…</p>'
          : !books.length ? '<p class="muted pad">La escuela todavía no cargó libros para este grado.</p>'
          : `<ul class="book-list">${books.map(b => this.#row(b, selected.has(b.id), available[b.id] ?? 0, busyBookId === b.id)).join('')}</ul>`}
      </section>`;
  }

  #row(book, on, available, busy) {
    return `
      <li class="book-row sell-row ${on ? 'is-mine' : ''}">
        <div class="book-main">
          ${bookInfo(book, { tags: available
            ? `<span class="tag ok">${available} ${available === 1 ? 'usuario lo tiene' : 'usuarios lo tienen'}</span>`
            : '<span class="tag">nadie lo ofrece todavía</span>' })}
        </div>
        <div class="sell-actions">
          ${on ? `
            <span class="want-on">✓ Lo quiero</span>
            <button class="link-btn inline small" data-action="unwant" data-id="${book.id}" ${busy ? 'disabled' : ''}>${busy ? '…' : 'Quitar'}</button>`
          : `
            <button class="btn btn-primary sm" data-action="want" data-id="${book.id}" ${busy ? 'disabled' : ''}>
              ${busy ? '…' : 'Lo quiero'}
            </button>`}
        </div>
      </li>`;
  }

  #bar({ selected, busyBookId }) {
    const n = selected.size;
    return `
      <div class="action-bar">
        <div class="bar-info">
          <strong>${n} ${n === 1 ? 'libro en tu lista' : 'libros en tu lista'}</strong>
          <span class="muted">${n ? 'Se guarda solo' : 'Tocá "Lo quiero" para agregar'}</span>
        </div>
        <div class="bar-buttons">
          <button class="btn btn-primary sm" data-action="matches" ${!n || busyBookId ? 'disabled' : ''}>
            Ver quién los tiene →
          </button>
        </div>
      </div>`;
  }
}
