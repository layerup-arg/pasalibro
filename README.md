# PasaLibro 📚

App web para que las familias de una escuela compren, vendan e intercambien los libros escolares:
quien terminó un grado le pasa sus libros a quien empieza ese grado.

- **Online:** https://layerup-arg.github.io/pasalibro/
- **Front:** HTML + CSS + JavaScript con módulos ES (sin build, sin frameworks). Lo sirve GitHub Pages.
- **Base de datos:** Supabase (proyecto `pasalibro`, región São Paulo), vía API REST.

## Arquitectura: MVC con clases

```
index.html              → solo el "cascarón": carga css/styles.css y js/main.js
css/styles.css          → todos los estilos
js/
  main.js               → arranca la app
  App.js                → arma todo: cliente, repositorios, modelos, layout y rutas
  config.js             → URLs y claves (único lugar)
  core/                 → piezas base reutilizables (no tocar seguido)
    ApiClient.js        → habla HTTP con Supabase (select/insert/update/upsert/remove/rpc)
    AuthClient.js       → login con Google vía Supabase Auth (tokens, renovación, salir)
    EventEmitter.js     → patrón observador (on/off/emit)
    Model.js            → base de modelos: estado + evento 'change'
    View.js             → base de vistas: template() + render() + onAction()
    Controller.js       → base de controladores: mount()/unmount()
    Router.js           → rutas por hash: #/ , #/libros/:id ...
  repositories/         → ÚNICA capa que conoce tablas y columnas de la base
  models/               → datos y reglas de negocio (no tocan el DOM)
  views/                → solo HTML y eventos de usuario (no tocan la base)
  controllers/          → conectan modelo ↔ vista para cada pantalla
  utils/                → helpers (esc() para escapar HTML)
supabase/               → scripts SQL en orden (001_, 002_, ...)
```

### Flujo de una pantalla

```
Usuario ─click─▶ View ─onAction─▶ Controller ─llama─▶ Model ─usa─▶ Repository ─▶ ApiClient ─▶ Supabase
                  ▲                                     │
                  └──────── render/update ◀── 'change' ─┘
```

### Agregar una pantalla nueva

1. `js/views/MiPantallaView.js` → `class MiPantallaView extends View` con `template(data)`.
   Botones con `data-action="algo"`; formularios con `<form data-action="algo">`.
2. `js/controllers/MiPantallaController.js` → `class ... extends Controller`, en `mount()` crea la vista,
   la dibuja y registra `view.onAction('algo', handler)`.
3. En `js/App.js` → `#registerRoutes()`: `this.router.add('/mi-pantalla', () => new MiPantallaController(...))`.

### Agregar una tabla nueva

1. Script SQL en `supabase/00X_nombre.sql` (siempre con RLS y políticas) y correrlo en el SQL Editor de Supabase.
2. `js/repositories/NombreRepository.js` con los métodos de lectura/escritura.
3. Instanciarlo en `App.js` dentro de `this.repos`.

## Login

- Solo **Google** (Supabase Auth → proveedor Google, credenciales en Google Cloud proyecto `pasalibro`).
- `AuthClient.init()` corre antes del router: Google vuelve con `#access_token=...` en la URL.
- `SessionModel` decide el estado: `anonymous` → portada · `needs_school` → `#/unirme` (código) · `ready` → panel.
- Mientras la app de Google esté en modo **Prueba**, solo entran los mails cargados como *usuarios de prueba*
  (Google Cloud → Google Auth Platform → Público). Para abrirla a todos hay que publicar la app
  (requiere página de política de privacidad).

## Administrar (#/admin)

Solo para quien tiene rol `admin` en `school_members`. Permite, por escuela:
- elegir el grado (pestañas) y crear grados nuevos;
- agregar libros de a uno o pegando una lista: una línea por libro, `título ; autor ; editorial ; precio`
  (solo el título es obligatorio; también acepta tabs si se pega desde una planilla, y el formato viejo `título ; precio`);
- editar título, autor, editorial y precio estimado, ocultar/mostrar a las familias y borrar.

La tarjeta de libro es igual en Administrar, Vendo y Busco (`views/bookInfo.js`):
título arriba, autor · editorial abajo, precio de referencia a la derecha.

Archivos: `repositories/CatalogRepository.js` → `models/CatalogAdminModel.js` → `views/AdminView.js` → `controllers/AdminController.js`.

