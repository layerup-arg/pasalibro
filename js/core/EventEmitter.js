/**
 * Patrón observador mínimo.
 * Los modelos lo heredan para avisar a las vistas cuando cambian sus datos.
 */
export class EventEmitter {
  #listeners = new Map();

  /** Suscribe un callback a un evento. Devuelve una función para desuscribirse. */
  on(event, callback) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    this.#listeners.get(event)?.delete(callback);
  }

  emit(event, payload) {
    this.#listeners.get(event)?.forEach(cb => cb(payload));
  }
}
