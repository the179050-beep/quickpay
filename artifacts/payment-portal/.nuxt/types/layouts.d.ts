import type { ComputedRef, MaybeRef } from 'vue'
export type LayoutKey = "default" | "plain"
declare module "../../../../node_modules/.pnpm/nuxt@3.13.2_@parcel+watcher@2.5.6_@types+node@22.19.20_db0@0.3.4_drizzle-orm@0.45.2_@ty_fea47e5da3d9b4279ef47beec577ccec/node_modules/nuxt/dist/pages/runtime/composables" {
  interface PageMeta {
    layout?: MaybeRef<LayoutKey | false> | ComputedRef<LayoutKey | false>
  }
}