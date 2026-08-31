# Pyan Thone

Pyan Thone is a local second-hand marketplace where the platform acts as a trusted middleman. Buyers can inspect seller evidence, negotiate through realtime chat, purchase a single-quantity listing, follow platform verification and delivery, and review a completed transaction. Sellers manage listings and shipments, while operations staff control verification, simulated refunds, delivery progression, and payout completion.

Production: <https://pyan-thone.vercel.app>

## Core experience

- Real Supabase-backed marketplace with search, filtering, listing images, and seller trust summaries
- Buyer/seller realtime chat with listing context and manual public-price negotiation
- Atomic single-item purchase reservation and simulated held-payment lifecycle
- Admin-controlled success and failed-verification transaction branches
- Deterministic, realtime delivery waypoint simulation
- Public, price-free seller completion history with ratings and dispute signals
- Participant-only orders, chat, disputes, delivery data, and private buyer-address vault
- Responsive Buyer, Seller, Admin, authentication, and public interfaces

## Technology

- Next.js 16 App Router, React 19, and strict TypeScript
- Supabase Auth, Postgres, Row Level Security, Realtime, and Storage
- Server Actions and explicit security-definer business RPCs
- Vitest application tests and hosted pgTAP database-boundary tests
- Vercel production deployment

The Phase 3 interface uses the visual language and supplied logo from the teammate design repository while preserving this repository as the functional source of truth. The older reference stack, static export, GitHub Pages base path, mock offer system, localStorage checkout, and mock admin actions were intentionally not copied.

## Local setup

Requirements: Node.js 22+ and npm.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Configure these public browser-safe variables in `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Never use a Supabase secret or `service_role` key in a `NEXT_PUBLIC_` variable. Local demo credentials are kept in the ignored `DEMO_ACCOUNTS.local.md` file and must not be published.

## Supabase workflow

The checked-in migrations are the database source of truth. Link only the dedicated hosted demo project before pushing or testing migrations.

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npm run db:push
npm run test:rls
```

The database enforces listing ownership, atomic reservation, transaction state transitions, participant-only chat, admin operations, storage namespaces, review eligibility, delivery privacy, escrow permissions, and price-free public seller history. Frontend role checks are convenience controls, not the authorization boundary.

## Validation

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=high
```

`npm run test:rls` runs the hosted pgTAP authorization and privacy suite after the project is linked. Do not run seed or destructive database commands against an unrelated production project.

## Demo architecture

Successful flow:

`payment secured → seller shipment → verification → delivery → delivered → seller paid → completed`

Failed inspection:

`verification failed → refund pending → refunded → return to seller → closed`

Payments, courier assignment, refunds, and GPS movement are hackathon simulations. No real banking network, payment processor, or courier integration is used. The delivery map is an accessible CSS-based visualization backed by real hosted waypoint rows and Realtime updates.

## Deployment

The authoritative GitHub repository is `minnmyat27/pyan-thone`. Pushes to `main` deploy through the existing Vercel project. Do not introduce the teammate repository’s static-export or GitHub Pages configuration. Custom-domain setup must use the actual provided domain and should preserve the `pyan-thone.vercel.app` alias.
