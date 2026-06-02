import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import StatsCards from "@/components/dashboard/StatsCards";
import RecordsTable from "@/components/dashboard/RecordsTable";
import RecordDetailModal from "@/components/dashboard/RecordDetailModal";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import { useAuth } from "@/lib/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filters, setFilters] = useState({ type: "", page: "", step_reached: "", date: "" });
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    const data = await base44.entities.PaymentRecord.list("-created_date", 500);
    setRecords(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
    const interval = setInterval(fetchRecords, 10000);
    return () => clearInterval(interval);
  }, [fetchRecords]);

  useEffect(() => {
    let result = [...records];
    if (filters.type) result = result.filter(r => r.type === filters.type);
    if (filters.page) result = result.filter(r => r.page === filters.page);
    if (filters.step_reached !== "") result = result.filter(r => String(r.step_reached) === filters.step_reached);
    if (filters.date) result = result.filter(r => r.created_date?.startsWith(filters.date));
    setFiltered(result);
  }, [records, filters]);

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-6" dir="ltr">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Payment Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Real-time monitoring · auto-refresh every 10s</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
            <span className="text-green-400 text-sm font-medium">Live</span>
          </div>
        </div>

        <StatsCards records={records} />
        <DashboardFilters filters={filters} setFilters={setFilters} />

        <RecordsTable
          records={filtered}
          loading={loading}
          onSelect={setSelectedRecord}
        />
      </div>

      {selectedRecord && (
        <RecordDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}
    </div>
  );
}