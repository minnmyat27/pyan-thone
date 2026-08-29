begin;
create extension if not exists pgtap;
select no_plan();
create or replace function pg_temp.as_user(uid uuid) returns void language plpgsql as $$ begin perform set_config('role','authenticated',true); perform set_config('request.jwt.claim.sub',uid::text,true); perform set_config('request.jwt.claim.role','authenticated',true); end $$;

-- Profile and role escalation.
select pg_temp.as_user('10000000-0000-0000-0000-000000000001');
select is((select count(*)::int from public.profiles where id=auth.uid()),1,'owner reads profile');
select is((select count(*)::int from public.profiles where id='10000000-0000-0000-0000-000000000002'),0,'other buyer profile is private');
select lives_ok($$update public.profiles set display_name='Thiri Audit',avatar_url='https://example.invalid/a.png' where id=auth.uid()$$,'owner updates allowed fields');
select throws_ok($$update public.profiles set role='admin' where id=auth.uid()$$,'42501',null,'role update denied');
select throws_ok($$insert into public.profiles(id,display_name,role) values('90000000-0000-0000-0000-000000000001','Forged','admin')$$,'42501',null,'forged profile denied');
reset role;
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000000','90000000-0000-0000-0000-000000000002','authenticated','authenticated','metadata-admin@demo.local',crypt('AuditPass123!',gen_salt('bf')),now(),'{}','{"display_name":"Attack","requested_role":"admin","role":"admin"}',now(),now()),
('00000000-0000-0000-0000-000000000000','90000000-0000-0000-0000-000000000003','authenticated','authenticated','metadata-seller@demo.local',crypt('AuditPass123!',gen_salt('bf')),now(),'{}','{"display_name":"Seller","requested_role":"seller"}',now(),now());
select is((select role::text from public.profiles where id='90000000-0000-0000-0000-000000000002'),'buyer','admin metadata normalizes to buyer');
select is((select role::text from public.profiles where id='90000000-0000-0000-0000-000000000003'),'seller','valid seller metadata creates seller');

-- Listings.
set local role anon;
select is((select count(*)::int from public.listings where id='50000000-0000-0000-0000-000000000001'),1,'anon reads active listing');
reset role; select pg_temp.as_user('20000000-0000-0000-0000-000000000001');
select lives_ok($$insert into public.listings(id,seller_id,title,description,condition,current_price,status) values('91000000-0000-0000-0000-000000000001',auth.uid(),'Audit listing','audit','good',100000,'active')$$,'seller creates own listing');
select throws_ok($$insert into public.listings(seller_id,title,description,condition,current_price,status) values('20000000-0000-0000-0000-000000000002','Forged listing','audit','good',100000,'active')$$,'42501',null,'seller cannot create for another seller');
select lives_ok($$update public.listings set description='owner update' where id='91000000-0000-0000-0000-000000000001'$$,'seller updates own listing');
select is_empty($$update public.listings set description='hijack' where id='50000000-0000-0000-0000-000000000002' returning id$$,'seller cannot modify another listing');
reset role; select pg_temp.as_user('10000000-0000-0000-0000-000000000001');
select is_empty($$update public.listings set description='buyer edit' where id='50000000-0000-0000-0000-000000000001' returning id$$,'buyer cannot modify listing');

