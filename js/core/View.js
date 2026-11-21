/**
 * Clase base de las vistas.
 * Una vista solo sabe DIBUJAR (template) y AVISAR acciones del usuario (onAction).
 * No llama a la base de datos ni toma decisiones: eso es del controlador.
 *
 * Para enganchar un botón: ponerle data-action="nombre" en el HTML
 * y en el controlador: view.onAction('nombre', handler).
 */
export class View {
  #handlers = new Map();

  constructor(root) {
    if (!root) throw new Error(`${this.constructor.name}: falta el elemento raíz`);
    this.root = root;
    this.root.addEventListener('click', this.#dispatch);
    this.root.addEventListener('submit', this.#dispatch);
    this.root.addEventListener('change', this.#dispatch);
  }

  /** Cada vista hija devuelve su HTML a partir de los datos. */
  template(_data) {
    return '';
  }

  render(data = {}) {
    this.root.innerHTML = this.template(data);
    this.afterRender(data);
  }

  /** Gancho opcional para las vistas hijas (focus, animaciones, etc.). */
  afterRender(_data) {}

  onAction(action, handler) {
    this.#handlers.set(action, handler);
  }

  destroy() {
    this.root.removeEventListener('click', this.#dispatch);
    this.root.removeEventListener('submit', this.#dispatch);
    this.root.removeEventListener('change', this.#dispatch);
    this.#handlers.clear();
    this.root.innerHTML = '';
  }

  /**
   * Traduce eventos del DOM a acciones:
   *   - click en un elemento con data-action           → handler({ ...data-* })
   *   - submit de un <form data-action>                 → handler({ ...data-*, ...campos del form })
   *   - change de un <select data-action>               → handler({ ...data-*, value })
   */
  #dispatch = (event) => {
    // Si una vista interna ya manejó el evento, la vista contenedora (layout) no lo repite.
    if (event.defaultPrevented) return;
    const el = event.target.closest('[data-action]');
    if (!el || !this.root.contains(el)) return;

    const kind = el.tagName === 'FORM' ? 'submit' : el.tagName === 'SELECT' ? 'change' : 'click';
    if (event.type !== kind) return;

    const handler = this.#handlers.get(el.dataset.action);
    if (!handler) return;
    if (kind !== 'change') event.preventDefault();

    const payload = { ...el.dataset };
    if (kind === 'submit') Object.assign(payload, Object.fromEntries(new FormData(el)));
    if (kind === 'change') payload.value = el.value;
    handler(payload, el);
  };
}
