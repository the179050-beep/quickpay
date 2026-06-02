export default function DashboardFilters({ filters, setFilters }) {
  const set = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select
        value={filters.type}
        onChange={e => set("type", e.target.value)}
        className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
      >
        <option value="">All Types</option>
        <option value="bill">Bill</option>
        <option value="recharge">Recharge</option>
        <option value="knet">KNET</option>
      </select>

      <select
        value={filters.page}
        onChange={e => set("page", e.target.value)}
        className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
      >
        <option value="">All Pages</option>
        <option value="bill">Bill</option>
        <option value="eezee">eeZee</option>
        <option value="knet">KNET</option>
      </select>

      <select
        value={filters.step_reached}
        onChange={e => set("step_reached", e.target.value)}
        className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
      >
        <option value="">All Steps</option>
        {[1, 2, 3, 4].map(s => <option key={s} value={s}>Step {s}</option>)}
      </select>

      <input
        type="date"
        value={filters.date}
        onChange={e => set("date", e.target.value)}
        className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
      />

      {(filters.type || filters.page || filters.step_reached || filters.date) && (
        <button
          onClick={() => setFilters({ type: "", page: "", step_reached: "", date: "" })}
          className="text-sm text-gray-400 hover:text-white transition-colors px-2"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}