const ARS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

/** 25000 → "$ 25.000". null/'' → '' */
export const formatPrice = (value) =>
  value === null || value === undefined || value === '' ? '' : ARS.format(Number(value));

/**
 * Convierte lo que escribe una persona en un número: "25000", "25.000", "$ 25.000", "25000,50".
 * Devuelve null si está vacío y NaN si no es un número válido.
 */
export const parsePrice = (text) => {
  const raw = String(text ?? '').trim();
  if (!raw) return null;
  const clean = raw.replace(/[$\s]/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(clean);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};
