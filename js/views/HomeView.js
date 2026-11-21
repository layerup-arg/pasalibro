import { View } from '../core/View.js';
import { AppStatusModel } from '../models/AppStatusModel.js';
import { esc } from '../utils/html.js';

const STEPS = [
  { icon: '📖', css: 'i1', title: 'Publicá', text: 'Cargá los libros que tu hijo ya usó, con precio o para intercambiar.' },
  { icon: '🔎', css: 'i2', title: 'Buscá', text: 'Mirá la lista del grado de tu hijo y encontrá quién tiene cada libro.' },
  { icon: '🤝', css: 'i3', title: 'Coordiná', text: 'Contactá a la otra familia de la escuela y se pasan el libro.' },
];

const GRADES = ['1°', '2°', '3°', '4°', '5°', '6°', '7°'];

const DB_LABELS = {
  [AppStatusModel.DB.LOADING]: { css: 'wait', text: 'Conectando…' },
  [AppStatusModel.DB.OK]: { css: 'ok', text: 'Conectada' },
  [AppStatusModel.DB.ERROR]: { css: 'err', text: 'Sin conexión' },
  [AppStatusModel.DB.UNCONFIGURED]: { css: 'err', text: 'Sin configurar' },
};

/** Pantalla de inicio. Recibe el estado de AppStatusModel y lo dibuja. */
export class HomeView extends View {
  template(status) {
    return `
      ${this.#hero()}
      <h2 class="section-title">¿Cómo funciona?</h2>
      <div class="steps">${STEPS.map((s, i) => this.#step(s, i + 1)).join('')}</div>

      <h2 class="section-title">De un grado al siguiente</h2>
      <div class="grades" aria-label="Grados">
        ${GRADES.map(g => `<div class="grade">${g}</div>`).join('<div class="grade-arrow">→</div>')}
      </div>

      <h2 class="section-title">Estado del sistema</h2>
      <div id="status-card">${this.statusCard(status)}</div>`;
  }

  /** Se expone aparte para poder refrescar solo la tarjeta de estado. */
  statusCard({ db, schoolName, version }) {
    const label = DB_LABELS[db];
    const ver = version
      ? `<code>${esc(version.sha)}</code>${version.date ? ` · ${version.date.toLocaleDateString('es-AR')}` : ''}`
      : '<code>…</code>';
    return `
      <div class="status">
        <div class="status-row"><span>Base de datos</span>
          <span class="pill ${label.css}"><span class="dot"></span><span>${label.text}</span></span></div>
        <div class="status-row"><span>Escuela</span><span><code>${esc(schoolName || '—')}</code></span></div>
        <div class="status-row"><span>Versión</span><span>${ver}</span></div>
      </div>`;
  }

  updateStatus(status) {
    this.root.querySelector('#status-card').innerHTML = this.statusCard(status);
  }

  #hero() {
    return `
      <section class="hero">
        <div class="hero-stack" aria-hidden="true">📚</div>
        <h1>Los libros también <em>pasan de grado.</em></h1>
        <p>Encontrá los libros que pide la escuela entre las familias del grado anterior, y pasale los tuyos a las del grado siguiente.</p>
        <div class="hero-actions">
          <button class="btn btn-primary" data-action="search" disabled>🔎 Buscar libros <span class="soon">pronto</span></button>
          <button class="btn btn-ghost" data-action="publish" disabled>➕ Publicar un libro <span class="soon">pronto</span></button>
        </div>
      </section>`;
  }

  #step({ icon, css, title, text }, n) {
    return `
      <div class="step"><span class="step-n">${n}</span>
        <div class="step-ico ${css}">${icon}</div>
        <h3>${title}</h3>
        <p>${text}</p>
      </div>`;
  }
}
