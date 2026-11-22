-- PasaLibro · 005 · Autor y editorial de cada libro del catálogo.
-- Opcionales: los libros ya cargados quedan sin autor/editorial hasta que el admin los complete.

alter table public.books add column if not exists author    text;
alter table public.books add column if not exists publisher text;

select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'books' and column_name in ('author', 'publisher');
