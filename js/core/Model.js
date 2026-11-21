import { EventEmitter } from './EventEmitter.js';

/**
 * Clase base de los modelos.
 * Guarda un estado y emite 'change' cada vez que se actualiza.
 */
export class Model extends EventEmitter {
  #state;

  constructor(initialState = {}) {
    super();
    this.#state = { ...initialState };
  }

  get state() {
    return { ...this.#state };
  }

  /** Mezcla los cambios con el estado actual y avisa a los suscriptores. */
  setState(changes) {
    this.#state = { ...this.#state, ...changes };
    this.emit('change', this.state);
  }
}
