create function private.is_listing_buyer(target_listing uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.orders where listing_id=target_listing and buyer_id=(select auth.uid()))
$$;
revoke all on function private.is_listing_buyer(uuid) from public,anon,authenticated;
grant execute on function private.is_listing_buyer(uuid) to anon,authenticated;

drop policy listings_public_or_owner_read on public.listings;
create policy listings_public_or_owner_read on public.listings for select to anon,authenticated using(
  status='active'
  or seller_id=(select auth.uid())
  or private.is_admin()
  or private.is_listing_buyer(id)
);
