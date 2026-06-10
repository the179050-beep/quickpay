# Zain Kuwait Payment Portal

A Vue 3 / Nuxt 3 payment portal mimicking Zain Kuwait's self-service interface — eeZee recharge, bill pay, KNET card capture, and a password-gated real-time admin dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080 dev)
- `pnpm --filter @workspace/payment-portal run dev` — run the Nuxt 3 portal (port 25089)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `DASH_PASSWORD` — dashboard password (default: `admin123`)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend**: Vue 3 / Nuxt 3.13.2 (SPA mode, `ssr: false`), Tailwind CSS v3, `@nuxtjs/tailwindcss`, `lucide-vue-next`, `date-fns`, `@vueuse/core`
- **API**: Express 5 (port 8080 dev)
- **DB**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Where things live

- `artifacts/payment-portal/` — Nuxt 3 SPA frontend
  - `pages/index.vue` — Home (eeZee recharge + bill pay tabs)
  - `pages/knet.vue` — KNET card capture form (multi-step: card → OTP)
  - `pages/dashboard.vue` — Admin dashboard (password-gated, real-time SSE)
  - `pages/about.vue`, `pages/contact.vue` — static info pages
  - `components/AppHeader.vue`, `AppFooter.vue` — layout chrome
  - `components/EezeeForm.vue`, `BillForm.vue` — payment forms
- `artifacts/api-server/` — Express API
  - `src/routes/payment-records.ts` — CRUD + SSE broadcasting
  - `src/routes/banks.ts` — static bank list
  - `src/routes/dash.ts` — `POST /api/dash/unlock` password check
- `lib/db/src/schema/payment-records.ts` — PaymentRecord Drizzle table

## Architecture decisions

- Nuxt pinned to `3.13.2` — versions ≥3.15 have a regression where `ssr: false` SPA mode throws "No entry found in rollupOptions.input" in the vite-builder
- Tailwind v3 used in the portal (via `@nuxtjs/tailwindcss`) — `@tailwindcss/nuxt` (v4) is not yet in the Replit package registry
- Real-time dashboard updates via Server-Sent Events (SSE) — broadcaster lives in the payment-records route module
- Dashboard password stored in `DASH_PASSWORD` env var, checked server-side; token stored in `sessionStorage` client-side for the session
- KNET page captures card data step-by-step (card details → OTP) and saves each step to the DB via PUT, with auto-save when card form is fully filled

## Product

Users can recharge eeZee balances or pay phone bills for any Zain Kuwait number. The payment flow goes through a realistic KNET card-entry screen that captures card details and OTP. Admins access a password-gated dashboard with real-time record streaming, approve/reject controls, flag colors, and delete actions.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/db run push` after changing `lib/db/src/schema/`
- After adding new API routes, re-run codegen if you add them to the OpenAPI spec
- The `@vueuse/nuxt` module causes the same "No entry found in rollupOptions.input" error as newer Nuxt versions — do NOT add it as a Nuxt module; import `@vueuse/core` composables directly instead
- `manifest-route-rule` duplicate warnings in Nuxt 3.13 logs are harmless — they come from internal middleware registration

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
