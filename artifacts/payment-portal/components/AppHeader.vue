<script setup lang="ts">
import { Menu, Search, ChevronDown, Headset, ShoppingCart, SlidersHorizontal, Heart, X } from 'lucide-vue-next'

const route = useRoute()
const scrolled = ref(false)
const mobileOpen = ref(false)

onMounted(() => {
  const handleScroll = () => { scrolled.value = window.scrollY > 20 }
  window.addEventListener('scroll', handleScroll)
  onUnmounted(() => window.removeEventListener('scroll', handleScroll))
})
</script>

<template>
  <header class="sticky top-0 z-50 flex flex-col w-full" dir="rtl">
    <!-- Top Utility Bar -->
    <div class="bg-background border-b border-border transition-colors duration-300">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-10 flex items-center justify-between">
        <div class="flex items-center h-full">
          <div class="flex items-center h-full border-l border-border pl-4 ml-4">
            <div class="h-full bg-accent text-accent-foreground flex items-center px-6 font-bold text-sm">
              شخصي
            </div>
            <a href="#" class="h-full flex items-center px-6 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              الأعمال
            </a>
          </div>
          <div class="hidden sm:flex items-center gap-6">
            <a href="#" class="text-xs font-medium text-foreground hover:text-accent transition-colors">تحديث البطاقة المدنية</a>
            <NuxtLink to="/" class="text-xs font-medium text-foreground hover:text-accent transition-colors">الدفع السريع</NuxtLink>
          </div>
        </div>
        <div class="flex items-center gap-4 h-full">
          <button class="flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-accent transition-colors">
            <ChevronDown class="w-3.5 h-3.5" />
            <span>الكويت</span>
          </button>
          <div class="w-px h-4 bg-border" />
          <button class="text-xs font-medium text-foreground hover:text-accent transition-colors">EN</button>
        </div>
      </div>
    </div>

    <!-- Main Navigation -->
    <nav :class="['bg-primary transition-all duration-300', scrolled ? 'shadow-xl shadow-primary/20' : '']">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="flex items-center justify-between h-[72px]">
          <div class="flex items-center shrink-0">
            <NuxtLink to="/" class="flex items-center gap-2 group">
              <img
                src="https://media.base44.com/images/public/6a07389b99ad1da7cc77d8a0/96daa83cc_myzain_kw_zain_com_Zain_logo_white70f534fa_6c281017.png"
                alt="Zain"
                class="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </NuxtLink>
          </div>

          <div class="hidden sm:flex items-center justify-center flex-1 mx-8">
            <div class="flex items-center h-[72px]">
              <a href="#" class="h-full px-6 flex items-center gap-2 text-primary-foreground/90 hover:text-primary-foreground transition-colors">
                <ShoppingCart class="w-4 h-4" />
                <span class="font-medium text-[15px]">تسوق</span>
              </a>
              <NuxtLink
                to="/"
                class="h-full px-6 flex items-center gap-2 transition-colors relative group text-primary-foreground/90 hover:text-primary-foreground"
              >
                <SlidersHorizontal class="w-4 h-4" />
                <span class="font-medium text-[15px]">My Zain</span>
              </NuxtLink>
              <a href="#" class="h-full px-6 flex items-center gap-2 text-primary-foreground/90 hover:text-primary-foreground transition-colors">
                <Headset class="w-4 h-4" />
                <span class="font-medium text-[15px]">الدعم</span>
              </a>
            </div>
          </div>

          <div class="hidden sm:flex items-center gap-3">
            <button class="w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground hover:bg-white/10 transition-colors">
              <Search class="w-5 h-5" />
            </button>
            <div class="w-px h-5 bg-white/20 mx-1" />
            <button class="w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground hover:bg-white/10 transition-colors">
              <Heart class="w-5 h-5" />
            </button>
            <button class="w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground hover:bg-white/10 transition-colors relative">
              <ShoppingCart class="w-5 h-5" />
              <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
            </button>
          </div>

          <!-- Mobile menu button -->
          <button
            class="sm:hidden w-10 h-10 flex items-center justify-center text-primary-foreground hover:bg-white/10 rounded-lg"
            @click="mobileOpen = !mobileOpen"
          >
            <component :is="mobileOpen ? X : Menu" class="h-6 w-6" />
          </button>
        </div>
      </div>

      <!-- Mobile menu -->
      <Transition name="slide-down">
        <div v-if="mobileOpen" class="sm:hidden bg-primary border-t border-white/10" dir="rtl">
          <div class="flex flex-col py-4">
            <a href="#" class="flex items-center gap-3 px-6 py-4 text-primary-foreground/90 hover:text-primary-foreground hover:bg-white/5 transition-colors font-medium">
              <ShoppingCart class="w-5 h-5" /> تسوق
            </a>
            <NuxtLink to="/" @click="mobileOpen = false" class="flex items-center gap-3 px-6 py-4 text-primary-foreground hover:bg-white/5 transition-colors font-medium">
              <SlidersHorizontal class="w-5 h-5 text-accent" /> My Zain
            </NuxtLink>
            <a href="#" class="flex items-center gap-3 px-6 py-4 text-primary-foreground/90 hover:text-primary-foreground hover:bg-white/5 transition-colors font-medium">
              <Headset class="w-5 h-5" /> الدعم
            </a>
            <div class="mt-2 bg-black/20 px-6 py-4 flex flex-col gap-3">
              <NuxtLink to="/" @click="mobileOpen = false" class="text-primary-foreground text-sm font-medium hover:text-accent transition-colors">الدفع السريع</NuxtLink>
              <a href="#" class="text-primary-foreground text-sm font-medium hover:text-accent transition-colors">تحديث البطاقة المدنية</a>
            </div>
          </div>
        </div>
      </Transition>
    </nav>
  </header>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
