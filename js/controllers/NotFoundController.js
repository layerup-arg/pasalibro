import { Controller } from '../core/Controller.js';
import { NotFoundView } from '../views/NotFoundView.js';

export class NotFoundController extends Controller {
  async mount(container) {
    await super.mount(container);
    this.view = new NotFoundView(container);
    this.view.render();
  }
}
