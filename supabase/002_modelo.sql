-- =====================================================================
-- PasaLibro · 002 · Modelo de datos
-- Grupos cerrados por escuela, catálogo cargado por admins,
-- "vendo" (offers) y "busco" (wants), contacto por WhatsApp.
-- =====================================================================

-- ---------------------------------------------------------------------
-- TABLAS
-- ---------------------------------------------------------------------

-- Escuelas. El código de invitación es la llave para entrar al grupo.
create table public.schools (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  invite_code  text not null unique,
  created_at   timestamptz not null default now()
);

-- Perfil público de cada usuaria (se crea solo al entrar con Google).
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  created_at  timestamptz not null default now()
);

-- Dato privado: WhatsApp. Solo lo ve la dueña; a otras se les entrega
-- únicamente a través de contact_offer() cuando hacen "Me interesa".
create table public.profile_contact (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  whatsapp    text not null,
  updated_at  timestamptz not null default now()
);

-- Quién pertenece a qué escuela (grupo cerrado).
create table public.school_members (
  school_id  uuid not null references public.schools(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null default 'member' check (role in ('admin', 'member')),
  joined_at  timestamptz not null default now(),
  primary key (school_id, user_id)
);

-- Grados de cada escuela (los carga el admin).
create table public.grades (
  id          bigint generated always as identity primary key,
  school_id   uuid not null references public.schools(id) on delete cascade,
  name        text not null,
  sort_order  int  not null default 0,
  unique (school_id, name)
);

-- Catálogo de libros por grado (lo carga el admin): título y precio estimado.
create table public.books (
  id               bigint generated always as identity primary key,
  grade_id         bigint not null references public.grades(id) on delete cascade,
  title            text not null,
  estimated_price  numeric(12,2),
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  unique (grade_id, title)
);

-- "Vendo": libro del catálogo que una mamá ofrece.
create table public.offers (
  id          bigint generated always as identity primary key,
  book_id     bigint not null references public.books(id) on delete cascade,
  seller_id   uuid   not null default auth.uid() references public.profiles(id) on delete cascade,
  status      text   not null default 'available' check (status in ('available', 'reserved', 'sold')),
  created_at  timestamptz not null default now()
);
-- Una mamá no puede tener el mismo libro publicado dos veces mientras no lo vendió.
create unique index offers_one_open_per_seller on public.offers (seller_id, book_id) where status <> 'sold';

-- "Busco": libros que una mamá necesita.
create table public.wants (
  user_id     uuid   not null default auth.uid() references public.profiles(id) on delete cascade,
  book_id     bigint not null references public.books(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, book_id)
);

-- Registro de contactos ("Me interesa").
create table public.contacts (
  id          bigint generated always as identity primary key,
  offer_id    bigint not null references public.offers(id) on delete cascade,
  buyer_id    uuid   not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (offer_id, buyer_id)
);

create index on public.books (grade_id);
create index on public.offers (book_id);
create index on public.wants (book_id);

-- ---------------------------------------------------------------------
-- FUNCIONES AUXILIARES (usadas por las políticas)
-- security definer = corren con permisos del dueño, para no chocar con RLS.
-- ---------------------------------------------------------------------

create or replace function public.is_member(p_school uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from school_members where school_id = p_school and user_id = auth.uid());
$$;

create or replace function public.is_admin(p_school uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from school_members where school_id = p_school and user_id = auth.uid() and role = 'admin');
$$;

create or replace function public.grade_school(p_grade bigint)
returns uuid language sql stable security definer set search_path = public as $$
  select school_id from grades where id = p_grade;
$$;

create or replace function public.book_school(p_book bigint)
returns uuid language sql stable security definer set search_path = public as $$
  select g.school_id from books b join grades g on g.id = b.grade_id where b.id = p_book;
$$;

-- ¿La usuaria actual comparte alguna escuela con otra persona?
create or replace function public.shares_school(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from school_members a
    join school_members b on b.school_id = a.school_id
    where a.user_id = auth.uid() and b.user_id = p_user
  );
$$;

-- ---------------------------------------------------------------------
-- ACCIONES (RPC) que la app llama con api.rpc(...)
-- ---------------------------------------------------------------------

-- Entrar a una escuela con el código de invitación. Devuelve el id de la escuela.
create or replace function public.join_school(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_school uuid;
begin
  if auth.uid() is null then raise exception 'Tenés que iniciar sesión'; end if;
  select id into v_school from schools where upper(invite_code) = upper(trim(p_code));
  if v_school is null then raise exception 'Código de invitación inválido'; end if;
  insert into school_members (school_id, user_id) values (v_school, auth.uid())
    on conflict do nothing;
  return v_school;
end $$;

-- "Me interesa": registra el contacto y devuelve el WhatsApp de la vendedora.
create or replace function public.contact_offer(p_offer bigint)
returns table (seller_name text, whatsapp text, book_title text)
language plpgsql security definer set search_path = public as $$
declare v_offer offers%rowtype;
begin
  if auth.uid() is null then raise exception 'Tenés que iniciar sesión'; end if;
  select * into v_offer from offers where id = p_offer;
  if v_offer.id is null or not is_member(book_school(v_offer.book_id)) then
    raise exception 'Publicación no encontrada';
  end if;
  if v_offer.seller_id = auth.uid() then raise exception 'Es tu propia publicación'; end if;
  if v_offer.status <> 'available' then raise exception 'Este libro ya no está disponible'; end if;

  insert into contacts (offer_id, buyer_id) values (p_offer, auth.uid()) on conflict do nothing;

  return query
    select p.full_name, pc.whatsapp, b.title
    from profiles p
    left join profile_contact pc on pc.user_id = p.id
    join books b on b.id = v_offer.book_id
    where p.id = v_offer.seller_id;
end $$;

revoke execute on function public.join_school(text)     from public, anon;
revoke execute on function public.contact_offer(bigint) from public, anon;
grant  execute on function public.join_school(text)     to authenticated;
grant  execute on function public.contact_offer(bigint) to authenticated;

-- Al registrarse con Google se crea el perfil con su nombre.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- SEGURIDAD (RLS): todo cerrado salvo lo que se permite explícitamente
-- ---------------------------------------------------------------------
alter table public.schools          enable row level security;
alter table public.profiles         enable row level security;
alter table public.profile_contact  enable row level security;
alter table public.school_members   enable row level security;
alter table public.grades           enable row level security;
alter table public.books            enable row level security;
alter table public.offers           enable row level security;
alter table public.wants            enable row level security;
alter table public.contacts         enable row level security;

-- schools: solo las de las que sos miembro
create policy "schools: ver mis escuelas" on public.schools
  for select to authenticated using (is_member(id));

-- profiles: el propio y los de tus compañeras de escuela; editar solo el propio
create policy "profiles: ver" on public.profiles
  for select to authenticated using (id = auth.uid() or shares_school(id));
create policy "profiles: editar el mío" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- profile_contact: solo la dueña
create policy "contacto: todo lo mío" on public.profile_contact
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- school_members: ver los de mis escuelas; salir yo; admins gestionan
create policy "miembros: ver" on public.school_members
  for select to authenticated using (is_member(school_id));
create policy "miembros: salir" on public.school_members
  for delete to authenticated using (user_id = auth.uid() or is_admin(school_id));
create policy "miembros: admin cambia roles" on public.school_members
  for update to authenticated using (is_admin(school_id)) with check (is_admin(school_id));

-- grades: miembros ven, admins editan
create policy "grados: ver" on public.grades
  for select to authenticated using (is_member(school_id));
create policy "grados: admin edita" on public.grades
  for all to authenticated using (is_admin(school_id)) with check (is_admin(school_id));

-- books: miembros ven, admins editan
create policy "libros: ver" on public.books
  for select to authenticated using (is_member(grade_school(grade_id)));
create policy "libros: admin edita" on public.books
  for all to authenticated using (is_admin(grade_school(grade_id))) with check (is_admin(grade_school(grade_id)));

-- offers: miembros ven las de su escuela; cada una gestiona las suyas
create policy "vendo: ver" on public.offers
  for select to authenticated using (is_member(book_school(book_id)));
create policy "vendo: crear" on public.offers
  for insert to authenticated with check (seller_id = auth.uid() and is_member(book_school(book_id)));
create policy "vendo: editar las mías" on public.offers
  for update to authenticated using (seller_id = auth.uid()) with check (seller_id = auth.uid());
create policy "vendo: borrar las mías" on public.offers
  for delete to authenticated using (seller_id = auth.uid());

-- wants: miembros ven las de su escuela (para saber cuántas buscan cada libro)
create policy "busco: ver" on public.wants
  for select to authenticated using (is_member(book_school(book_id)));
create policy "busco: crear" on public.wants
  for insert to authenticated with check (user_id = auth.uid() and is_member(book_school(book_id)));
create policy "busco: borrar los míos" on public.wants
  for delete to authenticated using (user_id = auth.uid());

-- contacts: los ve la interesada y la vendedora (se crean solo vía contact_offer)
create policy "contactos: ver" on public.contacts
  for select to authenticated using (
    buyer_id = auth.uid()
    or exists (select 1 from offers o where o.id = offer_id and o.seller_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- DATOS INICIALES
-- ---------------------------------------------------------------------
-- OJO: el repo es público. El código real NO va acá: se carga/cambia directo en Supabase
-- (Table Editor → schools → invite_code). Este valor es solo de ejemplo.
insert into public.schools (name, invite_code) values ('St John''s Pilar', 'CAMBIAR-ESTE-CODIGO');

update public.pasalibro_config set value = 'St John''s Pilar', updated_at = now() where key = 'school_name';
