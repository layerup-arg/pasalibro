import { View } from '../core/View.js';
import { esc } from '../utils/html.js';

/**
 * Esqueleto fijo de la página: header, zona central (#view) y footer.
 * Las pantallas se dibujan dentro de #view.
 * Acciones que emite: 'logout'.
 */
export class LayoutView extends View {
  template({ appName }) {
    return `
      <header class="top">
        <a class="brand" href="#/" aria-label="${esc(appName)} inicio">
          <div class="brand-mark">📚</div>
          <div class="brand-name">Pasa<span>Libro</span></div>
        </a>
        <div class="top-right">
          <div class="school-chip" id="school-chip">Tu escuela</div>
          <div id="user-area"></div>
        </div>
      </header>

      <main id="view"></main>

      <footer>
        ${esc(appName)} · hecho con 💛 por
        <a href="https://layerup-arg.github.io/" target="_blank" rel="noopener">LayerUp</a>
      </footer>`;
  }

  /** Zona donde el Router monta cada pantalla. */
  get outlet() {
    return this.root.querySelector('#view');
  }

  setSchoolName(name) {
    this.root.querySelector('#school-chip').textContent = name || 'Tu escuela';
  }

  /** @param {{fullName: string}|null} user */
  setUser(user) {
    const area = this.root.querySelector('#user-area');
    if (!user) { area.innerHTML = ''; return; }
    const initial = esc((user.fullName || '?').trim().charAt(0).toUpperCase());
    area.innerHTML = `
      <button class="avatar" data-action="logout" title="Salir (${esc(user.fullName)})" aria-label="Cerrar sesión">
        ${initial}
      </button>`;
  }
}