### Administrar › Miembros (#/admin/miembros)
Lista de quienes entraron a la escuela (por nombre de Google), con buscador y botones **Hacer admin / Quitar admin**.
- La escuela nunca queda sin admin: la app deshabilita el botón y la base lo bloquea (`004_un_admin_minimo.sql`).
- Si un admin se quita el rol a sí mismo, vuelve al inicio sin la tarjeta Administrar.

Archivos: `repositories/MemberRepository.js` → `models/MembersAdminModel.js` → `views/MembersView.js` → `controllers/AdminMembersController.js` (+ `views/adminNav.js`).

## Vendo (#/vendo)

La mamá elige grado y toca **"Lo vendo"** en los libros del catálogo que quiere pasar.
- Antes de publicar carga su WhatsApp una vez (`profile_contact`, privado). Se normaliza a `549…` (`utils/phone.js`).
- Cada publicación tiene estado: **Disponible / Reservado / Vendido**, y se puede quitar.
- Si un libro ya se vendió, puede publicar otro ejemplar ("Vendo otro").
- Muestra cuántas mamás buscan cada libro (`wants`) y el precio de referencia del admin.
- Barra flotante con "Ver quién los necesita →" que lleva a `#/coincidencias/vendo`.

Archivos: `repositories/OfferRepository.js`, `WantRepository.js` → `models/SellModel.js` → `views/SellView.js` → `controllers/SellController.js`.

## Compro (#/compro)

La mamá elige grado y toca **"Lo quiero"** en los libros que necesita (igual que "Lo vendo" en Vendo).
- Cada click se guarda solo en `wants`; no hay botón Guardar. "Quitar" lo saca de la lista.
- Muestra cuántos OTROS usuarios tienen cada libro disponible.
- "Ver quién los tiene →" lleva a `#/coincidencias/busco`.

Archivos: `repositories/WantRepository.js` → `models/SearchModel.js` → `views/SearchView.js` → `controllers/SearchController.js`.

**Pendiente:** coincidencias (`MatchesController`/`MatchesView`), en dos modos:
`#/coincidencias/busco` (qué mamá tiene más libros de mi lista) y `#/coincidencias/vendo` (qué mamás necesitan más de mis libros).

## Modelo de datos (Supabase)

Scripts en `supabase/`, se corren en orden en el SQL Editor: `001_base.sql`, `002_modelo.sql`, `003_datos_st_johns.sql`, `004_un_admin_minimo.sql`, `005_autor_editorial.sql`.

| Tabla | Qué guarda | Quién escribe |
|---|---|---|
| `schools` | Escuela + código de invitación | admin (SQL) |
| `profiles` | Nombre de cada usuaria (se crea solo al entrar con Google) | la propia usuaria |
| `profile_contact` | WhatsApp — **privado**, solo lo ve la dueña | la propia usuaria |
| `school_members` | Quién pertenece a cada escuela y con qué rol (`admin`/`member`) | vía `join_school()` |
| `grades` | Grados de cada escuela | admin |
| `books` | Catálogo por grado: título, autor, editorial y precio estimado | admin |
| `offers` | "Vendo": libro del catálogo que ofrece una mamá (`available`/`reserved`/`sold`) | la vendedora |
| `wants` | "Busco": libros que necesita una mamá | la propia usuaria |
| `contacts` | Registro de cada "Me interesa" | vía `contact_offer()` |

**Reglas (RLS):**
- Grupo cerrado: todo se ve solo si sos miembro de esa escuela. Sin login no se ve nada.
- Grados y libros: los ven los miembros, los editan solo admins.
- Cada mamá crea y borra solo sus propios "vendo" y "busco".
- El WhatsApp nunca se lee directo: `contact_offer(id)` registra el contacto y recién ahí lo devuelve.

**Funciones que llama la app (RPC):**
- `join_school(p_code)` → se une a la escuela con el código de invitación.
- `contact_offer(p_offer)` → "Me interesa": devuelve nombre y WhatsApp de la vendedora y el título.

**Hacer admin a alguien:** desde la app, Administrar › Miembros. O por SQL Editor:
```sql
update school_members set role = 'admin'
where user_id = (select id from auth.users where email = 'mail@ejemplo.com');
```

**Probar las reglas en local** (Postgres 16): `supabase/tests/run.sh`.

## Probar en local

Los módulos ES no funcionan abriendo el archivo con doble click (`file://`). Hay que servirlo:

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```
