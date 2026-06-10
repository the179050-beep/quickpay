<script setup lang="ts">
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-vue-next'

const socialIcons = [Facebook, Twitter, Instagram, Youtube]
</script>

<template>
  <footer class="bg-primary text-primary-foreground" dir="rtl">
    <div class="max-w-7xl mx-auto px-4 py-12">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
        <div class="col-span-2 sm:col-span-1">
          <NuxtLink to="/" class="flex items-center mb-4">
            <img
              src="https://media.base44.com/images/public/6a07389b99ad1da7cc77d8a0/96daa83cc_myzain_kw_zain_com_Zain_logo_white70f534fa_6c281017.png"
              alt="Zain"
              class="h-8 w-auto object-contain"
            />
          </NuxtLink>
          <p class="text-primary-foreground/60 text-xs leading-relaxed">
            زين الكويت — شركة رائدة في مجال الاتصالات تقدم أفضل الخدمات والحلول التقنية.
          </p>
          <div class="flex items-center gap-3 mt-4">
            <a
              v-for="(Icon, i) in socialIcons"
              :key="i"
              href="#"
              class="w-7 h-7 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-accent transition-colors duration-200"
            >
              <component :is="Icon" class="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div>
          <h4 class="font-bold text-sm mb-4 text-primary-foreground">خدماتنا</h4>
          <ul class="space-y-2.5">
            <li v-for="item in ['الباقات والعروض', 'الإنترنت المنزلي', 'المكالمات الدولية', 'خدمات البيانات']" :key="item">
              <a href="#" class="text-primary-foreground/60 text-xs hover:text-primary-foreground transition-colors duration-200">{{ item }}</a>
            </li>
          </ul>
        </div>
        <div>
          <h4 class="font-bold text-sm mb-4 text-primary-foreground">My Zain</h4>
          <ul class="space-y-2.5">
            <li v-for="item in ['الدفع السريع', 'إدارة الحساب', 'الفواتير', 'استهلاكي']" :key="item">
              <a href="#" class="text-primary-foreground/60 text-xs hover:text-primary-foreground transition-colors duration-200">{{ item }}</a>
            </li>
          </ul>
        </div>
        <div>
          <h4 class="font-bold text-sm mb-4 text-primary-foreground">الشركة</h4>
          <ul class="space-y-2.5">
            <li><NuxtLink to="/about" class="text-primary-foreground/60 text-xs hover:text-primary-foreground transition-colors duration-200">من نحن</NuxtLink></li>
            <li><NuxtLink to="/contact" class="text-primary-foreground/60 text-xs hover:text-primary-foreground transition-colors duration-200">تواصل معنا</NuxtLink></li>
            <li><a href="#" class="text-primary-foreground/60 text-xs hover:text-primary-foreground transition-colors duration-200">المتاجر</a></li>
            <li><a href="#" class="text-primary-foreground/60 text-xs hover:text-primary-foreground transition-colors duration-200">الشكاوى</a></li>
          </ul>
        </div>
      </div>

      <div class="border-t border-primary-foreground/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <a
            v-for="link in ['سياسة الخصوصية', 'الشروط والأحكام', 'ملفات تعريف الارتباط']"
            :key="link"
            href="#"
            class="text-primary-foreground/50 text-xs hover:text-primary-foreground/80 transition-colors"
          >{{ link }}</a>
        </div>
        <p class="text-primary-foreground/40 text-xs">© 2024 Zain Kuwait. جميع الحقوق محفوظة.</p>
      </div>
    </div>
  </footer>
</template>
