/**
 * Teléfonos de Argentina para WhatsApp.
 * Se guarda en formato internacional sin "+": 549 + código de área + número (ej: 5491123456789).
 */

/**
 * Normaliza lo que escribe la persona. Devuelve null si no parece un celular argentino válido.
 *   "11 2345-6789"        → "5491123456789"
 *   "011 15 2345-6789"    → "5491123456789"
 *   "+54 9 11 2345 6789"  → "5491123456789"
 *   "0230 15 444-5566"    → "5492304445566"
 */
export function normalizeArPhone(input) {
  let d = String(input ?? '').replace(/\D/g, '');
  if (d.startsWith('549')) d = d.slice(3);
  else if (d.startsWith('54')) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);

  // Sacar el "15" que va después del código de área (área de 2, 3 o 4 dígitos)
  if (d.length === 12) {
    for (const areaLen of [2, 3, 4]) {
      if (d.slice(areaLen, areaLen + 2) === '15') { d = d.slice(0, areaLen) + d.slice(areaLen + 2); break; }
    }
  }
  return d.length === 10 ? `549${d}` : null;
}

/** "5491123456789" → "+54 9 11 2345-6789" (formato aproximado, solo para mostrar) */
export function formatArPhone(stored) {
  const d = String(stored ?? '');
  if (!/^549\d{10}$/.test(d)) return d;
  const local = d.slice(3);
  const area = local.startsWith('11') ? local.slice(0, 2) : local.slice(0, 3);
  const rest = local.slice(area.length);
  return `+54 9 ${area} ${rest.slice(0, rest.length - 4)}-${rest.slice(-4)}`;
}

/** Link para abrir el chat con un mensaje ya escrito. */
export const whatsappLink = (stored, text = '') =>
  `https://wa.me/${stored}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
