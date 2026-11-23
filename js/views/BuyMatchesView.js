import { View } from '../core/View.js';
import { esc } from '../utils/html.js';
import { formatPrice } from '../utils/format.js';
import { bookInfo } from './bookInfo.js';

/**
 * Coincidencias desde Compro: lista de usuarios ordenada por cuántos libros de mi lista tienen.
 * Al tocar un usuario se abre un panel con sus libros: los que coinciden y los que no.
 *
 * Acciones que emite:
 *   'toggle' {id}    abrir/cerrar el panel de un usuario
 *   'contact' {id}   iniciar contacto por WhatsApp con ese usuario
 */
export class BuyMatchesView extends View {
  template(s) {
    return `
      <a class="back" href="#/compro">← Volver a Compro</a>
      <div class="page-head">
        <div>
          <h1 class="page-title">Quién tiene tus libros</h1>
          <p class="page-lead">Ordenados por cuántos libros de tu lista tienen, para que le compres lo más posible a la misma persona. Tocá uno para ver el detalle.</p>
        </div>
      </div>
      ${s.error ? `<div class="alert" role="alert">${esc(s.error)}</div>` : ''}
      ${this.#body(s)}`;
  }

  #body({ loading, myBooks, sellers, openId, gradeNames, contactingId }) {
    if (loading) return '<p class="muted pad">Buscando coincidencias…</p>';
    if (!myBooks.length) {
      return `
        <section class="card narrow">
          <div class="step-ico i2 big">🔎</div>
          <h2 class="card-title">Tu lista está vacía</h2>
          <p class="card-text">Tocá "Lo quiero" en los libros que necesitás y después volvé acá.</p>
          <a class="btn btn-primary block" href="#/compro">Ir a Compro</a>
        </section>`;
    }
    if (!sellers.length) {
      return `
        <section class="card narrow">
          <div class="step-ico i3 big">⏳</div>
          <h2 class="card-title">Todavía nadie los tiene</h2>
          <p class="card-text">Ningún usuario publicó todavía libros de tu lista (${myBooks.length}). Volvé a mirar en unos días.</p>
          <a class="btn btn-light block" href="#/compro">Seguir editando mi lista</a>
        </section>`;
    }
    const total = myBooks.length;
    return `
      <p class="match-summary muted">Tu lista: <strong>${total} ${total === 1 ? 'libro' : 'libros'}</strong> ·
        ${sellers.length} ${sellers.length === 1 ? 'usuario tiene' : 'usuarios tienen'} alguno</p>
      <ul class="match-list">
        ${sellers.map((s, i) => this.#seller(s, i, total, s.id === openId, gradeNames, contactingId)).join('')}
      </ul>`;
  }

  #seller(s, index, total, open, gradeNames, contactingId) {
    const n = s.matches.length;
    const pct = Math.round((n / total) * 100);
    return `
      <li class="match-card ${open ? 'open' : ''}">
        <button class="match-head" data-action="toggle" data-id="${esc(s.id)}" aria-expanded="${open}">
          <span class="match-rank">${index + 1}</span>
          <span class="member-avatar">${esc(initial(s.name))}</span>
          <span class="match-who">
            <strong>${esc(s.name)}</strong>
            <small>Tiene ${n} de tus ${total} ${total === 1 ? 'libro' : 'libros'}${s.matchTotal ? ` · ${formatPrice(s.matchTotal)} de referencia` : ''}</small>
            <span class="match-meter" aria-hidden="true"><span style="width:${pct}%"></span></span>
          </span>
          <span class="match-count" title="Libros de tu lista que tiene">${n}<small>/${total}</small></span>
          <span class="chev" aria-hidden="true">${open ? '▴' : '▾'}</span>
        </button>
        ${open ? this.#detail(s, gradeNames, contactingId === s.id) : ''}
      </li>`;
  }

  #detail(s, gradeNames, contacting) {
    const list = (books, icon) => `
      <ul class="match-books">
        ${books.map(b => `
          <li class="book-row">
            <span class="mb-ico" aria-hidden="true">${icon}</span>
            <div class="book-main">${bookInfo(b, { tags: `<span class="tag">${esc(gradeNames[b.grade_id] ?? '')}</span>` })}</div>
          </li>`).join('')}
      </ul>`;
    const section = (cls, title, books, icon) => `
      <section class="match-box ${cls}">
        <h3 class="match-sec">${title} <span>${books.length}</span></h3>
        ${list(books, icon)}
      </section>`;
    const n = s.matches.length;
    return `
      <div class="match-detail">
        <div class="match-contact">
          <button class="btn btn-wa" data-action="contact" data-id="${esc(s.id)}" ${contacting ? 'disabled' : ''}>
            ${contacting ? 'Abriendo WhatsApp…' : `💬 Iniciar contacto por WhatsApp`}
          </button>
          <small>Le escribís a ${esc(s.name.split(' ')[0])} con un saludo y ${n === 1 ? 'el libro' : `los ${n} libros`} de tu lista que tiene.</small>
        </div>
        ${section('yes', 'Tiene de tu lista', s.matches, '✓')}
        ${s.missing.length
          ? section('no', 'De tu lista no tiene', s.missing, '✗')
          : '<p class="match-all">🎉 Tiene todos los libros de tu lista</p>'}
        ${s.others.length ? `
          <div class="match-divider"><span>Otros libros que vende</span></div>
          ${section('other', 'También vende', s.others, '•')}` : ''}
      </div>`;
  }
}

function initial(name) {
  return (name || '?').trim().charAt(0).toUpperCase();
}
