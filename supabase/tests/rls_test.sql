-- Escenario: A admin, B mamá miembro, C de otra escuela, y visitante anónimo.
-- Los ERROR esperados: duplicado, no-admin crea libro, C contacta, código inválido, anon join.
\set ON_ERROR_STOP 0
insert into auth.users (id,email,raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a','a@x','{"full_name":"Lucho Admin"}'),
 ('00000000-0000-0000-0000-00000000000b','b@x','{"full_name":"Mamá B"}'),
 ('00000000-0000-0000-0000-00000000000c','c@x','{"name":"Mamá C otra escuela"}');
select id, full_name from profiles order by 1;

-- A se une y lo hacemos admin (como postgres)
set role authenticated; set request.uid='00000000-0000-0000-0000-00000000000a';
select join_school('cambiar-este-codigo') is not null as a_joined;
reset role;
update school_members set role='admin' where user_id='00000000-0000-0000-0000-00000000000a';

set role authenticated; set request.uid='00000000-0000-0000-0000-00000000000a';
insert into grades (school_id,name,sort_order) select id,'3° grado',3 from schools;
insert into books (grade_id,title,estimated_price) select id,'Matemática 3',25000 from grades;
select 'A ve libros', count(*) from books;

-- B se une, carga WhatsApp, publica
set request.uid='00000000-0000-0000-0000-00000000000b';
select join_school('CAMBIAR-ESTE-CODIGO') is not null as b_joined;
insert into profile_contact (user_id,whatsapp) values (auth.uid(),'5491100000000');
insert into offers (book_id) select id from books;
insert into offers (book_id) select id from books; -- duplicado: debe fallar
insert into books (grade_id,title) select id,'Hack' from grades; -- no admin: debe fallar
select 'B ve perfiles', count(*) from profiles;

-- A busca y contacta
set request.uid='00000000-0000-0000-0000-00000000000a';
insert into wants (book_id) select id from books;
select 'A no ve WhatsApp de B directo', count(*) from profile_contact;
select * from contact_offer((select id from offers limit 1));
select 'contactos A', count(*) from contacts;

-- C sin código: no ve nada
set request.uid='00000000-0000-0000-0000-00000000000c';
select 'C', (select count(*) from schools) s,(select count(*) from books) b,(select count(*) from offers) o,(select count(*) from profiles) p,(select count(*) from wants) w;
select * from contact_offer(1);
select join_school('MAL-CODIGO');
reset role;

-- anon: nada
set role anon; reset request.uid;
select 'anon', (select count(*) from schools) s,(select count(*) from books) b,(select count(*) from offers) o,(select count(*) from profiles) p;
select join_school('CAMBIAR-ESTE-CODIGO');
select key from pasalibro_config;
reset role;
-- B contacto ve el contacto de A
set role authenticated; set request.uid='00000000-0000-0000-0000-00000000000b';
select 'B ve contactos', count(*) from contacts;
