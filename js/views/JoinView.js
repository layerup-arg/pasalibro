import { View } from '../core/View.js';
import { esc } from '../utils/html.js';

/**
 * Pantalla para ingresar el código de invitación de la escuela.
 * Acciones que emite: 'join' (con { code }), 'logout'.
 */
export class JoinView extends View {
  template({ fullName, error = null, busy = false, code = '' }) {
    const firstName = esc(String(fullName || '').split(' ')[0]);
    return `
      <section class="card narrow">
        <div class="step-ico i2 big">🔑</div>
        <h1 class="card-title">¡Hola, ${firstName}!</h1>
        <p class="card-text">PasaLibro es un grupo cerrado de cada escuela. Ingresá el código de invitación que te compartieron en el grupo del grado.</p>

        <form data-action="join" class="form" autocomplete="off">
          <label class="label" for="invite-code">Código de invitación</label>
          <input class="input code" id="invite-code" name="code" value="${esc(code)}"
                 placeholder="Ej: ABC-123" autocapitalize="characters" spellcheck="false" ${busy ? 'disabled' : ''} required>
          ${error ? `<div class="alert">${esc(error)}</div>` : ''}
          <button class="btn btn-primary block" type="submit" ${busy ? 'disabled' : ''}>
            ${busy ? 'Validando…' : 'Entrar a mi escuela'}
          </button>
        </form>

        <button class="link-btn" data-action="logout">Usar otra cuenta</button>
      </section>`;
  }

  afterRender() {
    this.root.querySelector('#invite-code')?.focus();
  }
}
