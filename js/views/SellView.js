import { View } from '../core/View.js';
import { esc } from '../utils/html.js';
import { formatPrice } from '../utils/format.js';
import { formatArPhone } from '../utils/phone.js';

const STATUS_OPTIONS = [
  { value: 'available', label: 'Disponible' },
  { value: 'reserved', label: 'Reservado' },
  { value: 'sold', label: 'Vendido' },
];

/**
 * Pantalla "Vendo".
 *
 * Acciones que emite:
 *   'save-phone' {phone} · 'edit-phone' · 'cancel-phone'
 *   'grade' {id}
 *   'offer' {id}                 publicar libro (id = book id)
 *   'status' {id, status}        cambiar estado (id = offer id)
 *   'remove' {id, title}         quitar publicación (id = offer id)
 *   'matches'                    ir a coincidencias (quién necesita mis libros)
 */
export class SellView extends View {
  template(s) {
    return `
      <a class="back" href="#/">← Inicio</a>
      <div class="page-head">
        <div>
          <h1 class="page-title">Vendo</h1>
          <p class="page-lead">Marcá los libros que ya usaron y querés pasar.</p>
        </div>
      </div>

      ${this.#phoneCard(s)}

      ${s.error ? `<div class="alert" role="alert">${esc(s.error)}</div>` : ''}
      ${s.notice ? `<div class="notice" role="status">✓ ${esc(s.notice)}</div>` : ''}

      ${this.#tabs(s.grades, s.gradeId)}
      ${this.#bookPanel(s)}
      ${this.#bar(s)}`;
  }

  afterRender({ editingPhone }) {
    if (editingPhone) this.root.querySelector('input[name="phone"]')?.focus({ preventScroll: true });
  }

  // ------------------------------------------------------------------
  #phoneCard({ whatsapp, editingPhone }) {
    if (!editingPhone && whatsapp) {
      return `
        <div class="phone-line">
          <span>📱 Te contactan al <strong>${esc(formatArPhone(whatsapp))}</strong></span>
          <button class="link-btn inline" data-action="edit-phone">Cambiar</button>
        </div>`;
    }
    return `
      <section class="panel phone-card">
        <form class="form pad" data-action="save-phone">
          <label class="label" for="phone">Tu WhatsApp</label>
          <input class="input" id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel"
                 placeholder="Ej: 11 2345 6789" value="${esc(whatsapp ? formatArPhone(whatsapp) : '')}" required>
          <p class="hint">🔒 No se muestra en la lista. Solo lo ve una mamá cuando toca "Me interesa" en un libro tuyo.</p>
          <div class="edit-actions">
            <button class="btn btn-primary sm" type="submit">Guardar</button>
            ${whatsapp ? '<button class="btn btn-light sm" type="button" data-action="cancel-phone">Cancelar</button>' : ''}
          </div>
        </form>
      </section>`;
  }

  #tabs(grades, gradeId) {
    if (!grades.length) return '';
    return `
      <nav class="tabs" aria-label="Grados">
        ${grades.map(g => `
          <button class="tab ${g.id === gradeId ? 'active' : ''} ${g.bookCount ? '' : 'no-books'}" data-action="grade" data-id="${g.id}">
            ${esc(g.name.replace(/\s*grado$/i, ''))}
            ${g.myCount ? `<span class="badge">${g.myCount}</span>` : ''}
          </button>`).join('')}
      </nav>`;
  }

  #bookPanel({ grades, gradeId, books, loading, offerByBook, wantCounts, busyBookId, canPublish }) {
    const grade = grades.find(g => g.id === gradeId);
    if (!grade) return '<p class="muted pad">Tu escuela todavía no cargó grados.</p>';
    const mine = books.filter(b => offerByBook[b.id] && offerByBook[b.id].status !== 'sold').length;
    return `
      <section class="panel">
        <div class="panel-head">
          <h2>${esc(grade.name)}</h2>
          <span class="muted">${mine ? `ofrecés ${mine} de ${books.length}` : `${books.length} ${books.length === 1 ? 'libro' : 'libros'}`}</span>
        </div>
        ${loading ? '<p class="muted pad">Cargando…</p>'
          : !books.length ? '<p class="muted pad">La escuela todavía no cargó libros para este grado.</p>'
          : `<ul class="book-list">${books.map(b => this.#row(b, offerByBook[b.id], wantCounts[b.id], busyBookId === b.id, canPublish)).join('')}</ul>`}
      </section>`;
  }

  #row(book, offer, wanted = 0, busy, canPublish) {
    const open = offer && offer.status !== 'sold';
    return `
      <li class="book-row sell-row ${open ? 'is-mine' : ''}">
        <div class="book-main">
          <span class="book-title">${esc(book.title)}</span>
          <span class="book-meta">
            ${book.estimated_price !== null ? `Referencia ${formatPrice(book.estimated_price)}` : ''}
            ${wanted ? `<span class="tag hot">${wanted} ${wanted === 1 ? 'lo busca' : 'lo buscan'}</span>` : ''}
            ${offer?.status === 'sold' ? '<span class="tag">ya vendiste uno</span>' : ''}
          </span>
        </div>
        <div class="sell-actions">
          ${open ? this.#statusControl(offer, book, busy) : `
            <button class="btn btn-primary sm" data-action="offer" data-id="${book.id}"
                    ${busy || !canPublish ? 'disabled' : ''} title="${canPublish ? '' : 'Primero cargá tu WhatsApp'}">
              ${busy ? '…' : offer ? 'Tengo otro' : 'Lo tengo'}
            </button>`}
        </div>
      </li>`;
  }

  /** Barra flotante: cuántos libros ofrezco + ir a coincidencias. */
  #bar({ openCount, busyBookId }) {
    return `
      <div class="action-bar">
        <div class="bar-info">
          <strong>${openCount} ${openCount === 1 ? 'libro publicado' : 'libros publicados'}</strong>
          <span class="muted">${openCount ? 'Se guarda solo' : 'Tocá "Lo tengo" para publicar'}</span>
        </div>
        <div class="bar-buttons">
          <button class="btn btn-primary sm" data-action="matches" ${!openCount || busyBookId ? 'disabled' : ''}>
            Ver quién los necesita →
          </button>
        </div>
      </div>`;
  }

  #statusControl(offer, book, busy) {
    return `
      <div class="segmented" role="group" aria-label="Estado de ${esc(book.title)}">
        ${STATUS_OPTIONS.map(o => `
          <button class="seg ${offer.status === o.value ? 'on' : ''} ${o.value}" data-action="status"
                  data-id="${offer.id}" data-status="${o.value}" ${busy ? 'disabled' : ''}>${o.label}</button>`).join('')}
      </div>
      <button class="link-btn inline small" data-action="remove" data-id="${offer.id}" data-title="${esc(book.title)}" ${busy ? 'disabled' : ''}>Quitar</button>`;
  }
}
