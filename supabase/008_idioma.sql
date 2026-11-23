-- PasaLibro · 008 · Idioma de cada libro (en = inglés, es = castellano).
-- Se puede volver a correr.

alter table public.books
  add column if not exists language text not null default 'es';

do $$ begin
  alter table public.books add constraint books_language_check check (language in ('es', 'en'));
exception when duplicate_object then null; end $$;

-- Libros en inglés de las listas 2027 de St John's Pilar (el resto queda en castellano)
update public.books set language = 'en'
where id in (
  25, 26, 27, 28, 29,          -- 1°: My New Boy, The Three Pigs, Room on the Broom, Cambridge x2
  50, 52, 53, 54, 55, 56,      -- 2°: Tod and the Trumpet, Cinderella, Dear Mr. Blueberry, Good Fun Farm, Cambridge x2
  7, 8, 9, 10, 11,             -- 3°: Cambridge x2, Dinosaurs before Dark, Mama's New Job, The Elves and the Shoemaker
  63, 65, 66, 67, 68, 69,      -- 4°: Sophie's Rules, The War with Grandpa, Judy Moody, Fantastic Mr. Fox, Cambridge x2
  18, 19, 20, 21, 22, 24,      -- 5°: Cambridge x2, The Witches, The Family Under the Bridge, The Butterfly Lion, Sherlock Holmes
  39, 40, 41, 42, 43, 44       -- 6°: Wonder, Number the Stars, Harry Potter 1, Frankenstein, Cambridge x2
)
or title = 'The Magic Finger';
