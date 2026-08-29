-- Pyan Thone Phase 1: domain model, integrity, API grants, and RLS.
create extension if not exists pgcrypto;

create type public.app_role as enum ('buyer','seller','admin');
create type public.item_condition as enum ('new','like_new','good','fair','poor');
create type public.listing_status as enum ('draft','active','reserved','sold','removed');
create type public.order_status as enum ('payment_pending','payment_secured','awaiting_seller_shipment','shipping_to_verification','received_at_verification','inspection_in_progress','verified','verification_failed','buyer_refund_pending','buyer_refunded','return_to_seller','out_for_delivery','delivered','payment_released','completed','closed');
create type public.verification_status as enum ('pending','in_progress','passed','failed');
create type public.delivery_status as enum ('pending','ready_for_pickup','in_transit_to_buyer','delivered','returned');
create type public.payment_status as enum ('awaiting_payment','secured_held','refund_pending','refunded','payout_pending','seller_paid');
create type public.dispute_status as enum ('open','under_review','resolved_buyer','resolved_seller','closed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80), avatar_url text,
  role public.app_role not null default 'buyer', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.seller_stats (
  seller_id uuid primary key references public.profiles(id) on delete cascade,
  completed_sales integer not null default 0 check (completed_sales >= 0), review_count integer not null default 0 check (review_count >= 0),
  average_rating numeric(3,2) not null default 0 check (average_rating between 0 and 5), dispute_count integer not null default 0 check (dispute_count >= 0), updated_at timestamptz not null default now()
);
create table public.categories (id uuid primary key default gen_random_uuid(), name text unique not null, slug text unique not null);
create table public.listings (
  id uuid primary key default gen_random_uuid(), seller_id uuid not null references public.profiles(id), category_id uuid references public.categories(id),
  title text not null check (char_length(title) between 3 and 140), description text not null, condition public.item_condition not null,
  current_price numeric(14,2) not null check (current_price > 0), currency char(3) not null default 'MMK' check (currency = upper(currency)),
  status public.listing_status not null default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.listing_images (id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.listings(id) on delete cascade, storage_path text not null, alt_text text, sort_order smallint not null default 0, unique(listing_id, sort_order));
create table public.orders (
  id uuid primary key default gen_random_uuid(), reference text unique not null, listing_id uuid not null references public.listings(id), buyer_id uuid not null references public.profiles(id), seller_id uuid not null references public.profiles(id),
  agreed_price numeric(14,2) not null check (agreed_price > 0), currency char(3) not null default 'MMK', status public.order_status not null default 'payment_pending',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (buyer_id <> seller_id)
);
create table public.order_status_history (id bigint generated always as identity primary key, order_id uuid not null references public.orders(id) on delete cascade, from_status public.order_status, to_status public.order_status not null, changed_by uuid references public.profiles(id), note text, created_at timestamptz not null default now());
create table public.verification_records (id uuid primary key default gen_random_uuid(), order_id uuid unique not null references public.orders(id) on delete cascade, verifier_id uuid references public.profiles(id), status public.verification_status not null default 'pending', inspected_at timestamptz, notes text, condition_matches boolean, listing_matches boolean, rejection_reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (status <> 'failed' or rejection_reason is not null));
create table public.deliveries (id uuid primary key default gen_random_uuid(), order_id uuid unique not null references public.orders(id) on delete cascade, status public.delivery_status not null default 'pending', courier_name text, courier_phone text, pickup_address text not null, destination_address text not null, estimated_delivery timestamptz, latest_latitude numeric(9,6), latest_longitude numeric(9,6), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (latest_latitude between -90 and 90), check (latest_longitude between -180 and 180));
create table public.delivery_location_updates (id bigint generated always as identity primary key, delivery_id uuid not null references public.deliveries(id) on delete cascade, latitude numeric(9,6) not null check (latitude between -90 and 90), longitude numeric(9,6) not null check (longitude between -180 and 180), recorded_at timestamptz not null default now());
create table public.conversations (id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.listings(id), buyer_id uuid not null references public.profiles(id), seller_id uuid not null references public.profiles(id), created_at timestamptz not null default now(), unique(listing_id,buyer_id,seller_id), check (buyer_id <> seller_id));
create table public.messages (id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade, sender_id uuid not null references public.profiles(id), body text not null check (char_length(body) between 1 and 4000), read_at timestamptz, created_at timestamptz not null default now());
create table public.seller_reviews (id uuid primary key default gen_random_uuid(), order_id uuid unique not null references public.orders(id), buyer_id uuid not null references public.profiles(id), seller_id uuid not null references public.profiles(id), rating smallint not null check (rating between 1 and 5), comment text check (char_length(comment) <= 2000), created_at timestamptz not null default now(), check (buyer_id <> seller_id));
create table public.disputes (id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id), opened_by uuid not null references public.profiles(id), reason text not null, description text not null, status public.dispute_status not null default 'open', resolved_by uuid references public.profiles(id), resolution_notes text, created_at timestamptz not null default now(), resolved_at timestamptz);
create table public.escrow_records (id uuid primary key default gen_random_uuid(), order_id uuid unique not null references public.orders(id), status public.payment_status not null default 'awaiting_payment', provider_reference text, amount numeric(14,2) not null check (amount > 0), currency char(3) not null default 'MMK', created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create function private.is_admin() returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'admin') $$;
create function private.is_order_party(target uuid) returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.orders where id=target and ((select auth.uid()) in (buyer_id,seller_id) or private.is_admin())) $$;
revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema private to anon,authenticated;
grant execute on function private.is_admin() to anon,authenticated;
grant execute on function private.is_order_party(uuid) to authenticated;

