-- PasaLibro · 003 · Grados y lista de libros de St John's Pilar (ciclo 2027)
-- Se puede volver a correr sin duplicar (on conflict do nothing).

-- Grados 1° a 6°
insert into public.grades (school_id, name, sort_order)
select s.id, g.name, g.ord
from public.schools s
cross join (values
  ('1° grado', 1), ('2° grado', 2), ('3° grado', 3),
  ('4° grado', 4), ('5° grado', 5), ('6° grado', 6)
) as g(name, ord)
where s.name = 'St John''s Pilar'
on conflict (school_id, name) do nothing;

-- Libros (sin precio por ahora)
insert into public.books (grade_id, title)
select gr.id, b.title
from public.grades gr
join public.schools s on s.id = gr.school_id and s.name = 'St John''s Pilar'
join (values
  ('3° grado', 'Manunga soluciones'),
  ('3° grado', 'The Elves and the Shoemaker'),
  ('3° grado', 'Mama''s New Job'),
  ('3° grado', 'Dinosaurs before Dark'),
  ('3° grado', 'Cambridge Primary Path 3 · Student''s Book'),
  ('3° grado', 'Cambridge Primary Path 3 · Grammar & Writing'),
  ('3° grado', 'Alfa y Beto al rescate · Lengua 3'),
  ('3° grado', 'Un mozo trepado al techo del cabildo'),
  ('3° grado', 'Cinco viajes sin pasaje'),
  ('3° grado', 'Los diarios son extraordinarios y otras obras de teatro breves'),
  ('3° grado', 'El Equipo de Mate 3'),
  ('3° grado', 'Aprender a Ser 3'),

  ('5° grado', 'Sherlock Holmes, Short Stories'),
  ('5° grado', 'El Nombre Secreto'),
  ('5° grado', 'The Butterfly Lion'),
  ('5° grado', 'The Family Under the Bridge'),
  ('5° grado', 'The Witches · Graphic Novel'),
  ('5° grado', 'Cambridge Primary Path 5 · Student''s Book'),
  ('5° grado', 'Cambridge Primary Path 5 · Grammar & Writing'),
  ('5° grado', 'Diario de un viaje imposible'),
  ('5° grado', 'Libertadores'),
  ('5° grado', 'En el último planeta'),
  ('5° grado', 'Club de Aprendedores 5 · Lengua'),
  ('5° grado', 'El Equipo de Mate 5')
) as b(grade, title) on b.grade = gr.name
on conflict (grade_id, title) do nothing;

-- Control: cantidad de libros por grado
select gr.sort_order, gr.name, count(b.id) as libros
from public.grades gr
join public.schools s on s.id = gr.school_id and s.name = 'St John''s Pilar'
left join public.books b on b.grade_id = gr.id
group by gr.sort_order, gr.name
order by gr.sort_order;
