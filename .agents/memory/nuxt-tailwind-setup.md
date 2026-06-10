---
name: Nuxt Tailwind setup
description: How Tailwind CSS is configured in the Nuxt 3 portal artifact
---

Use `@nuxtjs/tailwindcss@^6` with `tailwindcss@^3.4` — NOT the Tailwind v4 module.

**Why:** `@tailwindcss/nuxt` (the official Tailwind v4 Nuxt module) is not available in the Replit package registry (returns 404). The workspace catalog has `tailwindcss: ^4.1.14`, but the portal installs `tailwindcss: ^3.4.17` separately (not from catalog) to match `@nuxtjs/tailwindcss@6`.

**How to apply:**
- `package.json`: `"@nuxtjs/tailwindcss": "^6.12.2"` and `"tailwindcss": "^3.4.17"`
- `nuxt.config.ts`: `modules: ["@nuxtjs/tailwindcss"]` with `tailwindcss: { cssPath, configPath }`
- CSS uses v3 syntax (`@tailwind base/components/utilities`, `@layer base`, etc.)
- Theme config lives in `tailwind.config.ts` extending colors from CSS variables
