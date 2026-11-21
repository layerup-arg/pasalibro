/**
 * Configuración general de la app.
 * Es el ÚNICO lugar donde van URLs y claves.
 * La publishable key es pública por diseño: la seguridad la dan las políticas RLS de Supabase.
 */
export const CONFIG = Object.freeze({
  appName: 'PasaLibro',

  supabase: {
    url: 'https://ncodklvyclrcshlxeqqp.supabase.co',
    key: 'sb_publishable_RoQBQYM2PDpux0g0cORU3Q_66dAofT0',
    timeoutMs: 7000,
  },

  github: {
    repo: 'layerup-arg/pasalibro',
    branch: 'main',
  },
});
