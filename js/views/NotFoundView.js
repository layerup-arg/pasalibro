import { View } from '../core/View.js';

export class NotFoundView extends View {
  template() {
    return `
      <section class="empty">
        <div class="empty-ico">📭</div>
        <h2>Esta página no existe</h2>
        <p>Puede que el enlace esté mal escrito.</p>
        <a class="btn btn-primary" href="#/">Volver al inicio</a>
      </section>`;
  }
}
