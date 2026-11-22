-- PasaLibro · 004 · Cada escuela tiene que tener siempre al menos un admin.
-- Bloquea quitarle el rol (o sacar de la escuela) al último admin.
-- Si se borra la escuela entera, no molesta (los miembros se borran en cascada).

create or replace function public.keep_one_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'admin' and (tg_op = 'DELETE' or new.role <> 'admin') then
    if exists (select 1 from schools where id = old.school_id)
       and not exists (
         select 1 from school_members
         where school_id = old.school_id and role = 'admin' and user_id <> old.user_id
       ) then
      raise exception 'La escuela tiene que tener al menos un admin';
    end if;
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists school_members_keep_one_admin on public.school_members;
create trigger school_members_keep_one_admin
  before update or delete on public.school_members
  for each row execute function public.keep_one_admin();
