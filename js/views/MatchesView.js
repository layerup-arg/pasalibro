import { View } from '../core/View.js';

/**
 * Coincidencias: qué mamá tiene más libros de mi lista.
 * PENDIENTE (próxima vuelta). Por ahora muestra un aviso.
 */
export class MatchesView extends View {
  template({ count }) {
    return `
      <a class="back" href="#/busco">← Volver a Busco</a>
      <section class="card narrow">
        <div class="step-ico i3 big">🧩</div>
        <h1 class="card-title">Coincidencias</h1>
        <p class="card-text">
          ${count ? `Guardaste <strong>${count} ${count === 1 ? 'libro' : 'libros'}</strong>. ` : ''}
          Muy pronto acá vas a ver qué mamá tiene más libros de tu lista, para comprarle todo junto.
        </p>
        <a class="btn btn-primary block" href="#/busco">Seguir editando mi lista</a>
      </section>`;
  }
}
