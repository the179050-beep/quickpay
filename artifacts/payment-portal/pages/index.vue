<script setup lang="ts">
import { Plus } from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

const TABS = [
  { key: 'bill', label: 'دفع الفاتورة' },
  { key: 'eezee', label: 'إعادة تعبئة eeZee' },
]

const activeTab = ref('eezee')
const additionalNumbers = ref<string[]>([])
const submitted = ref(false)

const isBillTab = computed(() => activeTab.value === 'bill')

const handleAddNumber = () => {
  if (additionalNumbers.value.length < 3) additionalNumbers.value.push('')
}
const handleRemoveNumber = (i: number) => {
  additionalNumbers.value.splice(i, 1)
}
const handleAdditionalChange = (i: number, v: string) => {
  additionalNumbers.value[i] = v
}
const setSubmitted = (v: boolean) => { submitted.value = v }
</script>

<template>
  <div dir="rtl" class="min-h-[80vh] relative font-body">
    <AmbientBackground />

    <div class="relative z-10 py-12 px-4 sm:px-6">
      <div class="max-w-[600px] mx-auto animate-fade-in-up">
        <!-- Page Title -->
        <div class="text-center mb-10">
          <h1 class="text-2xl font-bold text-foreground tracking-tight inline-block relative">
            الدفع السريع
            <div class="absolute -bottom-2 left-1/4 right-1/4 h-0.5 bg-accent rounded-full opacity-50" />
          </h1>
        </div>

        <AnimatedElement :delay="100">
          <div class="bg-card/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40 overflow-hidden mb-6 transition-all duration-300 hover:shadow-[0_12px_50px_rgb(0,0,0,0.08)]">
            <!-- Tabs -->
            <div class="flex border-b border-border/60">
              <button
                v-for="tab in TABS"
                :key="tab.key"
                @click="activeTab = tab.key"
                :class="['flex-1 py-4 text-[15px] font-bold transition-all duration-300 relative', activeTab === tab.key ? 'text-accent bg-accent/5' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50']"
              >
                {{ tab.label }}
                <Transition name="tab-indicator">
                  <div v-if="activeTab === tab.key" class="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                </Transition>
              </button>
            </div>

            <!-- Form Area -->
            <div class="p-8">
              <Transition name="fade-slide" mode="out-in">
                <BillForm
                  v-if="isBillTab"
                  :key="'bill'"
                  :additional-numbers="additionalNumbers"
                  :submitted="submitted"
                  :set-submitted="setSubmitted"
                  :on-remove-number="handleRemoveNumber"
                  :on-additional-change="handleAdditionalChange"
                />
                <EezeeForm v-else :key="'eezee'" />
              </Transition>
            </div>
          </div>
        </AnimatedElement>

        <!-- Add Another Number — bill tab only -->
        <AnimatedElement v-if="isBillTab" :delay="200">
          <button
            type="button"
            @click="handleAddNumber"
            :disabled="additionalNumbers.length >= 3 || submitted"
            class="w-full bg-card/60 backdrop-blur-sm hover:bg-card border border-white/30 text-muted-foreground hover:text-foreground rounded-xl py-3.5 flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-300 mb-8 group disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
          >
            <Plus class="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
            <span>أضف رقم آخر</span>
          </button>
        </AnimatedElement>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tab-indicator-enter-active, .tab-indicator-leave-active { transition: opacity 0.2s ease; }
.tab-indicator-enter-from, .tab-indicator-leave-to { opacity: 0; }
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.25s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-10px); }
</style>
