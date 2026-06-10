<script setup lang="ts">
import { ChevronDown, XCircle, Check, Loader2 } from 'lucide-vue-next'

const config = useRuntimeConfig()

const PAY_FOR_OPTIONS = [
  { value: 'other', label: 'رقم آخر' },
  { value: 'self', label: 'رقمي' },
  { value: 'family', label: 'أحد أفراد العائلة' },
]

const AMOUNTS = [
  { value: 2, label: '2.000 د.ك', validity: 'الصلاحية 7 أيام' },
  { value: 4, label: '4.000 د.ك', validity: 'الصلاحية 15 يوم' },
  { value: 6, label: '6.000 د.ك', validity: 'الصلاحية 30 يوم' },
  { value: 12, label: '12.000 د.ك', validity: 'الصلاحية 90 يوم' },
  { value: 22, label: '22.000 د.ك', validity: 'الصلاحية 180 يوم' },
  { value: 30, label: '30.000 د.ك', validity: 'الصلاحية 365 يوم' },
]

const payFor = ref('other')
const payForOpen = ref(false)
const phoneNumber = ref('')
const phoneError = ref(false)
const selectedAmount = ref(6)
const amountOpen = ref(false)
const customAmount = ref('')
const loading = ref(false)
const submitted = ref(false)

const validatePhone = (val: string) => {
  phoneError.value = !!val && (val.length !== 8 || !/^9\d{7}$/.test(val))
}

const selectedAmountObj = computed(() => AMOUNTS.find(a => a.value === selectedAmount.value))
const finalAmount = computed(() => customAmount.value ? parseFloat(customAmount.value) : selectedAmount.value)
const isValid = computed(() => phoneNumber.value.length === 8 && /^9\d{7}$/.test(phoneNumber.value) && !phoneError.value)
const isDisabled = computed(() => loading.value || submitted.value)

const handleRecharge = async () => {
  if (!isValid.value) return
  loading.value = true
  try {
    const record = await $fetch<{ id: number }>(`${config.public.apiBase}/payment-records`, {
      method: 'POST',
      body: {
        pay_type: 'recharge',
        pay_for: payFor.value,
        phone_number: phoneNumber.value,
        amount: String(finalAmount.value),
      }
    })
    const recordId = record?.id || ''
    window.location.href = `/knet?amount=${Number(finalAmount.value).toFixed(3)}&phone=${phoneNumber.value}&recordId=${recordId}`
  } catch {
    loading.value = false
  }
}

const closeDropdowns = (e: MouseEvent) => {
  if (!(e.target as Element).closest('.dropdown-area')) {
    payForOpen.value = false
    amountOpen.value = false
  }
}
onMounted(() => document.addEventListener('click', closeDropdowns))
onUnmounted(() => document.removeEventListener('click', closeDropdowns))
</script>

