-- Keep buyer delivery addresses available to the buyer and operations staff only.
-- RLS is row-based, so remove table-wide column access and expose the address
-- through a narrowly-authorized function instead.
revoke select on public.orders from authenticated;
grant select (
  id, reference, listing_id, buyer_id, seller_id, agreed_price, currency,
  status, created_at, updated_at
) on public.orders to authenticated;

revoke select on public.deliveries from authenticated;
grant select (
  id, order_id, status, courier_name, estimated_delivery,
  latest_latitude, latest_longitude, created_at, updated_at
) on public.deliveries to authenticated;

create function public.get_order_delivery_address(target_order uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result text;
begin
  select o.delivery_address into result
  from public.orders o
  where o.id = target_order
    and ((select auth.uid()) = o.buyer_id or private.is_admin());

  if not found then
    raise exception 'delivery address access denied' using errcode = '42501';
  end if;
  return result;
end
$$;

revoke all on function public.get_order_delivery_address(uuid) from public, anon, authenticated;
grant execute on function public.get_order_delivery_address(uuid) to authenticated;
