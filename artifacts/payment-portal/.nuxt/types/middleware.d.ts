import type { NavigationGuard } from 'vue-router'
export type MiddlewareKey = never
declare module "../../../../node_modules/.pnpm/nuxt@3.13.2_@parcel+watcher@2.5.6_@types+node@22.19.20_db0@0.3.4_drizzle-orm@0.45.2_@ty_fea47e5da3d9b4279ef47beec577ccec/node_modules/nuxt/dist/pages/runtime/composables" {
  interface PageMeta {
    middleware?: MiddlewareKey | NavigationGuard | Array<MiddlewareKey | NavigationGuard>
  }
}
declare module 'nitropack' {
  interface NitroRouteConfig {
    appMiddleware?: MiddlewareKey | MiddlewareKey[] | Record<MiddlewareKey, boolean>
  }
}