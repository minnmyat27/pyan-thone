-- Phase 2 functional MVP: atomic commerce actions, operations workflow,
-- reputation maintenance, listing image storage, and targeted realtime.

alter table public.orders
  add column delivery_address text,
  add constraint orders_delivery_address_length check (
    delivery_address is null or char_length(delivery_address) between 8 and 500
  );

alter table public.disputes
  add constraint disputes_reason_length check (char_length(reason) between 3 and 120),
  add constraint disputes_description_length check (char_length(description) between 10 and 2000);

create unique index orders_one_open_purchase_per_listing
  on public.orders(listing_id)
  where status not in ('closed');

create index orders_status_updated_idx on public.orders(status,updated_at desc);
create index conversations_buyer_created_idx on public.conversations(buyer_id,created_at desc);
create index conversations_seller_created_idx on public.conversations(seller_id,created_at desc);
create index disputes_status_created_idx on public.disputes(status,created_at desc);
create index deliveries_status_updated_idx on public.deliveries(status,updated_at desc);

create or replace function private.refresh_seller_stats(target_seller uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.seller_stats(seller_id,completed_sales,review_count,average_rating,dispute_count)
  select target_seller,
    (select count(*) from public.orders where seller_id=target_seller and status='completed'),
    (select count(*) from public.seller_reviews where seller_id=target_seller),
    coalesce((select round(avg(rating)::numeric,2) from public.seller_reviews where seller_id=target_seller),0),
    (select count(distinct d.id) from public.disputes d join public.orders o on o.id=d.order_id where o.seller_id=target_seller)
  on conflict(seller_id) do update set
    completed_sales=excluded.completed_sales,
    review_count=excluded.review_count,
    average_rating=excluded.average_rating,
    dispute_count=excluded.dispute_count,
    updated_at=now();
end
$$;

create or replace function private.refresh_stats_from_order()
returns trigger language plpgsql security definer set search_path = '' as $$
begin perform private.refresh_seller_stats(new.seller_id); return new; end
$$;
create or replace function private.refresh_stats_from_review()
returns trigger language plpgsql security definer set search_path = '' as $$
begin perform private.refresh_seller_stats(new.seller_id); return new; end
$$;
create or replace function private.refresh_stats_from_dispute()
returns trigger language plpgsql security definer set search_path = '' as $$
declare target_seller uuid;
begin
  select seller_id into target_seller from public.orders where id=new.order_id;
  perform private.refresh_seller_stats(target_seller);
  return new;
end
$$;

create trigger refresh_stats_order after insert or update of status on public.orders
for each row execute function private.refresh_stats_from_order();
create trigger refresh_stats_review after insert or update on public.seller_reviews
for each row execute function private.refresh_stats_from_review();
create trigger refresh_stats_dispute after insert or update of status on public.disputes
for each row execute function private.refresh_stats_from_dispute();

create function public.create_purchase(target_listing uuid, buyer_address text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare listing_row public.listings%rowtype; new_order uuid; buyer uuid := auth.uid(); ref text;
begin
  if buyer is null or not exists(select 1 from public.profiles where id=buyer and role='buyer') then
    raise exception 'buyer authentication required' using errcode='42501';
  end if;
  if char_length(trim(coalesce(buyer_address,''))) not between 8 and 500 then
    raise exception 'valid delivery address required' using errcode='22023';
  end if;
  select * into listing_row from public.listings where id=target_listing for update;
  if not found or listing_row.status <> 'active' or listing_row.seller_id=buyer then
    raise exception 'listing is unavailable' using errcode='P0001';
  end if;
  if exists(select 1 from public.orders where listing_id=target_listing and status<>'closed') then
    raise exception 'listing already purchased' using errcode='23505';
  end if;
  ref := 'PT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
  insert into public.orders(reference,listing_id,buyer_id,seller_id,agreed_price,currency,status,delivery_address)
  values(ref,listing_row.id,buyer,listing_row.seller_id,listing_row.current_price,listing_row.currency,'payment_pending',trim(buyer_address))
  returning id into new_order;
  update public.orders set status='payment_secured' where id=new_order;
  update public.orders set status='awaiting_seller_shipment' where id=new_order;
  insert into public.escrow_records(order_id,status,amount,currency,provider_reference)
  values(new_order,'secured_held',listing_row.current_price,listing_row.currency,'DEMO-'||ref);
  insert into public.verification_records(order_id,status) values(new_order,'pending');
  update public.listings set status='reserved' where id=listing_row.id;
  return new_order;
end
$$;

create function public.open_listing_conversation(target_listing uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare listing_row public.listings%rowtype; buyer uuid := auth.uid(); conversation uuid;
begin
  if buyer is null or not exists(select 1 from public.profiles where id=buyer and role='buyer') then
    raise exception 'buyer authentication required' using errcode='42501';
  end if;
  select * into listing_row from public.listings where id=target_listing and status='active';
  if not found or listing_row.seller_id=buyer then raise exception 'listing unavailable' using errcode='P0001'; end if;
  insert into public.conversations(listing_id,buyer_id,seller_id)
  values(target_listing,buyer,listing_row.seller_id)
  on conflict(listing_id,buyer_id,seller_id) do update set listing_id=excluded.listing_id
  returning id into conversation;
  return conversation;
end
$$;

create function public.seller_mark_shipped(target_order uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.orders where id=target_order and seller_id=auth.uid() and status='awaiting_seller_shipment') then
    raise exception 'seller shipment action not allowed' using errcode='42501';
  end if;
  update public.orders set status='shipping_to_verification' where id=target_order;
end
$$;

create function public.admin_advance_order(target_order uuid, operation text, details jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare current_order public.orders%rowtype; v_delivery_id uuid; waypoint_count int; route numeric[][] := array[
  array[16.798900,96.149800],array[16.805500,96.158200],array[16.812400,96.167600],
  array[16.818500,96.176000],array[16.824300,96.184500],array[16.830200,96.191400]
];
begin
  if not private.is_admin() then raise exception 'admin required' using errcode='42501'; end if;
  select * into current_order from public.orders where id=target_order for update;
  if not found then raise exception 'order not found' using errcode='P0002'; end if;
  case operation
    when 'receive' then
      if current_order.status<>'shipping_to_verification' then raise exception 'order not awaiting receipt' using errcode='23514'; end if;
      update public.orders set status='received_at_verification' where id=target_order;
      update public.verification_records set verifier_id=auth.uid(),status='pending' where order_id=target_order;
    when 'start_inspection' then
      if current_order.status<>'received_at_verification' then raise exception 'order not ready for inspection' using errcode='23514'; end if;
      update public.orders set status='inspection_in_progress' where id=target_order;
      update public.verification_records set verifier_id=auth.uid(),status='in_progress' where order_id=target_order;
    when 'pass' then
      if current_order.status<>'inspection_in_progress' then raise exception 'inspection not active' using errcode='23514'; end if;
      update public.verification_records set verifier_id=auth.uid(),status='passed',inspected_at=now(),
        listing_matches=coalesce((details->>'listing_matches')::boolean,true),
        condition_matches=coalesce((details->>'condition_matches')::boolean,true),
        notes=nullif(details->>'notes',''),rejection_reason=null where order_id=target_order;
      update public.orders set status='verified' where id=target_order;
    when 'fail' then
      if current_order.status<>'inspection_in_progress' or nullif(trim(details->>'reason'),'') is null then
        raise exception 'active inspection and rejection reason required' using errcode='23514';
      end if;
      update public.verification_records set verifier_id=auth.uid(),status='failed',inspected_at=now(),
        listing_matches=coalesce((details->>'listing_matches')::boolean,false),
        condition_matches=coalesce((details->>'condition_matches')::boolean,false),
        notes=nullif(details->>'notes',''),rejection_reason=trim(details->>'reason') where order_id=target_order;
      update public.orders set status='verification_failed' where id=target_order;
    when 'refund_pending' then
      update public.orders set status='buyer_refund_pending' where id=target_order and status='verification_failed';
      if not found then raise exception 'refund cannot start' using errcode='23514'; end if;
      update public.escrow_records set status='refund_pending' where order_id=target_order;
    when 'refund' then
      update public.orders set status='buyer_refunded' where id=target_order and status='buyer_refund_pending';
      if not found then raise exception 'refund not pending' using errcode='23514'; end if;
      update public.escrow_records set status='refunded' where order_id=target_order;
    when 'return' then
      update public.orders set status='return_to_seller' where id=target_order and status='buyer_refunded';
      if not found then raise exception 'return not ready' using errcode='23514'; end if;
    when 'close' then
      update public.orders set status='closed' where id=target_order and status='return_to_seller';
      if not found then raise exception 'return not complete' using errcode='23514'; end if;
      update public.listings set status='draft' where id=current_order.listing_id;
    when 'start_delivery' then
      if current_order.status<>'verified' then raise exception 'order not verified' using errcode='23514'; end if;
      insert into public.deliveries(order_id,status,courier_name,courier_phone,pickup_address,destination_address,estimated_delivery,latest_latitude,latest_longitude)
      values(target_order,'in_transit_to_buyer',coalesce(nullif(details->>'courier_name',''),'Demo Courier'),
        nullif(details->>'courier_phone',''),'Pyan Thone Verification Center, Yangon',current_order.delivery_address,
        now()+interval '45 minutes',route[1][1],route[1][2])
      on conflict(order_id) do update set status='in_transit_to_buyer',courier_name=excluded.courier_name,
        courier_phone=excluded.courier_phone,estimated_delivery=excluded.estimated_delivery,
        latest_latitude=excluded.latest_latitude,latest_longitude=excluded.latest_longitude
      returning id into v_delivery_id;
      insert into public.delivery_location_updates(delivery_id,latitude,longitude) values(v_delivery_id,route[1][1],route[1][2]);
      update public.orders set status='out_for_delivery' where id=target_order;
    when 'advance_delivery' then
      select id into v_delivery_id from public.deliveries where order_id=target_order and status='in_transit_to_buyer';
      if v_delivery_id is null then raise exception 'delivery not active' using errcode='23514'; end if;
      select least(count(*)+1,array_length(route,1)) into waypoint_count from public.delivery_location_updates loc where loc.delivery_id=v_delivery_id;
      insert into public.delivery_location_updates(delivery_id,latitude,longitude) values(v_delivery_id,route[waypoint_count][1],route[waypoint_count][2]);
      update public.deliveries set latest_latitude=route[waypoint_count][1],latest_longitude=route[waypoint_count][2] where id=v_delivery_id;
    when 'delivered' then
      update public.orders set status='delivered' where id=target_order and status='out_for_delivery';
      if not found then raise exception 'delivery not active' using errcode='23514'; end if;
      update public.deliveries set status='delivered' where order_id=target_order;
    when 'release_payment' then
      update public.orders set status='payment_released' where id=target_order and status='delivered';
      if not found then raise exception 'delivery not completed' using errcode='23514'; end if;
      update public.escrow_records set status='payout_pending' where order_id=target_order;
    when 'complete' then
      update public.orders set status='completed' where id=target_order and status='payment_released';
      if not found then raise exception 'payment not released' using errcode='23514'; end if;
      update public.escrow_records set status='seller_paid' where order_id=target_order;
      update public.listings set status='sold' where id=current_order.listing_id;
    else raise exception 'unknown operation' using errcode='22023';
  end case;
end
$$;

revoke all on function public.create_purchase(uuid,text) from public,anon,authenticated;
revoke all on function public.open_listing_conversation(uuid) from public,anon,authenticated;
revoke all on function public.seller_mark_shipped(uuid) from public,anon,authenticated;
revoke all on function public.admin_advance_order(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.create_purchase(uuid,text),public.open_listing_conversation(uuid),
  public.seller_mark_shipped(uuid),public.admin_advance_order(uuid,text,jsonb) to authenticated;

-- Public listing media, with seller-owned upload namespaces:
-- <seller uuid>/<listing uuid>/<random filename>.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('listing-images','listing-images',true,5242880,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy listing_images_insert on storage.objects for insert to authenticated with check(
  bucket_id='listing-images' and (storage.foldername(name))[1]=auth.uid()::text
  and exists(select 1 from public.listings l where l.id::text=(storage.foldername(name))[2] and l.seller_id=auth.uid())
  and lower(storage.extension(name)) in ('jpg','jpeg','png','webp','gif')
);
create policy listing_images_update on storage.objects for update to authenticated using(
  bucket_id='listing-images' and (storage.foldername(name))[1]=auth.uid()::text
) with check(
  bucket_id='listing-images' and (storage.foldername(name))[1]=auth.uid()::text
);
create policy listing_images_delete on storage.objects for delete to authenticated using(
  bucket_id='listing-images' and (storage.foldername(name))[1]=auth.uid()::text
);

do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='delivery_location_updates') then
    alter publication supabase_realtime add table public.delivery_location_updates;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
