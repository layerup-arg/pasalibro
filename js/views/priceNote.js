/** Aviso de que los precios son solo de referencia (Compro, Vendo y Quién tiene tus libros). */
export function priceNote() {
  return `
    <p class="price-note" role="note">
      <span aria-hidden="true">💡</span>
      <span>Los precios son <strong>solo de referencia</strong>. El precio final lo acuerdan entre comprador y vendedor.</span>
    </p>`;
}
