import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
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
  const [prevCount, setPrevCount] = useState(0);

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const fetchRecords = useCallback(async () => {
    const data = await base44.entities.PaymentRecord.list("-created_date", 500);
    if (prevCount > 0 && data.length > prevCount) {
      const newCount = data.length - prevCount;
      playNotificationSound();
      toast.success(`${newCount} new payment record${newCount > 1 ? "s" : ""} added!`, {
        description: data[0]?.phone_number ? `Latest: ${data[0].phone_number} · ${data[0].type}` : undefined,
        duration: 4000,
      });
    }
    setPrevCount(data.length);
    setRecords(data);
    setLoading(false);
  }, [prevCount]);

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