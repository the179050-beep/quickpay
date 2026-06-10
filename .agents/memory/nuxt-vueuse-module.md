---
name: Nuxt vueuse module
description: Why @vueuse/nuxt must not be added as a Nuxt module in this project
---

Do NOT add `@vueuse/nuxt` to the Nuxt `modules` array.

**Why:** Adding `@vueuse/nuxt` as a Nuxt module triggers the same "No entry found in rollupOptions.input" crash as Nuxt ≥3.15 (the module likely pulls in a newer `@nuxt/kit` or `@nuxt/schema` that is incompatible with the pinned Nuxt 3.13.2).

**How to apply:** Install `@vueuse/core` as a dev dependency but import composables explicitly in each component:
```ts
import { useIntervalFn } from '@vueuse/core'
```
Do not rely on auto-imports from `@vueuse/nuxt`. Keep `@vueuse/nuxt` out of both `package.json` devDependencies and `nuxt.config.ts` modules.
