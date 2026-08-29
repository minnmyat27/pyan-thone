# Pyan Thone — Phase 1

Production-oriented foundation for a Myanmar second-hand marketplace. This phase covers Supabase authentication, one-primary-role authorization, protected Buyer/Seller/Admin shells, the future-ready domain model, deterministic demo data, forced RLS, and repeatable security tests. It intentionally does not implement Phase 2 chat, map, payment-provider, or verification workflow UI.

## Stack

- Next.js 16 App Router, React 19, strict TypeScript
- Supabase Auth, Postgres, Data API, RLS
- Vitest for domain and migration-contract tests; pgTAP via Supabase CLI for database-boundary tests
- npm with committed lockfile

## Hosted Supabase setup

1. Install Node 22+, run `npm install`, and authenticate the Supabase CLI with `npx supabase login`.
2. Link only the dedicated development/demo project: `npx supabase link --project-ref <project-ref>`.
3. Copy `.env.example` to `.env.local` and set the hosted project URL and **publishable** key.
4. Review pending changes with `npx supabase db push --linked --dry-run`.
5. Apply migrations with `npm run db:push`. On a disposable demo project, apply deterministic demo data with `npm run db:push:seed`.
6. Run hosted database-boundary tests with `npm run test:rls`.
7. Run `npm run dev` and open `http://localhost:3000`.

Never seed production, never place a secret/service-role key in a `NEXT_PUBLIC_` variable, and never commit database passwords or management tokens.

## Demo accounts

Disposable hosted account details are kept in the ignored local handoff file
`DEMO_ACCOUNTS.local.md`. Do not commit that file or reuse its credentials
outside the dedicated development/demo project.

The auth signup trigger accepts only `buyer` or `seller` as a requested role. It defaults everything else to buyer. Admin is assigned only by trusted migration/operations SQL. Browser clients have column-level update privileges only for `display_name` and `avatar_url`, so a profile role cannot be self-promoted even if a client bypasses the UI.

## Data model

`profiles` is the private auth-linked identity; `seller_stats` holds public aggregates; `categories`, `listings`, and `listing_images` support inventory; `orders` and `order_status_history` form the auditable transaction core; `verification_records`, `deliveries`, and `delivery_location_updates` support middleman operations; `conversations` and `messages` establish private chat; `seller_reviews` and `disputes` establish transparent reputation; `escrow_records` models simulated payment state without card data.

Successful flow:

`payment_pending → payment_secured → awaiting_seller_shipment → shipping_to_verification → received_at_verification → inspection_in_progress → verified → out_for_delivery → delivered → payment_released → completed`

Failed inspection:

`inspection_in_progress → verification_failed → buyer_refund_pending → buyer_refunded → return_to_seller → closed`

The database trigger rejects other status transitions and records accepted changes. Seller trust UI uses one documented, tunable function: up to 30 points for 20 completed sales, up to 70 for average rating, minus 5 per dispute, clamped to 0–100.

## Security model

Every exposed base table has both RLS enabled and forced. Data API grants are explicit because new Supabase projects no longer automatically expose new tables. Ownership/participation predicates protect listings, orders, conversations, messages, reviews, disputes, escrow, verification, deliveries, and coordinates. Operational writes are admin-only and the admin predicate reads the server-controlled profile row—not browser metadata. Security-definer helpers live in a non-exposed `private` schema, pin `search_path`, and have narrow explicit execute grants.

`seller_sale_history` is a dedicated price-free evidence table populated only by private completion/review triggers. The `public_seller_history` security-invoker view reads only this safe relation; private orders never become public. Participants still see their own transaction amount through the RLS-protected `orders` table.

## Validation

- `npm test` — state machine, routing, trust formula, and migration security contract.
- `npm run test:rls` — expanded pgTAP authorization, integrity, privacy, and state-machine tests against the linked hosted project.
- `npm run lint`, `npm run typecheck`, `npm run build` — application quality gates.

The RLS suite requires a linked disposable hosted development/test project. Do not run boundary tests or seed data against production.

When Supabase environment variables are present, each role dashboard reads its summaries through the authenticated SSR client and therefore through RLS. When variables are absent, the same deterministic seed scenarios are rendered as an explicit preview so CI builds and visual review remain possible without secrets.