create function public.set_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end $$;
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.profiles(id,display_name,role) values(new.id,coalesce(nullif(new.raw_user_meta_data->>'display_name',''),split_part(new.email,'@',1)),case when new.raw_user_meta_data->>'requested_role'='seller' then 'seller'::public.app_role else 'buyer'::public.app_role end); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create function public.validate_order_transition() returns trigger language plpgsql set search_path='' as $$
begin if new.status=old.status then return new; end if;
if not ((old.status='payment_pending' and new.status='payment_secured') or (old.status='payment_secured' and new.status='awaiting_seller_shipment') or (old.status='awaiting_seller_shipment' and new.status='shipping_to_verification') or (old.status='shipping_to_verification' and new.status='received_at_verification') or (old.status='received_at_verification' and new.status='inspection_in_progress') or (old.status='inspection_in_progress' and new.status in ('verified','verification_failed')) or (old.status='verified' and new.status='out_for_delivery') or (old.status='verification_failed' and new.status='buyer_refund_pending') or (old.status='buyer_refund_pending' and new.status='buyer_refunded') or (old.status='buyer_refunded' and new.status='return_to_seller') or (old.status='return_to_seller' and new.status='closed') or (old.status='out_for_delivery' and new.status='delivered') or (old.status='delivered' and new.status='payment_released') or (old.status='payment_released' and new.status='completed')) then raise exception 'invalid order transition: % -> %',old.status,new.status; end if; return new; end $$;
create trigger validate_order_status before update of status on public.orders for each row execute function public.validate_order_transition();
create function public.record_order_status() returns trigger language plpgsql security definer set search_path='' as $$ begin if old.status is distinct from new.status then insert into public.order_status_history(order_id,from_status,to_status,changed_by) values(new.id,old.status,new.status,auth.uid()); end if; return new; end $$;
create trigger record_order_status after update of status on public.orders for each row execute function public.record_order_status();
create function public.validate_review() returns trigger language plpgsql set search_path='' as $$ begin if not exists(select 1 from public.orders o where o.id=new.order_id and o.buyer_id=new.buyer_id and o.seller_id=new.seller_id and o.status='completed') then raise exception 'review requires the completed order buyer and seller'; end if; return new; end $$;
create trigger validate_seller_review before insert or update on public.seller_reviews for each row execute function public.validate_review();
create function public.validate_message_sender() returns trigger language plpgsql set search_path='' as $$ begin if not exists(select 1 from public.conversations c where c.id=new.conversation_id and new.sender_id in(c.buyer_id,c.seller_id)) then raise exception 'sender must be a conversation participant'; end if; return new; end $$;
create trigger validate_message before insert or update on public.messages for each row execute function public.validate_message_sender();
do $$ declare t text; begin foreach t in array array['profiles','seller_stats','categories','listings','listing_images','orders','order_status_history','verification_records','deliveries','delivery_location_updates','conversations','messages','seller_reviews','disputes','escrow_records'] loop execute format('alter table public.%I enable row level security',t); execute format('alter table public.%I force row level security',t); end loop; end $$;

-- Explicit Data API privileges (new Supabase projects no longer auto-grant these).
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.seller_stats, public.seller_reviews to anon, authenticated;
grant select on public.profiles, public.listings, public.listing_images to anon, authenticated;
grant select,insert,update,delete on public.orders,public.order_status_history,public.verification_records,public.deliveries,public.delivery_location_updates,public.conversations,public.messages,public.disputes,public.escrow_records to authenticated;
grant insert,update,delete on public.listings,public.listing_images,public.seller_reviews to authenticated;
grant update on public.profiles to authenticated;
grant usage,select on all sequences in schema public to authenticated;