-- Orders and admin operations.
select pg_temp.as_user('10000000-0000-0000-0000-000000000002');
select lives_ok($$insert into public.orders(id,reference,listing_id,buyer_id,seller_id,agreed_price) values('92000000-0000-0000-0000-000000000001','AUD-ORDER','91000000-0000-0000-0000-000000000001',auth.uid(),'20000000-0000-0000-0000-000000000001',90000)$$,'buyer creates valid order');
select throws_ok($$insert into public.orders(reference,listing_id,buyer_id,seller_id,agreed_price) values('AUD-BAD','91000000-0000-0000-0000-000000000001',auth.uid(),'20000000-0000-0000-0000-000000000002',90000)$$,null,null,'invalid listing seller rejected');
select is((select count(*)::int from public.orders where id='92000000-0000-0000-0000-000000000001'),1,'buyer reads own order');
reset role; select pg_temp.as_user('20000000-0000-0000-0000-000000000001');
select is((select count(*)::int from public.orders where id='92000000-0000-0000-0000-000000000001'),1,'seller reads related order');
reset role; select pg_temp.as_user('10000000-0000-0000-0000-000000000001');
select is((select count(*)::int from public.orders where id='92000000-0000-0000-0000-000000000001'),0,'unrelated buyer cannot read order');
reset role; select pg_temp.as_user('20000000-0000-0000-0000-000000000002');
select is((select count(*)::int from public.orders where id='92000000-0000-0000-0000-000000000001'),0,'unrelated seller cannot read order');
reset role; select pg_temp.as_user('30000000-0000-0000-0000-000000000001');
select lives_ok($$insert into public.categories(id,name,slug) values('93000000-0000-0000-0000-000000000001','Audit','audit')$$,'admin manages category');
select lives_ok($$insert into public.verification_records(order_id,verifier_id,status) values('92000000-0000-0000-0000-000000000001',auth.uid(),'pending')$$,'admin creates verification');
reset role; select pg_temp.as_user('10000000-0000-0000-0000-000000000002');
select throws_ok($$insert into public.categories(name,slug) values('Buyer category','buyer-category')$$,'42501',null,'buyer cannot manage categories');
select throws_ok($$insert into public.verification_records(order_id,status) values('92000000-0000-0000-0000-000000000001','passed')$$,'42501',null,'buyer cannot verify');

-- Chat.
select is((select count(*)::int from public.conversations where id='80000000-0000-0000-0000-000000000001'),1,'participant reads conversation');
select is((select count(*)::int from public.messages where conversation_id='80000000-0000-0000-0000-000000000001'),2,'participant reads messages');
reset role; select pg_temp.as_user('10000000-0000-0000-0000-000000000001');
select is((select count(*)::int from public.conversations where id='80000000-0000-0000-0000-000000000001'),0,'unrelated user cannot read chat');
select throws_ok($$insert into public.messages(conversation_id,sender_id,body) values('80000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','spoof')$$,'42501',null,'sender spoof denied');
select throws_ok($$insert into public.messages(conversation_id,sender_id,body) values('80000000-0000-0000-0000-000000000001',auth.uid(),'intrusion')$$,'42501',null,'unrelated sender denied');
select throws_ok($$insert into public.conversations(listing_id,buyer_id,seller_id) values('50000000-0000-0000-0000-000000000001',auth.uid(),'20000000-0000-0000-0000-000000000002')$$,null,null,'invalid conversation seller rejected');

-- Delivery and escrow.
reset role; select pg_temp.as_user('10000000-0000-0000-0000-000000000002');
select is((select count(*)::int from public.deliveries where id='70000000-0000-0000-0000-000000000001'),1,'related buyer reads delivery');
select is((select count(*)::int from public.escrow_records where order_id='60000000-0000-0000-0000-000000000002'),1,'related buyer reads escrow');
reset role; select pg_temp.as_user('10000000-0000-0000-0000-000000000001');
select is((select count(*)::int from public.delivery_location_updates),0,'unrelated user cannot read GPS');
select is((select count(*)::int from public.escrow_records where order_id='60000000-0000-0000-0000-000000000002'),0,'unrelated user cannot read escrow');
select throws_ok($$insert into public.delivery_location_updates(delivery_id,latitude,longitude) values('70000000-0000-0000-0000-000000000001',16.8,96.1)$$,'42501',null,'client cannot forge coordinate');
select is_empty($$update public.escrow_records set status='seller_paid' where order_id='60000000-0000-0000-0000-000000000003' returning id$$,'client cannot update escrow');
reset role; select pg_temp.as_user('30000000-0000-0000-0000-000000000001');
select lives_ok($$insert into public.delivery_location_updates(delivery_id,latitude,longitude) values('70000000-0000-0000-0000-000000000001',16.82,96.18)$$,'admin adds coordinate');
select lives_ok($$update public.escrow_records set status='payout_pending' where order_id='60000000-0000-0000-0000-000000000003'$$,'admin updates escrow');

