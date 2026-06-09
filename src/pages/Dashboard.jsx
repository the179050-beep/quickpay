import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import StatsCards from "@/components/dashboard/StatsCards";
import RecordsTable from "@/components/dashboard/RecordsTable";
import RecordDetailModal from "@/components/dashboard/RecordDetailModal";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import { useAuth } from "@/lib/AuthContext";
import { Bell, RefreshCw, Activity } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filters, setFilters] = useState({ type: "", page: "", step_reached: "", date: "" });
  const [loading, setLoading] = useState(true);
  const [prevCount, setPrevCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    const data = await base44.entities.PaymentRecord.list("-created_date", 1000);
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

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchRecords();
    setIsRefreshing(false);
    toast.success("Data refreshed");
  };

  useEffect(() => {
    fetchRecords();
    const interval = setInterval(fetchRecords, 5000);
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white" dir="rtl">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">غير مصرح</h1>
          <p className="text-slate-400">يتطلب صلاحيات المشرف.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white" dir="rtl">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-500/15 to-teal-500/10 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 h-64 w-64 rounded-full bg-gradient-to-r from-cyan-500/10 to-emerald-500/5 blur-3xl" />
        <div className="absolute -bottom-48 -right-32 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-cyan-500/10 to-emerald-500/5 blur-3xl" />
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-xl shadow-lg shadow-black/20">
        <div className="flex items-center justify-between px-6 py-4 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 blur-lg opacity-40 rounded-xl" />
              <div className="relative bg-gradient-to-br from-emerald-600 to-teal-600 p-2.5 rounded-xl shadow-lg">
                <Bell className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                لوحة المدفوعات
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                مباشر · تحديث كل 5 ثواني
              </p>
            </div>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-emerald-400 transition-colors text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>
      </header>

      <div className="relative z-10 p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
        <StatsCards records={records} />
        <DashboardFilters filters={filters} setFilters={setFilters} filtered={filtered} />
        <RecordsTable records={filtered} loading={loading} onSelect={setSelectedRecord} onDelete={async (id) => {
          await base44.entities.PaymentRecord.delete(id);
          setRecords(prev => prev.filter(r => r.id !== id));
          toast.success("تم الحذف");
        }} />
      </div>

      {selectedRecord && (
        <RecordDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}
    </div>
  );
}