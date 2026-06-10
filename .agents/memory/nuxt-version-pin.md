---
name: Nuxt version pin
description: Why Nuxt is pinned to 3.13.2 in this project and what breaks in newer versions
---

Pin `nuxt` to `"3.13.2"` in `artifacts/payment-portal/package.json`.

**Why:** Nuxt ≥3.15 (specifically `@nuxt/vite-builder@3.15+`) has a regression where `ssr: false` SPA mode fails with "No entry found in rollupOptions.input" at `resolveServerEntry` during dev-server startup. The error fires in `configureServer` (a Vite plugin hook) even though `ssr: false` should not need a server entry. This is reproducible with Nuxt 3.21.8 (latest as of June 2026).

**How to apply:** Keep `"nuxt": "3.13.2"` (exact, not a range) in `artifacts/payment-portal/package.json`. Do not bump it without first testing `nuxt dev` in SPA mode.
