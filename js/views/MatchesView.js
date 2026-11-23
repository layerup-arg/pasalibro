import { View } from '../core/View.js';

const MODES = {
  busco: {
    back: { href: '#/compro', label: '← Volver a Compro' },
    icon: '🧩',
    title: 'Quién tiene tus libros',
    text: n => `${n ? `Guardaste <strong>${n} ${n === 1 ? 'libro' : 'libros'}</strong> en tu lista. ` : ''}Muy pronto acá vas a ver qué usuario tiene más libros de tu lista, para comprarle todo junto.`,
    cta: 'Seguir editando mi lista',
  },
  vendo: {
    back: { href: '#/vendo', label: '← Volver a Vendo' },
    icon: '📣',
    title: 'Quién necesita tus libros',
    text: n => `${n ? `Tenés <strong>${n} ${n === 1 ? 'libro publicado' : 'libros publicados'}</strong>. ` : ''}Muy pronto acá vas a ver qué usuarios buscan más libros de los que ofrecés.`,
    cta: 'Seguir publicando',
  },
};

/**
 * Coincidencias, en dos modos:
 *   busco → qué mamá tiene más libros de mi lista
 *   vendo → qué mamás necesitan más de mis libros
 * PENDIENTE (próxima vuelta). Por ahora muestra un aviso.
 */
export class MatchesView extends View {
  template({ mode, count }) {
    const m = MODES[mode] ?? MODES.busco;
    return `
      <a class="back" href="${m.back.href}">${m.back.label}</a>
      <section class="card narrow">
        <div class="step-ico i3 big">${m.icon}</div>
        <h1 class="card-title">${m.title}</h1>
        <p class="card-text">${m.text(count)}</p>
        <a class="btn btn-primary block" href="${m.back.href}">${m.cta}</a>
      </section>`;
  }
}
