import { View } from '../core/View.js';
import { esc } from '../utils/html.js';
import { formatPrice } from '../utils/format.js';
import { adminNav } from './adminNav.js';

/**
 * Pantalla Administrar: grados de la escuela y libros de cada grado.
 *
 * Acciones que emite:
 *   'school' {value}           cambiar de escuela (si administra más de una)
 *   'grade' {id}               elegir grado
 *   'add-grade' {name}         crear grado
 *   'add-books' {text}         agregar libros (uno por línea, "título ; precio")
 *   'edit' {id} / 'cancel-edit'
 *   'save-book' {id, title, price}
 *   'toggle' {id}              ocultar / mostrar
 *   'delete' {id, title}
 */
export class AdminView extends View {
  /** Conserva lo que se estaba escribiendo aunque la pantalla se redibuje. */
  render(data) {
    const drafts = this.#readDrafts();
    super.render(data);
    this.#restoreDrafts(drafts);
  }

  clearDraft(name) {
    const el = this.root.querySelector(`[name="${name}"][data-draft]`);
    if (el) el.value = '';
  }

  template({ schools, schoolId, grades, gradeId, books, loading, editingId, notice, error }) {
    const school = schools.find(s => s.id === schoolId);
    const grade = grades.find(g => g.id === gradeId);
    return `
      <a class="back" href="#/">← Inicio</a>
      <div class="page-head">
        <h1 class="page-title">Administrar</h1>
        ${schools.length > 1 ? this.#schoolSelect(schools, schoolId) : `<p class="page-sub">${esc(school?.name ?? '')}</p>`}
      </div>
      ${adminNav('libros')}

      ${this.#gradeTabs(grades, gradeId)}

      ${error ? `<div class="alert" role="alert">${esc(error)}</div>` : ''}
      ${notice ? `<div class="notice" role="status">✓ ${esc(notice)}</div>` : ''}

      ${grade ? `
        <section class="panel">
          <div class="panel-head">
            <h2>${esc(grade.name)}</h2>
            <span class="muted">${this.#summary(books)}</span>
          </div>
          ${loading ? '<p class="muted pad">Cargando…</p>' : this.#bookList(books, editingId)}
        </section>

        ${this.#addBooksForm(grade)}
      ` : `<p class="muted pad">Esta escuela todavía no tiene grados. Creá el primero abajo.</p>`}

      ${this.#addGradeForm()}`;
  }

  afterRender({ editingId }) {
    if (editingId) this.root.querySelector('.book-edit input[name="title"]')?.focus();
  }

  // ------------------------------------------------------------------
  #schoolSelect(schools, schoolId) {
    return `
      <select class="input select" data-action="school" aria-label="Escuela">
        ${schools.map(s => `<option value="${esc(s.id)}" ${s.id === schoolId ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}
      </select>`;
  }

  #gradeTabs(grades, gradeId) {
    if (!grades.length) return '';
    return `
      <nav class="tabs" aria-label="Grados">
        ${grades.map(g => `
          <button class="tab ${g.id === gradeId ? 'active' : ''}" data-action="grade" data-id="${g.id}">
            ${esc(g.name.replace(/\s*grado$/i, ''))}
          </button>`).join('')}
      </nav>`;
  }

  #summary(books) {
    const hidden = books.filter(b => !b.active).length;
    const n = books.length;
    return `${n} ${n === 1 ? 'libro' : 'libros'}${hidden ? ` · ${hidden} ${hidden === 1 ? 'oculto' : 'ocultos'}` : ''}`;
  }

  #bookList(books, editingId) {
    if (!books.length) return '<p class="muted pad">Todavía no hay libros en este grado.</p>';
    return `<ul class="book-list">${books.map(b => b.id === editingId ? this.#editRow(b) : this.#row(b)).join('')}</ul>`;
  }

  #row(b) {
    return `
      <li class="book-row ${b.active ? '' : 'is-hidden'}">
        <div class="book-main">
          <span class="book-title">${esc(b.title)}</span>
          <span class="book-meta">
            ${b.estimated_price !== null ? formatPrice(b.estimated_price) : '<em>sin precio</em>'}
            ${b.active ? '' : '<span class="tag">oculto</span>'}
          </span>
        </div>
        <div class="row-actions">
          <button class="icon-btn" data-action="edit" data-id="${b.id}" title="Editar" aria-label="Editar ${esc(b.title)}">✏️</button>
          <button class="icon-btn" data-action="toggle" data-id="${b.id}"
                  title="${b.active ? 'Ocultar a las familias' : 'Mostrar otra vez'}"
                  aria-label="${b.active ? 'Ocultar' : 'Mostrar'} ${esc(b.title)}">${b.active ? '🙈' : '👁️'}</button>
          <button class="icon-btn" data-action="delete" data-id="${b.id}" data-title="${esc(b.title)}"
                  title="Borrar" aria-label="Borrar ${esc(b.title)}">🗑️</button>
        </div>
      </li>`;
  }

  #editRow(b) {
    return `
      <li class="book-row editing">
        <form class="book-edit" data-action="save-book" data-id="${b.id}">
          <label class="label">Título
            <input class="input" name="title" value="${esc(b.title)}" required>
          </label>
          <label class="label">Precio estimado
            <input class="input" name="price" inputmode="numeric" placeholder="Ej: 25000"
                   value="${b.estimated_price ?? ''}">
          </label>
          <div class="edit-actions">
            <button class="btn btn-primary sm" type="submit">Guardar</button>
            <button class="btn btn-light sm" type="button" data-action="cancel-edit">Cancelar</button>
          </div>
        </form>
      </li>`;
  }

  #addBooksForm(grade) {
    return `
      <section class="panel">
        <div class="panel-head"><h2>Agregar libros a ${esc(grade.name)}</h2></div>
        <form class="form pad" data-action="add-books">
          <textarea class="input textarea" name="text" data-draft rows="5"
            placeholder="Un libro por línea. Precio opcional después de ;&#10;El Equipo de Mate 3 ; 25000&#10;Aprender a Ser 3"></textarea>
          <p class="hint">Podés pegar la lista entera de la escuela. Los que ya estén cargados se saltean.</p>
          <button class="btn btn-primary" type="submit">Agregar</button>
        </form>
      </section>`;
  }

  #addGradeForm() {
    return `
      <details class="panel collapsible">
        <summary>+ Agregar un grado</summary>
        <form class="inline-form pad" data-action="add-grade">
          <input class="input" name="name" data-draft placeholder="Ej: 7° grado">
          <button class="btn btn-primary sm" type="submit">Crear</button>
        </form>
      </details>`;
  }

  #readDrafts() {
    const drafts = {};
    this.root.querySelectorAll('[data-draft]').forEach(el => { drafts[el.name] = el.value; });
    const details = this.root.querySelector('details.collapsible');
    drafts.__open = details?.open ?? false;
    return drafts;
  }

  #restoreDrafts(drafts) {
    this.root.querySelectorAll('[data-draft]').forEach(el => {
      if (drafts[el.name]) el.value = drafts[el.name];
    });
    const details = this.root.querySelector('details.collapsible');
    if (details && drafts.__open) details.open = true;
  }
}
