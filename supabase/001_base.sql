-- PasaLibro · setup base
-- Tabla de configuración general (nombre de la escuela, etc.)
create table if not exists public.pasalibro_config (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

alter table public.pasalibro_config enable row level security;

-- Lectura pública (la app la usa para chequear conexión y mostrar el nombre de la escuela)
drop policy if exists "config lectura publica" on public.pasalibro_config;
create policy "config lectura publica"
  on public.pasalibro_config for select
  to anon, authenticated
  using (true);

insert into public.pasalibro_config (key, value) values
  ('school_name', 'Mi Escuela'),
  ('app_version', '0.1')
on conflict (key) do nothing;
