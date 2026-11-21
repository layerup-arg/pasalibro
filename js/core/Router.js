/**
 * Router por hash (#/ruta). Funciona en GitHub Pages sin configurar nada.
 *
 * Uso:
 *   router.add('/', () => new HomeController(...));
 *   router.add('/libros/:id', (params) => new BookController(params.id));
 */
export class Router {
  #routes = [];
  #current = null;
  #container;
  #notFound;

  constructor(container, { notFound } = {}) {
    this.#container = container;
    this.#notFound = notFound;
  }

  add(path, factory) {
    const keys = [];
    const pattern = path.replace(/:(\w+)/g, (_, key) => { keys.push(key); return '([^/]+)'; });
    this.#routes.push({ regex: new RegExp(`^${pattern}$`), keys, factory });
    return this;
  }

  start() {
    window.addEventListener('hashchange', () => this.#resolve());
    this.#resolve();
  }

  navigate(path) {
    window.location.hash = path;
  }

  async #resolve() {
    const path = window.location.hash.replace(/^#/, '') || '/';
    let factory = this.#notFound;
    let params = {};

    for (const route of this.#routes) {
      const match = path.match(route.regex);
      if (match) {
        factory = route.factory;
        params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]));
        break;
      }
    }

    this.#current?.unmount();
    this.#current = factory ? factory(params) : null;
    window.scrollTo(0, 0);
    await this.#current?.mount(this.#container);
  }
}