-- Public price-free seller history.
reset role; set local role anon;
select is((select count(*)::int from public.public_seller_history where seller_id='20000000-0000-0000-0000-000000000001'),1,'anon reads safe sale evidence');
select ok(not exists(select 1 from information_schema.columns where table_schema='public' and table_name in('seller_sale_history','public_seller_history') and column_name in('agreed_price','current_price','price','buyer_id','order_id','amount','destination_address','latitude','longitude','dispute_id')),'history exposes no private columns');
select throws_ok($$select agreed_price from public.public_seller_history$$,'42703',null,'agreed price cannot be selected');
select throws_ok($$select count(*) from public.orders$$,'42501',null,'anon cannot query orders');
select throws_ok($$insert into public.seller_sale_history(seller_id,listing_id,title_snapshot,condition_snapshot,completed_at) values('20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','forged','good',now())$$,'42501',null,'anon cannot forge evidence');
reset role; select pg_temp.as_user('10000000-0000-0000-0000-000000000001');
select throws_ok($$insert into public.seller_sale_history(seller_id,listing_id,title_snapshot,condition_snapshot,completed_at) values('20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','forged','good',now())$$,'42501',null,'user cannot forge evidence');

-- Reviews and disputes.
reset role;
insert into public.listings(id,seller_id,title,description,condition,current_price,status) values
('94000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','Review complete','audit','good',100000,'sold'),
('94000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','Review early','audit','good',100000,'reserved'),
('94000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002','Review rating','audit','good',100000,'sold');
insert into public.orders(id,reference,listing_id,buyer_id,seller_id,agreed_price,status) values
('94100000-0000-0000-0000-000000000001','AUD-REVIEW-OK','94000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002',90000,'completed'),
('94100000-0000-0000-0000-000000000002','AUD-REVIEW-EARLY','94000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001',90000,'payment_pending'),
('94100000-0000-0000-0000-000000000003','AUD-REVIEW-RATING','94000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002',90000,'completed');
select pg_temp.as_user('10000000-0000-0000-0000-000000000001');
select lives_ok($$insert into public.seller_reviews(order_id,buyer_id,seller_id,rating) values('94100000-0000-0000-0000-000000000001',auth.uid(),'20000000-0000-0000-0000-000000000002',5)$$,'eligible review succeeds');
select throws_ok($$insert into public.seller_reviews(order_id,buyer_id,seller_id,rating) values('94100000-0000-0000-0000-000000000001',auth.uid(),'20000000-0000-0000-0000-000000000002',4)$$,'23505',null,'duplicate review denied');
select throws_ok($$insert into public.seller_reviews(order_id,buyer_id,seller_id,rating) values('94100000-0000-0000-0000-000000000003',auth.uid(),'20000000-0000-0000-0000-000000000002',6)$$,'23514',null,'rating range enforced');
reset role; select pg_temp.as_user('10000000-0000-0000-0000-000000000002');
select throws_ok($$insert into public.seller_reviews(order_id,buyer_id,seller_id,rating) values('94100000-0000-0000-0000-000000000001',auth.uid(),'20000000-0000-0000-0000-000000000002',5)$$,'23514',null,'unrelated review denied');
select throws_ok($$insert into public.seller_reviews(order_id,buyer_id,seller_id,rating) values('94100000-0000-0000-0000-000000000002',auth.uid(),'20000000-0000-0000-0000-000000000001',5)$$,'23514',null,'premature review denied');
reset role; select pg_temp.as_user('20000000-0000-0000-0000-000000000002');
select throws_ok($$insert into public.seller_reviews(order_id,buyer_id,seller_id,rating) values('94100000-0000-0000-0000-000000000003',auth.uid(),auth.uid(),5)$$,null,null,'self review denied');
reset role; select pg_temp.as_user('10000000-0000-0000-0000-000000000002');
select lives_ok($$insert into public.disputes(id,order_id,opened_by,reason,description) values('95000000-0000-0000-0000-000000000001','92000000-0000-0000-0000-000000000001',auth.uid(),'Audit','participant dispute')$$,'participant opens dispute');
select is_empty($$update public.disputes set status='resolved_buyer' where id='95000000-0000-0000-0000-000000000001' returning id$$,'participant cannot resolve dispute');
reset role; select pg_temp.as_user('30000000-0000-0000-0000-000000000001');
select lives_ok($$update public.disputes set status='resolved_buyer',resolved_by=auth.uid(),resolved_at=now() where id='95000000-0000-0000-0000-000000000001'$$,'admin resolves dispute');

