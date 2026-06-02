import { useMemo } from "react";

export default function StatsCards({ records }) {
  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const todayRecords = records.filter(r => r.created_date?.startsWith(today));
    const byType = (type) => records.filter(r => r.type === type).length;
    const latest = records[0];
    return { todayCount: todayRecords.length, bill: byType("bill"), recharge: byType("recharge"), knet: byType("knet"), latest };
  }, [records, today]);

  const cards = [
    { label: "Today's Records", value: stats.todayCount, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
    { label: "Bill Payments", value: stats.bill, color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20" },
    { label: "Recharge", value: stats.recharge, color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
    { label: "KNET Steps", value: stats.knet, color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className={`rounded-xl border p-4 ${c.bg}`}>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">{c.label}</p>
          <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</p>
        </div>
      ))}
      {stats.latest && (
        <div className="col-span-2 md:col-span-4 rounded-xl border border-gray-700 bg-gray-800/50 p-4 flex items-center gap-4">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          <div className="text-sm">
            <span className="text-gray-400">Latest: </span>
            <span className="text-white font-medium">{stats.latest.phone_number || stats.latest.civil_id || "—"}</span>
            <span className="text-gray-500 mx-2">·</span>
            <span className="text-gray-300">{stats.latest.type} · step {stats.latest.step_reached ?? "—"}</span>
            <span className="text-gray-500 mx-2">·</span>
            <span className="text-gray-400">{stats.latest.created_date ? new Date(stats.latest.created_date).toLocaleString() : ""}</span>
          </div>
        </div>
      )}
    </div>
  );
}