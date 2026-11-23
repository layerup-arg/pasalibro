import { esc } from '../utils/html.js';
import { formatPrice } from '../utils/format.js';
import { languageOf } from '../utils/language.js';

/**
 * Bloque de información de un libro, igual en todas las pantallas:
 *
 *   🇬🇧 Título del libro ......................... $ 25.000
 *   Autor · Editorial
 *   [etiquetas opcionales]
 *
 * @param {{title: string, author?: string, publisher?: string, estimated_price?: number|null}} book
 * @param {object} [opts]
 * @param {string} [opts.tags]           HTML de etiquetas extra (ya escapado)
 * @param {boolean} [opts.showNoPrice]   mostrar "sin precio" cuando no tiene (para el admin)
 */
export function bookInfo(book, { tags = '', showNoPrice = false } = {}) {
  const lang = languageOf(book.language);
  const byline = [book.author, book.publisher].filter(Boolean).map(esc).join(' · ');
  const hasPrice = book.estimated_price !== null && book.estimated_price !== undefined;
  const price = hasPrice
    ? `<span class="book-price" title="Precio de referencia">${formatPrice(book.estimated_price)}</span>`
    : showNoPrice ? '<span class="book-price none">sin precio</span>' : '';

  return `
    <span class="book-info">
      <span class="book-title"><span class="book-flag" title="${lang.label}" aria-label="${lang.label}">${lang.flag}</span>${esc(book.title)}</span>
      ${price}
      ${byline ? `<span class="book-byline">${byline}</span>` : ''}
      ${tags ? `<span class="book-tags">${tags}</span>` : ''}
    </span>`;
}
