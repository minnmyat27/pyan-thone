-- Purchased listings remain private from the public, but the order buyer must
-- retain enough listing access to render their transaction.
drop policy listings_public_or_owner_read on public.listings;
create policy listings_public_or_owner_read on public.listings for select to anon,authenticated using(
  status='active'
  or seller_id=(select auth.uid())
  or private.is_admin()
  or exists(select 1 from public.orders o where o.listing_id=listings.id and o.buyer_id=(select auth.uid()))
);
