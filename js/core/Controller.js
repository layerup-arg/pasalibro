/**
 * Clase base de los controladores.
 * El controlador conecta modelo y vista:
 *   - escucha acciones de la vista y llama al modelo
 *   - escucha cambios del modelo y le pide a la vista que se redibuje
 *
 * El Router llama a mount() al entrar a una pantalla y a unmount() al salir.
 */
export class Controller {
  #subscriptions = [];

  /** @param {HTMLElement} container  zona de la página donde se dibuja la pantalla */
  async mount(container) {
    this.container = container;
  }

  /** Suscribe a un modelo y recuerda la suscripción para limpiarla al salir. */
  listen(model, event, callback) {
    this.#subscriptions.push(model.on(event, callback));
  }

  unmount() {
    this.#subscriptions.forEach(unsubscribe => unsubscribe());
    this.#subscriptions = [];
    this.view?.destroy();
  }
}
