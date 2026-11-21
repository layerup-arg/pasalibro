/**
 * Cliente HTTP para la API REST de Supabase (PostgREST).
 * Solo sabe hablar HTTP: no conoce tablas ni reglas de negocio (eso va en los repositorios).
 */
export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export class ApiClient {
  #baseUrl;
  #key;
  #timeoutMs;

  constructor({ url, key, timeoutMs = 7000 }) {
    this.#baseUrl = `${url}/rest/v1`;
    this.#key = key;
    this.#timeoutMs = timeoutMs;
  }

  get isConfigured() {
    return Boolean(this.#baseUrl && this.#key);
  }

  /** SELECT. `query` es un objeto con parámetros de PostgREST, ej: { select: 'id,name', grade: 'eq.3' } */
  select(table, query = {}) {
    return this.#request('GET', table, { query });
  }

  insert(table, rows, { returning = true } = {}) {
    return this.#request('POST', table, {
      body: rows,
      prefer: returning ? 'return=representation' : 'return=minimal',
    });
  }

  upsert(table, rows) {
    return this.#request('POST', table, {
      body: rows,
      prefer: 'resolution=merge-duplicates,return=representation',
    });
  }

  /** UPDATE con filtro, ej: update('books', { id: 'eq.5' }, { price: 1000 }) */
  update(table, filter, changes) {
    return this.#request('PATCH', table, { query: filter, body: changes, prefer: 'return=representation' });
  }

  remove(table, filter) {
    return this.#request('DELETE', table, { query: filter, prefer: 'return=minimal' });
  }

  // ------------------------------------------------------------------
  async #request(method, table, { query = {}, body, prefer } = {}) {
    const url = new URL(`${this.#baseUrl}/${table}`);
    Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));

    const headers = {
      apikey: this.#key,
      Authorization: `Bearer ${this.#key}`,
      'Content-Type': 'application/json',
    };
    if (prefer) headers.Prefer = prefer;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.#timeoutMs);

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: ctrl.signal,
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) throw new ApiError(data?.message || `HTTP ${res.status}`, res.status, data);
      return data;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err.name === 'AbortError') throw new ApiError('Tiempo de espera agotado');
      throw new ApiError(err.message || 'Error de red');
    } finally {
      clearTimeout(timer);
    }
  }
}
