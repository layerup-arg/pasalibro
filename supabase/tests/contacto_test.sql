-- Prueba de contact_seller (correr después de 001..007 sobre el mock)
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111','compra@x','{"full_name":"Compradora"}'),
  ('22222222-2222-2222-2222-222222222222','vende@x','{"full_name":"Vendedora Uno"}'),
  ('33333333-3333-3333-3333-333333333333','otra@x','{"full_name":"Vendedora Dos"}');
insert into public.school_members (school_id, user_id)
select s.id, u.id from public.schools s, auth.users u where s.name = 'St John''s Pilar' on conflict do nothing;
insert into public.profile_contact values ('22222222-2222-2222-2222-222222222222','5491111111111');
insert into public.offers (book_id, seller_id) select id, '22222222-2222-2222-2222-222222222222' from public.books order by id limit 3;
insert into public.offers (book_id, seller_id) select id, '33333333-3333-3333-3333-333333333333' from public.books order by id limit 1;

set role authenticated;
set request.uid = '11111111-1111-1111-1111-111111111111';
\echo '--- 1) dos libros de la misma vendedora: devuelve nombre y WhatsApp'
select * from public.contact_seller((select array_agg(id) from (select id from public.offers where seller_id='22222222-2222-2222-2222-222222222222' order by id limit 2) t));
select count(*) as contactos_registrados from public.contacts;
\echo '--- 2) mezcla de vendedoras: error'
do $$ begin perform public.contact_seller((select array_agg(id) from public.offers)); raise notice 'MAL: no falló';
exception when others then raise notice 'OK: %', sqlerrm; end $$;
\echo '--- 3) la vendedora contactándose a sí misma: error'
set request.uid = '22222222-2222-2222-2222-222222222222';
do $$ begin perform public.contact_seller((select array_agg(id) from public.offers where seller_id='22222222-2222-2222-2222-222222222222')); raise notice 'MAL';
exception when others then raise notice 'OK: %', sqlerrm; end $$;
reset role;
