-- Store addresses outside the exposed API schema. Public transaction rows keep
-- only a non-sensitive placeholder so PostgREST relationship embedding remains
-- compatible for legitimate order participants.
create table private.order_delivery_addresses (
  order_id uuid primary key references public.orders(id) on delete cascade,
  address text not null check (char_length(address) between 8 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table private.order_delivery_addresses enable row level security;
alter table private.order_delivery_addresses force row level security;
revoke all on private.order_delivery_addresses from public, anon, authenticated;

insert into private.order_delivery_addresses(order_id,address)
select id,delivery_address from public.orders
where delivery_address is not null and delivery_address <> 'Buyer address held privately'
on conflict(order_id) do update set address=excluded.address,updated_at=now();

update public.orders set delivery_address='Buyer address held privately'
where delivery_address is not null;
update public.deliveries set destination_address='Buyer address held privately';

create function private.vault_order_delivery_address()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.delivery_address is not null and new.delivery_address <> 'Buyer address held privately' then
    insert into private.order_delivery_addresses(order_id,address)
    values(new.id,new.delivery_address)
    on conflict(order_id) do update set address=excluded.address,updated_at=now();
    update public.orders set delivery_address='Buyer address held privately' where id=new.id;
  end if;
  return new;
end
$$;
revoke all on function private.vault_order_delivery_address() from public,anon,authenticated;
create trigger vault_order_delivery_address after insert on public.orders
for each row execute function private.vault_order_delivery_address();

create or replace function public.get_order_delivery_address(target_order uuid)
returns text language plpgsql stable security definer set search_path='' as $$
declare result text;
begin
  select a.address into result
  from private.order_delivery_addresses a
  join public.orders o on o.id=a.order_id
  where o.id=target_order and ((select auth.uid())=o.buyer_id or private.is_admin());
  if not found then raise exception 'delivery address access denied' using errcode='42501'; end if;
  return result;
end
$$;

grant select on public.orders,public.deliveries to authenticated;
