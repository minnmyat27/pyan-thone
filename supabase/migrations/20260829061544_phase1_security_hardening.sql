-- Phase 1 security hardening. This migration intentionally contains no Phase 2 features.

-- Relationship integrity must also hold for privileged/server writes.
alter table public.listings add constraint listings_id_seller_unique unique (id, seller_id);
alter table public.orders add constraint orders_listing_seller_fk
  foreign key (listing_id, seller_id) references public.listings(id, seller_id);
alter table public.conversations add constraint conversations_listing_seller_fk
  foreign key (listing_id, seller_id) references public.listings(id, seller_id);

alter table public.disputes add column updated_at timestamptz not null default now();

-- Safe, immutable public sale evidence. It contains no order id, buyer id, or price.
create table public.seller_sale_history (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id),
  title_snapshot text not null,
  condition_snapshot public.item_condition not null,
  completed_at timestamptz not null,
  rating smallint check (rating between 1 and 5),
  review_comment text check (char_length(review_comment) <= 2000),
  created_at timestamptz not null default now(),
  unique (listing_id)
);
alter table public.seller_sale_history enable row level security;
alter table public.seller_sale_history force row level security;

-- Remove the old view before changing its safe source.
drop view public.public_seller_history;

-- Move trigger functions out of the exposed public schema.
drop trigger on_auth_user_created on auth.users;
drop trigger validate_order_status on public.orders;
drop trigger record_order_status on public.orders;
drop trigger validate_seller_review on public.seller_reviews;
drop trigger validate_message on public.messages;
drop function public.handle_new_user();
drop function public.validate_order_transition();
drop function public.record_order_status();
drop function public.validate_review();
drop function public.validate_message_sender();
drop function public.set_updated_at();

create function private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end
$$;

create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare safe_role public.app_role;
begin
  safe_role := case when new.raw_user_meta_data->>'requested_role' = 'seller'
    then 'seller'::public.app_role else 'buyer'::public.app_role end;
  insert into public.profiles(id, display_name, role)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(new.email,'@',1)), safe_role);
  if safe_role = 'seller' then insert into public.seller_stats(seller_id) values (new.id); end if;
  return new;
end
$$;

create function private.validate_order_transition() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = old.status then return new; end if;
  if not (
    (old.status='payment_pending' and new.status='payment_secured') or
    (old.status='payment_secured' and new.status='awaiting_seller_shipment') or
    (old.status='awaiting_seller_shipment' and new.status='shipping_to_verification') or
    (old.status='shipping_to_verification' and new.status='received_at_verification') or
    (old.status='received_at_verification' and new.status='inspection_in_progress') or
    (old.status='inspection_in_progress' and new.status in ('verified','verification_failed')) or
    (old.status='verified' and new.status='out_for_delivery') or
    (old.status='verification_failed' and new.status='buyer_refund_pending') or
    (old.status='buyer_refund_pending' and new.status='buyer_refunded') or
    (old.status='buyer_refunded' and new.status='return_to_seller') or
    (old.status='return_to_seller' and new.status='closed') or
    (old.status='out_for_delivery' and new.status='delivered') or
    (old.status='delivered' and new.status='payment_released') or
    (old.status='payment_released' and new.status='completed')
  ) then raise exception 'invalid order transition: % -> %', old.status, new.status using errcode='23514'; end if;
  return new;
end
$$;

create function private.validate_order_relationships() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.profiles where id=new.buyer_id and role='buyer') then
    raise exception 'order buyer must have buyer role' using errcode='23514';
  end if;
  if not exists (select 1 from public.profiles where id=new.seller_id and role='seller') then
    raise exception 'order seller must have seller role' using errcode='23514';
  end if;
  if not exists (select 1 from public.listings where id=new.listing_id and seller_id=new.seller_id) then
    raise exception 'order seller must own listing' using errcode='23514';
  end if;
  return new;
end
$$;

create function private.validate_conversation_relationships() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.profiles where id=new.buyer_id and role='buyer') or
     not exists (select 1 from public.profiles where id=new.seller_id and role='seller') or
     not exists (select 1 from public.listings where id=new.listing_id and seller_id=new.seller_id) then
    raise exception 'conversation participants must match buyer and listing seller' using errcode='23514';
  end if;
  return new;
end
$$;

create function private.validate_review() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.orders o where o.id=new.order_id and o.buyer_id=new.buyer_id and o.seller_id=new.seller_id and o.status='completed') then
    raise exception 'review requires the completed order buyer and seller' using errcode='23514';
  end if;
  return new;
end
$$;

create function private.validate_message_sender() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.conversations c where c.id=new.conversation_id and new.sender_id in(c.buyer_id,c.seller_id))
     or (auth.uid() is not null and new.sender_id <> auth.uid()) then
    raise exception 'sender must be the authenticated conversation participant' using errcode='42501';
  end if;
  return new;
end
$$;

create function private.record_order_status() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.status is distinct from new.status then
    insert into public.order_status_history(order_id,from_status,to_status,changed_by)
    values(new.id,old.status,new.status,auth.uid());
  end if;
  return new;
end
$$;

create function private.publish_completed_sale() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status='completed' then
    if tg_op='INSERT' or (tg_op='UPDATE' and old.status is distinct from new.status) then
      insert into public.seller_sale_history(seller_id,listing_id,title_snapshot,condition_snapshot,completed_at)
      select new.seller_id,l.id,l.title,l.condition,coalesce(new.updated_at,now()) from public.listings l where l.id=new.listing_id
      on conflict (listing_id) do nothing;
    end if;
  end if;
  return new;
