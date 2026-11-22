-- PasaLibro · 006 · Listas oficiales 2027 de St John's Pilar (1° a 6°)
-- Completa autor y editorial de cada libro, ordena los títulos y carga
-- precio de referencia SOLO donde no había (coalesce: no pisa los precios ya cargados).
-- Se actualiza por id para no romper ofertas ni búsquedas existentes.
-- Se puede volver a correr sin efectos secundarios.

update public.books b
set title           = v.title,
    author          = v.author,
    publisher       = v.publisher,
    estimated_price = coalesce(b.estimated_price, v.price)
from (values
  -- 1° grado
  (25, 'My New Boy',                                   'Joan Phillips',                    'Random House',               12150),
  (26, 'The Three Pigs',                               null,                               'Ladybird · Read it Yourself', 15000),
  (27, 'Room on the Broom',                            'Julia Donaldson',                  'Pan Macmillan',              16200),
  (28, 'Cambridge Primary Path 1 · Student''s Book',   null,                               'Cambridge University Press', 69020),
  (29, 'Cambridge Primary Path 1 · Grammar & Writing', null,                               'Cambridge University Press', 49840),
  (30, 'Alfa y Beto al rescate · Lengua 1',            null,                               'Santillana',                 50000),
  (31, 'Un lugar cómodo, cómodo',                      'Didi Grau',                        'Edelvives',                  11500),
  (32, 'Pequeño Dragón aprende a volar',               'Graciela Pérez Aguilar',           'Edelvives',                  10600),
  (33, 'Perro y Foca',                                 'Antonio Santa Ana',                'Norma',                      20000),
  (34, 'Pata de dinosaurio',                           'Liliana Cinetto',                  'Norma',                      20000),
  (35, 'El Equipo de Mate 1',                          null,                               'Santillana',                 58500),
  (36, 'Nuevo Taller de las letras 2',                 null,                               'Estación Mandioca',          20000),
  (37, 'Aprender a Ser 1',                             null,                               'CreSER',                     27000),
  -- 2° grado
  (50, 'Tod and the Trumpet',                          'Charlotte Middleton',              'HarperCollins · Big Cat',    null),
  (51, 'La botella que aprendió a leer',               'Canela',                           'Loqueleo',                   null),
  (52, 'Cinderella',                                   'David Wood',                       'HarperCollins · Big Cat',    null),
  (53, 'Dear Mr. Blueberry',                           'Simon James',                      'Simon & Schuster',           null),
  (54, 'Good Fun Farm',                                null,                               'HarperCollins · Big Cat',    null),
  (55, 'Cambridge Primary Path 2 · Student''s Book',   null,                               'Cambridge University Press', null),
  (56, 'Cambridge Primary Path 2 · Grammar & Writing', null,                               'Cambridge University Press', null),
  (57, 'Alfa y Beto al rescate · Lengua 2',            null,                               'Santillana',                 null),
  (58, 'Una familia para Rodolfo',                     'Claudia Vera y Nora Hilb',         'Loqueleo',                   null),
  (59, 'El caballo que no sabía relinchar',            'Griselda Gambaro',                 'Loqueleo',                   null),
  (60, 'Lobo Rojo y Caperucita Feroz',                 'Elsa Bornemann',                   'Loqueleo',                   null),
  (61, 'El Equipo de Mate 2',                          null,                               'Santillana',                 58500),
  (62, 'Aprender a Ser 2',                             null,                               'CreSER',                     null),
  -- 3° grado
  (1,  'Aprender a Ser 3',                             null,                               'CreSER',                     27000),
  (2,  'El Equipo de Mate 3',                          null,                               'Santillana',                 58500),
  (3,  'Los diarios son extraordinarios',              'Adela Basch',                      'Estrada · Azulejos',         12100),
  (4,  'Cinco viajes sin pasaje',                      'Varios autores',                   'Norma · Torre de Papel Azul', 24000),
  (5,  'Un mozo trepado al techo del cabildo',         'Fernando Onetto',                  'Hola Chicos',                12000),
  (6,  'Alfa y Beto al rescate · Lengua 3',            null,                               'Santillana',                 50000),
  (7,  'Cambridge Primary Path 3 · Grammar & Writing', null,                               'Cambridge University Press', 49840),
  (8,  'Cambridge Primary Path 3 · Student''s Book',   null,                               'Cambridge University Press', 69020),
  (9,  'Dinosaurs before Dark',                        'Mary Pope Osborne',                'Random House · Magic Tree House', 10500),
  (10, 'Mama''s New Job',                              'Jan y Stan Berenstain',            'Random House',               10500),
  (11, 'The Elves and the Shoemaker',                  null,                               'Usborne English Readers',    14500),
  (12, 'Manunga soluciones',                           'Florencia Esses',                  'Estación Mandioca',          12500),
  -- 4° grado (ya tenían precio)
  (63, 'Sophie''s Rules',                              'Keith West',                       'HarperCollins',              null),
  (64, 'Solomán',                                      'Ramón García Domínguez',           'Norma',                      null),
  (65, 'The War with Grandpa',                         'Robert Kimmel Smith',              'Dell',                       null),
  (66, 'Judy Moody and the Bucket List',               'Megan McDonald',                   'Walker Books',               null),
  (67, 'Fantastic Mr. Fox · The Play',                 'Roald Dahl',                       'Penguin Books',              null),
  (68, 'Cambridge Primary Path 4 · Student''s Book',   null,                               'Cambridge University Press', null),
  (69, 'Cambridge Primary Path 4 · Grammar & Writing', null,                               'Cambridge University Press', null),
  (70, 'La piedra lunar',                              'Verónica Chamorro y Mirita',       'Ralenti',                    null),
  (71, 'Belgrano hace bandera, y le sale de primera',  'Adela Basch',                      'Loqueleo',                   null),
  (72, 'El genio de la cartuchera',                    'Mario Méndez',                     'Loqueleo',                   null),
  (73, 'Club de Aprendedores 4',                       null,                               'Santillana',                 null),
  (74, 'El Equipo de Mate 4',                          null,                               'Santillana',                 null),
  -- 5° grado
  (13, 'El Equipo de Mate 5',                          null,                               'Santillana',                 58500),
  (14, 'Club de Aprendedores 5',                       null,                               'Santillana',                 47500),
  (15, 'En el último planeta',                         'Ricardo Mariño',                   'Loqueleo',                   18900),
  (16, 'Libertadores',                                 'Laura Ávila',                      'Edelvives',                  13900),
  (17, 'Diario de un viaje imposible',                 'Lucía Laragione y Ana María Shua', 'Loqueleo',                   18900),
  (18, 'Cambridge Primary Path 5 · Grammar & Writing', null,                               'Cambridge University Press', 55650),
  (19, 'Cambridge Primary Path 5 · Student''s Book',   null,                               'Cambridge University Press', 78660),
  (20, 'The Witches · Graphic Novel',                  'Roald Dahl',                       'Scholastic',                 27000),
  (21, 'The Family Under the Bridge',                  'Natalie Savage Carlson',           'HarperTrophy',               14000),
  (22, 'The Butterfly Lion',                           'Michael Morpurgo',                 'HarperCollins',              16200),
  (23, 'El Nombre Secreto',                            'Laura No',                         'Estrada · Azulejos',         13100),
  (24, 'Sherlock Holmes, Short Stories',               'Arthur Conan Doyle',               'Penguin Readers',            14150),
  -- 6° grado
  (38, 'Robin Hood, entre el amor y la justicia',      'Eduardo y Mariana Dayan',          'Aique',                      11000),
  (39, 'Wonder',                                       'R. J. Palacio',                    'Transworld',                 12000),
  (40, 'Number the Stars',                             'Lois Lowry',                       'HarperCollins',              16200),
  (41, 'Harry Potter 1 · The Philosopher''s Stone',    'J. K. Rowling',                    'Bloomsbury',                 16200),
  (42, 'Oxford Playscripts · Frankenstein',            'Philip Pullman (adaptación)',      'Oxford University Press',    19700),
  (43, 'Cambridge Primary Path 6 · Student''s Book',   null,                               'Cambridge University Press', 78660),
  (44, 'Cambridge Primary Path 6 · Grammar & Writing', null,                               'Cambridge University Press', 55650),
  (45, 'S.O.S. Gorilas',                               'Lucía Laragione',                  'Loqueleo',                   18500),
  (46, 'El Principito',                                'Antoine de Saint-Exupéry',         'Emecé',                      23000),
  (47, 'El grito de la grulla',                        'Samuel Alonso Omeñaca',            'Edelvives',                  13900),
  (48, 'Club de Aprendedores 6',                       null,                               'Santillana',                 47500),
  (49, 'El Equipo de Mate 6',                          null,                               'Santillana',                 58500)
) as v(id, title, author, publisher, price)
where b.id = v.id;

-- Libro nuevo de la lista 2027
insert into public.books (grade_id, title, author, publisher, estimated_price)
select gr.id, 'The Magic Finger', 'Roald Dahl', 'Puffin Books', 13000
from public.grades gr
join public.schools s on s.id = gr.school_id and s.name = 'St John''s Pilar'
where gr.name = '3° grado'
on conflict (grade_id, title) do nothing;
