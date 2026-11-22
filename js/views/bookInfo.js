import { esc } from '../utils/html.js';
import { formatPrice } from '../utils/format.js';

/**
 * Bloque de información de un libro, igual en todas las pantallas:
 *
 *   Título del libro ............................ $ 25.000
 *   Autor · Editorial
 *   [etiquetas opcionales]
 *
 * @param {{title: string, author?: string, publisher?: string, estimated_price?: number|null}} book
 * @param {object} [opts]
 * @param {string} [opts.tags]           HTML de etiquetas extra (ya escapado)
 * @param {boolean} [opts.showNoPrice]   mostrar "sin precio" cuando no tiene (para el admin)
 * @param {boolean} [opts.showPrice]     false = no muestra el precio (la pantalla lo pone en su propia columna)
 */
export function bookInfo(book, { tags = '', showNoPrice = false, showPrice = true } = {}) {
  const byline = [book.author, book.publisher].filter(Boolean).map(esc).join(' · ');
  const hasPrice = book.estimated_price !== null && book.estimated_price !== undefined;
  const price = !showPrice ? '' : hasPrice
    ? `<span class="book-price" title="Precio de referencia">${formatPrice(book.estimated_price)}</span>`
    : showNoPrice ? '<span class="book-price none">sin precio</span>' : '';

  return `
    <span class="book-info">
      <span class="book-title">${esc(book.title)}</span>
      ${price}
      ${byline ? `<span class="book-byline">${byline}</span>` : ''}
      ${tags ? `<span class="book-tags">${tags}</span>` : ''}
    </span>`;
}
