import { useMemo } from "react";
import { Users, CreditCard, Receipt, Zap, TrendingUp } from "lucide-react";

const TrendBars = ({ values }) => {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {values.map((v, i) => (
        <div
          key={i}
          className="w-1.5 rounded-sm bg-white/20 hover:bg-white/40 transition-colors"
          style={{ height: `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  );
};

const CARDS_CONFIG = [
  { key: "todayCount", label: "سجلات اليوم", icon: Users, gradient: "from-blue-600 to-blue-700", glow: "from-blue-500/20 to-blue-500/5" },
  { key: "bill", label: "مدفوعات الفواتير", icon: Receipt, gradient: "from-purple-600 to-purple-700", glow: "from-purple-500/20 to-purple-500/5" },
  { key: "recharge", label: "إعادة الشحن", icon: Zap, gradient: "from-emerald-600 to-emerald-700", glow: "from-emerald-500/20 to-emerald-500/5" },
  { key: "knet", label: "كي-نت", icon: CreditCard, gradient: "from-amber-600 to-amber-700", glow: "from-amber-500/20 to-amber-500/5" },
];

export default function StatsCards({ records }) {
  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const todayRecords = records.filter(r => r.created_date?.startsWith(today));
    const byType = (type) => records.filter(r => r.type === type).length;
    const latest = records[0];
    return {
      todayCount: todayRecords.length,
      bill: byType("bill"),
      recharge: byType("recharge"),
      knet: byType("knet"),
      latest,
      total: records.length,
    };
  }, [records, today]);

  const trend = [3, 5, 4, 8, 6, 10, 7];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CARDS_CONFIG.map(({ key, label, icon: Icon, gradient, glow }) => (
          <div
            key={key}
            className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/70 backdrop-blur-sm shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/30 transition-all duration-300 group p-5"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${glow} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="relative flex items-start justify-between">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <TrendBars values={trend} />
            </div>
            <div className="relative mt-4">
              <p className="text-3xl font-bold text-white">{stats[key]}</p>
              <p className="text-sm text-slate-400 mt-0.5">{label}</p>
            </div>
            <div className="relative flex items-center gap-1 mt-3">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">بيانات مباشرة</span>
            </div>
          </div>
        ))}
      </div>

      {stats.latest && (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm p-4 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          <div className="text-sm min-w-0">
            <span className="text-slate-400">الأخير: </span>
            <span className="text-white font-semibold">{stats.latest.phone_number || stats.latest.civil_id || "—"}</span>
            <span className="text-slate-600 mx-2">·</span>
            <span className="text-slate-300">{stats.latest.type} · خطوة {stats.latest.step_reached ?? "—"}</span>
            <span className="text-slate-600 mx-2">·</span>
            <span className="text-slate-400 text-xs">{stats.latest.created_date ? new Date(stats.latest.created_date).toLocaleString() : ""}</span>
          </div>
          <div className="mr-auto text-xs text-slate-500 flex-shrink-0">{stats.total} إجمالي</div>
        </div>
      )}
    </div>
  );
}