create policy profiles_public_seller_read on public.profiles for select to anon,authenticated using (role='seller' or id=(select auth.uid()) or private.is_admin());
create policy profiles_self_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
-- Column grant prevents role mutation even when the row policy passes.
revoke update on public.profiles from authenticated; grant update(display_name,avatar_url) on public.profiles to authenticated;
create policy seller_stats_public_read on public.seller_stats for select to anon,authenticated using(true);
create policy categories_public_read on public.categories for select to anon,authenticated using(true);
create policy categories_admin_all on public.categories for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy listings_public_or_owner_read on public.listings for select to anon,authenticated using(status='active' or seller_id=(select auth.uid()) or private.is_admin());
create policy listings_seller_insert on public.listings for insert to authenticated with check(seller_id=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='seller'));
create policy listings_owner_update on public.listings for update to authenticated using(seller_id=(select auth.uid()) or private.is_admin()) with check(seller_id=(select auth.uid()) or private.is_admin());
create policy listings_owner_delete on public.listings for delete to authenticated using(seller_id=(select auth.uid()) or private.is_admin());
create policy images_read on public.listing_images for select to anon,authenticated using(exists(select 1 from public.listings l where l.id=listing_id and (l.status='active' or l.seller_id=auth.uid() or private.is_admin())));
create policy images_owner_all on public.listing_images for all to authenticated using(exists(select 1 from public.listings l where l.id=listing_id and (l.seller_id=auth.uid() or private.is_admin()))) with check(exists(select 1 from public.listings l where l.id=listing_id and (l.seller_id=auth.uid() or private.is_admin())));
create policy orders_party_read on public.orders for select to authenticated using(buyer_id=(select auth.uid()) or seller_id=(select auth.uid()) or private.is_admin());
create policy orders_buyer_insert on public.orders for insert to authenticated with check(buyer_id=(select auth.uid()) and buyer_id<>seller_id and exists(select 1 from public.listings l where l.id=listing_id and l.seller_id=seller_id and l.status='active'));
create policy orders_admin_update on public.orders for update to authenticated using(private.is_admin()) with check(private.is_admin());
create policy history_party_read on public.order_status_history for select to authenticated using(private.is_order_party(order_id));
create policy verification_party_read on public.verification_records for select to authenticated using(private.is_order_party(order_id));
create policy verification_admin_write on public.verification_records for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy delivery_party_read on public.deliveries for select to authenticated using(private.is_order_party(order_id));
create policy delivery_admin_write on public.deliveries for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy locations_party_read on public.delivery_location_updates for select to authenticated using(exists(select 1 from public.deliveries d where d.id=delivery_id and private.is_order_party(d.order_id)));
create policy locations_admin_write on public.delivery_location_updates for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy conversations_participant_read on public.conversations for select to authenticated using((select auth.uid()) in(buyer_id,seller_id) or private.is_admin());
create policy conversations_buyer_insert on public.conversations for insert to authenticated with check(buyer_id=(select auth.uid()) and exists(select 1 from public.listings l where l.id=listing_id and l.seller_id=seller_id and l.status='active'));
create policy messages_participant_read on public.messages for select to authenticated using(exists(select 1 from public.conversations c where c.id=conversation_id and auth.uid() in(c.buyer_id,c.seller_id)) or private.is_admin());
create policy messages_participant_insert on public.messages for insert to authenticated with check(sender_id=(select auth.uid()) and exists(select 1 from public.conversations c where c.id=conversation_id and auth.uid() in(c.buyer_id,c.seller_id)));
create policy messages_sender_update on public.messages for update to authenticated using(sender_id=(select auth.uid())) with check(sender_id=(select auth.uid()));
create policy reviews_public_read on public.seller_reviews for select to anon,authenticated using(true);
create policy reviews_buyer_insert on public.seller_reviews for insert to authenticated with check(buyer_id=(select auth.uid()) and buyer_id<>seller_id);
create policy disputes_party_read on public.disputes for select to authenticated using(private.is_order_party(order_id));
create policy disputes_party_insert on public.disputes for insert to authenticated with check(opened_by=(select auth.uid()) and private.is_order_party(order_id));
create policy disputes_admin_update on public.disputes for update to authenticated using(private.is_admin()) with check(private.is_admin());
create policy escrow_party_read on public.escrow_records for select to authenticated using(private.is_order_party(order_id));
create policy escrow_admin_write on public.escrow_records for all to authenticated using(private.is_admin()) with check(private.is_admin());

-- Public history is an intentional projection: no order/agreed/current price columns.
create view public.public_seller_history with (security_invoker=true) as
select l.seller_id,l.id as listing_id,l.title,l.condition,o.updated_at as completed_at,r.rating,r.comment
from public.listings l join public.orders o on o.listing_id=l.id left join public.seller_reviews r on r.order_id=o.id where o.status='completed';
grant select on public.public_seller_history to anon,authenticated;

create index listings_seller_status_idx on public.listings(seller_id,status);
create index orders_buyer_idx on public.orders(buyer_id); create index orders_seller_idx on public.orders(seller_id);
create index messages_conversation_created_idx on public.messages(conversation_id,created_at);
create index locations_delivery_recorded_idx on public.delivery_location_updates(delivery_id,recorded_at);