-- State machine, invalid paths, history, and evidence trigger.
reset role;
insert into public.listings(id,seller_id,title,description,condition,current_price,status) values
('96000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Success path','audit','good',100000,'reserved'),
('96000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','Failure path','audit','fair',100000,'reserved'),
('96000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','Invalid path','audit','good',100000,'reserved');
insert into public.orders(id,reference,listing_id,buyer_id,seller_id,agreed_price,status) values
('96100000-0000-0000-0000-000000000001','AUD-SUCCESS','96000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',90000,'payment_pending'),
('96100000-0000-0000-0000-000000000002','AUD-FAILURE','96000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',90000,'received_at_verification'),
('96100000-0000-0000-0000-000000000003','AUD-INVALID','96000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',90000,'payment_pending');
select pg_temp.as_user('30000000-0000-0000-0000-000000000001');
select lives_ok($$update public.orders set status='payment_secured' where id='96100000-0000-0000-0000-000000000001'; update public.orders set status='awaiting_seller_shipment' where id='96100000-0000-0000-0000-000000000001'; update public.orders set status='shipping_to_verification' where id='96100000-0000-0000-0000-000000000001'; update public.orders set status='received_at_verification' where id='96100000-0000-0000-0000-000000000001'; update public.orders set status='inspection_in_progress' where id='96100000-0000-0000-0000-000000000001'; update public.orders set status='verified' where id='96100000-0000-0000-0000-000000000001'; update public.orders set status='out_for_delivery' where id='96100000-0000-0000-0000-000000000001'; update public.orders set status='delivered' where id='96100000-0000-0000-0000-000000000001'; update public.orders set status='payment_released' where id='96100000-0000-0000-0000-000000000001'; update public.orders set status='completed' where id='96100000-0000-0000-0000-000000000001'$$,'success path accepted');
select is((select count(*)::int from public.order_status_history where order_id='96100000-0000-0000-0000-000000000001'),10,'success history has ten rows');
select lives_ok($$update public.orders set status='inspection_in_progress' where id='96100000-0000-0000-0000-000000000002'; update public.orders set status='verification_failed' where id='96100000-0000-0000-0000-000000000002'; update public.orders set status='buyer_refund_pending' where id='96100000-0000-0000-0000-000000000002'; update public.orders set status='buyer_refunded' where id='96100000-0000-0000-0000-000000000002'; update public.orders set status='return_to_seller' where id='96100000-0000-0000-0000-000000000002'; update public.orders set status='closed' where id='96100000-0000-0000-0000-000000000002'$$,'failure path accepted');
select is((select count(*)::int from public.order_status_history where order_id='96100000-0000-0000-0000-000000000002'),6,'failure history has six rows');
select throws_ok($$update public.orders set status='delivered' where id='96100000-0000-0000-0000-000000000003'$$,'23514',null,'pending to delivered denied');
select throws_ok($$update public.orders set status='payment_pending' where id='96100000-0000-0000-0000-000000000001'$$,'23514',null,'completed rollback denied');
select throws_ok($$update public.orders set status='inspection_in_progress' where id='96100000-0000-0000-0000-000000000001'$$,'23514',null,'completed to inspection denied');
select throws_ok($$update public.orders set status='out_for_delivery' where id='96100000-0000-0000-0000-000000000002'$$,'23514',null,'closed to delivery denied');
select is((select count(*)::int from public.seller_sale_history where listing_id='96000000-0000-0000-0000-000000000001'),1,'completion creates safe evidence');

select * from finish();
rollback;
