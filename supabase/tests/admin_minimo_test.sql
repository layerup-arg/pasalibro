\set ON_ERROR_STOP 0
\pset footer off
insert into auth.users (id,email,raw_user_meta_data) values
 ('00000000-0000-0000-0000-0000000000a1','a@x','{"full_name":"Lucho"}'),
 ('00000000-0000-0000-0000-0000000000b1','b@x','{"full_name":"Mamá B"}'),
 ('00000000-0000-0000-0000-0000000000c1','c@x','{"full_name":"Mamá C"}');
insert into school_members (school_id,user_id,role) select id,'00000000-0000-0000-0000-0000000000a1','admin' from schools;
insert into school_members (school_id,user_id) select id,'00000000-0000-0000-0000-0000000000b1' from schools;
insert into school_members (school_id,user_id) select id,'00000000-0000-0000-0000-0000000000c1' from schools;
set role authenticated;
\echo '-- A (admin) lista miembros con nombre'
set request.uid='00000000-0000-0000-0000-0000000000a1';
select p.full_name, sm.role from school_members sm join profiles p on p.id=sm.user_id order by 1;
\echo '-- A se quita admin siendo el unico (debe FALLAR)'
update school_members set role='member' where user_id=auth.uid();
\echo '-- B (miembro) intenta hacerse admin (0 filas)'
set request.uid='00000000-0000-0000-0000-0000000000b1';
update school_members set role='admin' where user_id=auth.uid() returning 'NO DEBERIA';
\echo '-- A hace admin a B'
set request.uid='00000000-0000-0000-0000-0000000000a1';
update school_members set role='admin' where user_id='00000000-0000-0000-0000-0000000000b1' returning 'ok B admin', role;
\echo '-- A se quita admin (ahora hay otro): OK'
update school_members set role='member' where user_id=auth.uid() returning 'ok A member', role;
\echo '-- A (ya no admin) intenta cambiar a C (0 filas)'
update school_members set role='admin' where user_id='00000000-0000-0000-0000-0000000000c1' returning 'NO DEBERIA';
\echo '-- B (unico admin) intenta sacarse de la escuela (debe FALLAR)'
set request.uid='00000000-0000-0000-0000-0000000000b1';
delete from school_members where user_id=auth.uid();
reset role;
\echo '-- borrar la escuela entera sigue funcionando'
delete from schools returning 'escuela borrada';
select 'miembros restantes', count(*) from school_members;