<template>
  <div class="space-y-8">
    <!-- Pay For Dropdown -->
    <div class="space-y-1 relative group z-20 dropdown-area">
      <label class="block text-xs font-semibold text-muted-foreground/80 mb-1">أود أن أعيد التعبئة لـ</label>
      <button
        @click="payForOpen = !payForOpen"
        type="button"
        :class="['w-full bg-transparent py-2 px-0 text-right flex items-center justify-between focus:outline-none transition-all duration-300 border-b', payForOpen ? 'border-accent text-accent' : 'border-border text-foreground hover:border-foreground/50']"
      >
        <ChevronDown :class="['w-4 h-4 transition-transform duration-300', payForOpen ? 'rotate-180 text-accent' : 'text-muted-foreground']" />
        <span class="font-medium text-[15px]">{{ PAY_FOR_OPTIONS.find(o => o.value === payFor)?.label }}</span>
      </button>
      <Transition name="dropdown">
        <div v-if="payForOpen" class="absolute top-[calc(100%+4px)] right-0 left-0 bg-card border border-border rounded-xl shadow-xl overflow-hidden py-1 z-30">
          <button
            v-for="option in PAY_FOR_OPTIONS"
            :key="option.value"
            @click="payFor = option.value; payForOpen = false"
            :class="['w-full text-right px-4 py-3 text-sm transition-colors duration-200', payFor === option.value ? 'bg-accent/10 text-accent font-bold' : 'text-foreground hover:bg-secondary']"
          >
            {{ option.label }}
          </button>
        </div>
      </Transition>
    </div>

    <!-- Phone Number -->
    <div class="space-y-1 group">
      <label class="block text-xs font-semibold text-muted-foreground/80 mb-1 transition-colors group-focus-within:text-accent">
        رقم الهاتف <span class="text-accent ml-0.5">*</span>
      </label>
      <div class="relative">
        <input
          type="tel"
          v-model="phoneNumber"
          @blur="validatePhone(phoneNumber)"
          @input="phoneError ? validatePhone(phoneNumber) : null"
          placeholder="98752224"
          :class="['w-full bg-transparent py-2.5 px-0 text-right text-[15px] font-medium placeholder-muted-foreground/60 border-b focus:outline-none transition-all duration-300', phoneError ? 'border-destructive' : 'border-border focus:border-accent']"
          dir="ltr"
          style="text-align: right"
          maxlength="8"
        />
        <div class="absolute bottom-0 right-0 h-[2px] w-0 bg-accent transition-all duration-500 ease-out group-focus-within:w-full" />
      </div>
      <Transition name="fade-slide">
        <div v-if="phoneError" class="flex items-center justify-end gap-2 mt-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          <span class="text-destructive text-xs font-medium">الرقم الذي قمت بإدخاله غير صحيح</span>
          <XCircle class="w-4 h-4 text-destructive flex-shrink-0" />
        </div>
      </Transition>
    </div>

    <!-- Amount Selector -->
    <div class="space-y-1 relative z-10 dropdown-area">
      <label class="block text-xs font-semibold text-muted-foreground/80 mb-1">مبلغ التعبئة</label>
      <button
        @click="amountOpen = !amountOpen"
        type="button"
        :class="['w-full bg-transparent py-2 px-0 text-right flex items-center justify-between focus:outline-none transition-all duration-300 border-b', amountOpen ? 'border-accent' : 'border-border']"
      >
        <ChevronDown :class="['w-4 h-4 transition-transform duration-300', amountOpen ? 'rotate-180 text-accent' : 'text-muted-foreground']" />
        <div class="text-right">
          <span :class="['font-bold text-[15px]', amountOpen ? 'text-accent' : 'text-foreground']">{{ selectedAmountObj?.label }}</span>
          <span v-if="selectedAmountObj" :class="['text-xs mr-2', amountOpen ? 'text-accent/70' : 'text-muted-foreground']">{{ selectedAmountObj.validity }}</span>
        </div>
      </button>
      <Transition name="expand">
        <div v-if="amountOpen" class="overflow-hidden border border-border rounded-xl bg-card shadow-lg">
          <button
            v-for="amt in AMOUNTS"
            :key="amt.value"
            @click="selectedAmount = amt.value; amountOpen = false"
            :class="['w-full flex items-center justify-between px-4 py-3 text-sm transition-colors duration-200 hover:bg-secondary/60 border-b border-border/40 last:border-0', selectedAmount === amt.value ? 'bg-secondary/40' : '']"
          >
            <span :class="['text-xs', selectedAmount === amt.value ? 'text-accent font-semibold' : 'text-muted-foreground']">{{ amt.validity }}</span>
            <div class="flex items-center gap-2">
              <Check v-if="selectedAmount === amt.value" class="w-4 h-4 text-accent" />
              <span :class="['font-bold', selectedAmount === amt.value ? 'text-accent' : 'text-foreground']">{{ amt.label }}</span>
            </div>
          </button>
          <div class="px-4 py-3 flex items-center justify-between border-t border-border/40">
            <input
              type="number"
              placeholder="أدخل المبلغ"
              v-model="customAmount"
              class="text-xs text-right bg-transparent focus:outline-none placeholder-muted-foreground/60 w-28 text-foreground"
              dir="rtl"
            />
            <span class="font-bold text-foreground text-sm">مبلغ آخر</span>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Submit -->
    <div class="pt-4">
      <button
        @click="handleRecharge"
        :disabled="!isValid || isDisabled"
        :class="['relative overflow-hidden w-full rounded-xl py-4 flex items-center justify-center gap-3 font-bold text-[15px] transition-all duration-500 shadow-md', isValid && !isDisabled ? 'bg-accent text-accent-foreground hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 hover:-translate-y-0.5' : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60']"
      >
        <span class="relative z-10 flex items-center gap-2">
          <template v-if="loading"><Loader2 class="w-5 h-5 animate-spin" /><span>جاري المعالجة...</span></template>
          <template v-else-if="submitted"><Check class="w-5 h-5" /><span>تم بنجاح</span></template>
          <template v-else>إعادة التعبئة الآن</template>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.2s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-6px); }
.expand-enter-active, .expand-leave-active { transition: opacity 0.2s ease; }
.expand-enter-from, .expand-leave-to { opacity: 0; }
</style>
