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
    ApiClient.js        → habla HTTP con Supabase (select/insert/update/upsert/remove)
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

## Probar en local

Los módulos ES no funcionan abriendo el archivo con doble click (`file://`). Hay que servirlo:

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```
