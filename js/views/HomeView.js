import { View } from '../core/View.js';
import { AppStatusModel } from '../models/AppStatusModel.js';
import { SessionModel } from '../models/SessionModel.js';
import { esc } from '../utils/html.js';

const STEPS = [
  { icon: '📖', css: 'i1', title: 'Publicá', text: 'Elegí de la lista del grado los libros que tu hijo ya usó.' },
  { icon: '🔎', css: 'i2', title: 'Buscá', text: 'Marcá los libros que necesitás y mirá quién los tiene.' },
  { icon: '🤝', css: 'i3', title: 'Coordiná', text: 'Tocá "Me interesa" y seguís por WhatsApp con la otra familia.' },
];

const DB_LABELS = {
  [AppStatusModel.DB.LOADING]: { css: 'wait', text: 'Conectando…' },
  [AppStatusModel.DB.OK]: { css: 'ok', text: 'Conectada' },
  [AppStatusModel.DB.ERROR]: { css: 'err', text: 'Sin conexión' },
  [AppStatusModel.DB.UNCONFIGURED]: { css: 'err', text: 'Sin configurar' },
};

/**
 * Pantalla de inicio.
 * - Sin sesión: portada con "Entrar con Google".
 * - Con sesión y escuela: panel con accesos a Busco / Vendo (y Admin si corresponde).
 * Acciones que emite: 'login', 'search', 'publish', 'admin'.
 */
export class HomeView extends View {
  template({ session, status }) {
    const body = session.status === SessionModel.STATUS.READY
      ? this.#dashboard(session)
      : this.#landing(session);

    return `
      ${body}
      <h2 class="section-title">Estado del sistema</h2>
      <div id="status-card">${this.statusCard(status)}</div>`;
  }

  /** Se expone aparte para poder refrescar solo la tarjeta de estado. */
  statusCard({ db, version }) {
    const label = DB_LABELS[db];
    const ver = version
      ? `<code>${esc(version.sha)}</code>${version.date ? ` · ${version.date.toLocaleDateString('es-AR')}` : ''}`
      : '<code>…</code>';
    return `
      <div class="status">
        <div class="status-row"><span>Base de datos</span>
          <span class="pill ${label.css}"><span class="dot"></span><span>${label.text}</span></span></div>
        <div class="status-row"><span>Versión</span><span>${ver}</span></div>
      </div>`;
  }

  updateStatus(status) {
    this.root.querySelector('#status-card').innerHTML = this.statusCard(status);
  }

  // ------------------------------------------------------------------
  #landing(session) {
    const loading = session.status === SessionModel.STATUS.LOADING;
    return `
      <section class="hero">
        <div class="hero-stack" aria-hidden="true">📚</div>
        <h1>Los libros también <em>pasan de grado.</em></h1>
        <p>Encontrá los libros que pide la escuela entre las familias del grado anterior, y pasale los tuyos a las del grado siguiente.</p>
        <div class="hero-actions">
          <button class="btn btn-primary" data-action="login" ${loading ? 'disabled' : ''}>
            <span class="g-dot" aria-hidden="true">G</span> Entrar con Google
          </button>
        </div>
        <p class="hero-note">Es un grupo cerrado: vas a necesitar el código de invitación de tu escuela.</p>
        ${session.error ? `<div class="alert">${esc(session.error)}</div>` : ''}
      </section>

      <h2 class="section-title">¿Cómo funciona?</h2>
      <div class="steps">${STEPS.map((s, i) => this.#step(s, i + 1)).join('')}</div>`;
  }

  #dashboard({ fullName, school, isAdmin }) {
    const firstName = esc(String(fullName || '').split(' ')[0]);
    return `
      <section class="hello">
        <p class="hello-kicker">${esc(school.name)}</p>
        <h1>¡Hola, ${firstName}!</h1>
        <p>¿Qué querés hacer hoy?</p>
      </section>

      <div class="actions-grid">
        <button class="action-card" data-action="search">
          <span class="step-ico i2">🔎</span>
          <strong>Busco libros</strong>
          <small>Marcá los que necesitás</small>
          <span class="soon">pronto</span>
        </button>
        <button class="action-card" data-action="publish">
          <span class="step-ico i1">📖</span>
          <strong>Vendo libros</strong>
          <small>Publicá los que ya usaron</small>
          <span class="soon">pronto</span>
        </button>
        ${isAdmin ? `
        <button class="action-card admin" data-action="admin">
          <span class="step-ico i3">🛠️</span>
          <strong>Administrar</strong>
          <small>Grados y lista de libros</small>
          <span class="soon">pronto</span>
        </button>` : ''}
      </div>`;
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
