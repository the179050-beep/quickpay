import { X, SlidersHorizontal } from "lucide-react";

const TABS = [
  { value: "", label: "All" },
  { value: "bill", label: "Bill" },
  { value: "recharge", label: "Recharge" },
  { value: "knet", label: "KNET" },
];

export default function DashboardFilters({ filters, setFilters, filtered }) {
  const set = (key, val) => setFilters(f => ({ ...f, [key]: val }));
  const hasFilters = filters.type || filters.page || filters.step_reached || filters.date;

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/70 backdrop-blur-sm shadow-xl shadow-black/20 p-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Type Tabs */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1">
            {TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => set("type", tab.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filters.type === tab.value
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={filters.page}
            onChange={e => set("page", e.target.value)}
            className="bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500/50 transition-colors"
          >
            <option value="">All Pages</option>
            <option value="bill">Bill</option>
            <option value="eezee">eeZee</option>
            <option value="knet">KNET</option>
          </select>

          <select
            value={filters.step_reached}
            onChange={e => set("step_reached", e.target.value)}
            className="bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500/50 transition-colors"
          >
            <option value="">All Steps</option>
            {[1, 2, 3, 4].map(s => <option key={s} value={s}>Step {s}</option>)}
          </select>

          <input
            type="date"
            value={filters.date}
            onChange={e => set("date", e.target.value)}
            className="bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />

          {hasFilters && (
            <button
              onClick={() => setFilters({ type: "", page: "", step_reached: "", date: "" })}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Result count */}
        <div className="flex items-center gap-1.5 text-sm text-slate-400 flex-shrink-0">
          <SlidersHorizontal className="h-4 w-4 text-slate-500" />
          <span><span className="text-white font-medium">{filtered?.length ?? 0}</span> records</span>
        </div>
      </div>
    </div>
  );
}