-- PasaLibro · 007 · "Contactar": un comprador inicia contacto con un vendedor por varios libros a la vez.
-- Registra un contacto por cada publicación y devuelve el nombre y el WhatsApp del vendedor
-- (el WhatsApp es privado: solo se entrega por acá).
-- Se puede volver a correr.

create or replace function public.contact_seller(p_offers bigint[])
returns table (seller_name text, whatsapp text)
language plpgsql security definer set search_path = public as $$
declare
  v_sellers uuid[];
  v_count   int;
begin
  if auth.uid() is null then raise exception 'Tenés que iniciar sesión'; end if;
  if p_offers is null or cardinality(p_offers) = 0 then raise exception 'Elegí al menos un libro'; end if;

  select array_agg(distinct o.seller_id), count(*)
    into v_sellers, v_count
  from offers o
  where o.id = any(p_offers)
    and o.status = 'available'
    and is_member(book_school(o.book_id));

  if v_count <> (select count(distinct x) from unnest(p_offers) as x) then
    raise exception 'Alguno de los libros ya no está disponible. Actualizá la página.';
  end if;
  if cardinality(v_sellers) <> 1 then raise exception 'Los libros tienen que ser del mismo vendedor'; end if;
  if v_sellers[1] = auth.uid() then raise exception 'Son tus propias publicaciones'; end if;

  insert into contacts (offer_id, buyer_id)
  select x, auth.uid() from unnest(p_offers) as x
  on conflict do nothing;

  return query
    select p.full_name, pc.whatsapp
    from profiles p
    left join profile_contact pc on pc.user_id = p.id
    where p.id = v_sellers[1];
end $$;

revoke execute on function public.contact_seller(bigint[]) from public, anon;
grant  execute on function public.contact_seller(bigint[]) to authenticated;
