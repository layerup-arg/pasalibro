/** Escapa texto para meterlo en HTML sin riesgo (datos que vienen de usuarios). */
export const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