end
$$;

create function private.publish_sale_review() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.seller_sale_history h set rating=new.rating,review_comment=new.comment
  from public.orders o where o.id=new.order_id and h.listing_id=o.listing_id and h.seller_id=new.seller_id;
  return new;
end
$$;

-- Trigger-only functions stay private and are not callable as RPCs.
revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.is_order_party(uuid) to authenticated;

create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();
create trigger validate_order_relationships before insert or update of listing_id,buyer_id,seller_id on public.orders for each row execute function private.validate_order_relationships();
create trigger validate_order_status before update of status on public.orders for each row execute function private.validate_order_transition();
create trigger record_order_status after update of status on public.orders for each row execute function private.record_order_status();
create trigger publish_completed_sale after insert or update of status on public.orders for each row execute function private.publish_completed_sale();
create trigger validate_conversation_relationships before insert or update of listing_id,buyer_id,seller_id on public.conversations for each row execute function private.validate_conversation_relationships();
create trigger validate_seller_review before insert or update on public.seller_reviews for each row execute function private.validate_review();
create trigger publish_sale_review after insert or update on public.seller_reviews for each row execute function private.publish_sale_review();
create trigger validate_message before insert or update on public.messages for each row execute function private.validate_message_sender();

create trigger profiles_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger seller_stats_updated_at before update on public.seller_stats for each row execute function private.set_updated_at();
create trigger listings_updated_at before update on public.listings for each row execute function private.set_updated_at();
create trigger orders_updated_at before update on public.orders for each row execute function private.set_updated_at();
create trigger verification_updated_at before update on public.verification_records for each row execute function private.set_updated_at();
create trigger deliveries_updated_at before update on public.deliveries for each row execute function private.set_updated_at();
create trigger disputes_updated_at before update on public.disputes for each row execute function private.set_updated_at();
create trigger escrow_updated_at before update on public.escrow_records for each row execute function private.set_updated_at();

-- Replace broad grants with least-privilege operation grants. RLS remains authoritative.
revoke all on public.profiles,public.seller_stats,public.categories,public.listings,public.listing_images,
  public.orders,public.order_status_history,public.verification_records,public.deliveries,
  public.delivery_location_updates,public.conversations,public.messages,public.seller_reviews,
  public.disputes,public.escrow_records,public.seller_sale_history from anon,authenticated;
revoke all on sequence public.order_status_history_id_seq,public.delivery_location_updates_id_seq from anon,authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.profiles,public.seller_stats,public.categories,public.listings,public.listing_images,public.seller_reviews,public.seller_sale_history to anon,authenticated;
grant update(display_name,avatar_url) on public.profiles to authenticated;
grant insert,update,delete on public.categories to authenticated;
grant insert,update,delete on public.listings,public.listing_images to authenticated;
grant select,insert,update on public.orders to authenticated;
grant select on public.order_status_history to authenticated;
grant select,insert,update on public.verification_records,public.deliveries,public.delivery_location_updates,public.escrow_records to authenticated;
grant select,insert on public.conversations to authenticated;
grant select,insert,update on public.messages to authenticated;
grant insert on public.seller_reviews to authenticated;
grant select,insert,update on public.disputes to authenticated;
grant usage,select on sequence public.order_status_history_id_seq,public.delivery_location_updates_id_seq to authenticated;

-- Replace all-operation policies where DELETE is not an intended client operation.
drop policy verification_admin_write on public.verification_records;
create policy verification_admin_insert on public.verification_records for insert to authenticated with check(private.is_admin());
create policy verification_admin_update on public.verification_records for update to authenticated using(private.is_admin()) with check(private.is_admin());
drop policy delivery_admin_write on public.deliveries;
create policy delivery_admin_insert on public.deliveries for insert to authenticated with check(private.is_admin());
create policy delivery_admin_update on public.deliveries for update to authenticated using(private.is_admin()) with check(private.is_admin());
drop policy locations_admin_write on public.delivery_location_updates;
create policy locations_admin_insert on public.delivery_location_updates for insert to authenticated with check(private.is_admin());
create policy locations_admin_update on public.delivery_location_updates for update to authenticated using(private.is_admin()) with check(private.is_admin());
drop policy escrow_admin_write on public.escrow_records;
create policy escrow_admin_insert on public.escrow_records for insert to authenticated with check(private.is_admin());
create policy escrow_admin_update on public.escrow_records for update to authenticated using(private.is_admin()) with check(private.is_admin());

create policy seller_sale_history_public_read on public.seller_sale_history for select to anon,authenticated using(true);

-- The view joins only two public, price-free relations and remains a security invoker.
create view public.public_seller_history with (security_invoker=true) as
select h.id,h.seller_id,h.listing_id,h.title_snapshot as title,h.condition_snapshot as condition,
       h.completed_at,h.rating,h.review_comment as comment
from public.seller_sale_history h;
grant select on public.public_seller_history to anon,authenticated;

-- Backfill safe evidence for pre-existing completed seed/import rows.
insert into public.seller_sale_history(seller_id,listing_id,title_snapshot,condition_snapshot,completed_at)
select o.seller_id,l.id,l.title,l.condition,o.updated_at
from public.orders o join public.listings l on l.id=o.listing_id where o.status='completed'
on conflict (listing_id) do nothing;
