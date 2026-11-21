import { EventEmitter } from './EventEmitter.js';

/**
 * Login con Supabase Auth (Google), sin librerías externas.
 *
 * Flujo:
 *   1. signInWithGoogle() → redirige a Google (vía Supabase).
 *   2. Google vuelve a la app con los tokens en la URL: #access_token=...&refresh_token=...
 *   3. init() lee esos tokens, los guarda en localStorage y limpia la URL.
 *   4. getAccessToken() devuelve el token vigente y lo renueva solo si está por vencer.
 *
 * Emite 'change' cuando la sesión empieza o termina.
 */
export class AuthClient extends EventEmitter {
  static STORAGE_KEY = 'pasalibro.session';
  static REFRESH_MARGIN_S = 60;

  #authUrl;
  #key;
  #session = null;
  #refreshing = null;

  constructor({ url, key }) {
    super();
    this.#authUrl = `${url}/auth/v1`;
    this.#key = key;
    this.lastError = null;
  }

  get user() {
    return this.#session?.user ?? null;
  }

  get isLoggedIn() {
    return Boolean(this.#session);
  }

  /** Se llama una vez al arrancar, ANTES del router (la URL puede traer tokens). */
  async init() {
    const redirect = this.#readRedirect();
    try {
      if (redirect?.error) {
        this.lastError = redirect.error;
      } else if (redirect) {
        const user = await this.#fetchUser(redirect.access_token);
        this.#setSession({ ...redirect, user });
      } else {
        this.#session = this.#load();
        if (this.#session && this.#isExpiring()) await this.#refresh();
      }
    } catch (err) {
      console.warn('[AuthClient] init', err);
      this.#clear();
    }
  }

  signInWithGoogle() {
    const redirectTo = `${location.origin}${location.pathname}`;
    const url = new URL(`${this.#authUrl}/authorize`);
    url.searchParams.set('provider', 'google');
    url.searchParams.set('redirect_to', redirectTo);
    location.assign(url);
  }

  async signOut() {
    const token = this.#session?.access_token;
    this.#clear();
    this.emit('change', null);
    if (token) {
      fetch(`${this.#authUrl}/logout`, { method: 'POST', headers: this.#headers(token) }).catch(() => {});
    }
  }

  /** Token para las llamadas a la base. null si no hay sesión. */
  async getAccessToken() {
    if (!this.#session) return null;
    if (this.#isExpiring()) {
      try { await this.#refresh(); } catch { return null; }
    }
    return this.#session?.access_token ?? null;
  }

  // ------------------------------------------------------------------
  #readRedirect() {
    const hash = location.hash.slice(1);
    if (!hash.includes('access_token=') && !hash.includes('error=')) return null;

    const params = new URLSearchParams(hash);
    history.replaceState(null, '', `${location.pathname}${location.search}#/`);

    if (params.get('error')) {
      return { error: params.get('error_description') || params.get('error') };
    }
    const now = Math.floor(Date.now() / 1000);
    return {
      access_token: params.get('access_token'),
      refresh_token: params.get('refresh_token'),
      expires_at: Number(params.get('expires_at')) || now + Number(params.get('expires_in') || 3600),
    };
  }

  async #fetchUser(token) {
    const res = await fetch(`${this.#authUrl}/user`, { headers: this.#headers(token) });
    if (!res.ok) throw new Error(`No se pudo leer el usuario (HTTP ${res.status})`);
    return res.json();
  }

  #refresh() {
    if (this.#refreshing) return this.#refreshing;
    this.#refreshing = (async () => {
      const res = await fetch(`${this.#authUrl}/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { ...this.#headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: this.#session?.refresh_token }),
      });
      if (!res.ok) {
        this.#clear();
        this.emit('change', null);
        throw new Error('La sesión venció');
      }
      const data = await res.json();
      const now = Math.floor(Date.now() / 1000);
      this.#setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at || now + data.expires_in,
        user: data.user ?? this.#session?.user,
      }, { silent: true });
    })().finally(() => { this.#refreshing = null; });
    return this.#refreshing;
  }

  #isExpiring() {
    const now = Math.floor(Date.now() / 1000);
    return !this.#session?.expires_at || this.#session.expires_at - now < AuthClient.REFRESH_MARGIN_S;
  }

  #headers(token) {
    return { apikey: this.#key, Authorization: `Bearer ${token ?? this.#key}` };
  }

  #setSession(session, { silent = false } = {}) {
    this.#session = session;
    try { localStorage.setItem(AuthClient.STORAGE_KEY, JSON.stringify(session)); } catch {}
    if (!silent) this.emit('change', session.user);
  }

  #load() {
    try { return JSON.parse(localStorage.getItem(AuthClient.STORAGE_KEY)); } catch { return null; }
  }

  #clear() {
    this.#session = null;
    try { localStorage.removeItem(AuthClient.STORAGE_KEY); } catch {}
  }
}
