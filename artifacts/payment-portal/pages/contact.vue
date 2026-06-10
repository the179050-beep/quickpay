<script setup lang="ts">
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

const contacts = [
  { icon: Mail, title: 'البريد الإلكتروني', value: 'support@zain.com.kw', sub: 'نرد خلال 24 ساعة عمل', href: 'mailto:support@zain.com.kw' },
  { icon: Phone, title: 'خط الدعم', value: '107', sub: 'متاح على مدار الساعة', href: 'tel:107' },
  { icon: MessageCircle, title: 'الدردشة المباشرة', value: 'تحدث معنا الآن', sub: 'عبر تطبيق My Zain', href: '#' },
  { icon: MapPin, title: 'المقر الرئيسي', value: 'برج زين، الكويت', sub: 'شارع الشهداء، مجمع المرقاب', href: '#' },
]
</script>

<template>
  <div dir="rtl" class="min-h-screen bg-background">
    <div class="max-w-3xl mx-auto px-4 sm:px-8 py-16">
      <h1 class="text-4xl font-bold text-foreground mb-4 leading-tight">تواصل معنا</h1>
      <p class="text-muted-foreground text-lg mb-12">نحن هنا لمساعدتك. لا تتردد في التواصل معنا عبر أي من القنوات التالية.</p>

      <div class="grid sm:grid-cols-2 gap-6 mb-14">
        <a
          v-for="c in contacts"
          :key="c.title"
          :href="c.href"
          class="flex items-start gap-4 bg-card border border-border rounded-xl p-5 shadow-sm hover:border-accent/50 hover:shadow-md transition-all duration-200 group"
        >
          <div class="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
            <component :is="c.icon" class="w-5 h-5 text-accent" />
          </div>
          <div>
            <p class="text-xs font-semibold text-muted-foreground mb-0.5">{{ c.title }}</p>
            <p class="text-base font-bold text-foreground">{{ c.value }}</p>
            <p class="text-xs text-muted-foreground mt-0.5">{{ c.sub }}</p>
          </div>
        </a>
      </div>

      <div class="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h2 class="text-xl font-bold text-foreground mb-5">أرسل لنا رسالة</h2>
        <form class="space-y-4" @submit.prevent>
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-foreground mb-1">الاسم الكامل</label>
              <input type="text" class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:border-accent transition-colors" placeholder="محمد الكويتي" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-foreground mb-1">رقم الهاتف</label>
              <input type="tel" class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:border-accent transition-colors" placeholder="9XXXXXXX" dir="ltr" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-foreground mb-1">البريد الإلكتروني</label>
            <input type="email" class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:border-accent transition-colors" placeholder="example@email.com" dir="ltr" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-foreground mb-1">الرسالة</label>
            <textarea rows="4" class="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:border-accent transition-colors resize-none" placeholder="اكتب رسالتك هنا..." />
          </div>
          <button type="submit" class="w-full sm:w-auto bg-accent text-accent-foreground px-8 py-2.5 rounded-lg font-bold text-sm hover:bg-accent/90 transition-colors">
            إرسال الرسالة
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
