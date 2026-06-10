import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { api } from "@/lib/api";

type Tab = "eezee" | "bill";

const AMOUNTS = [
  { value: 2, label: "2.000 KD", validity: "7 Days" },
  { value: 4, label: "4.000 KD", validity: "15 Days" },
  { value: 6, label: "6.000 KD", validity: "30 Days" },
  { value: 12, label: "12.000 KD", validity: "90 Days" },
  { value: 22, label: "22.000 KD", validity: "180 Days" },
  { value: 30, label: "30.000 KD", validity: "365 Days" },
];

const PAY_FOR_OPTIONS = [
  { value: "self", label: "My Number" },
  { value: "other", label: "Another Number" },
];

function randomBillAmount() {
  const base = Math.floor(Math.random() * 45) + 5;
  const frac = Math.floor(Math.random() * 1000);
  return `${base}.${String(frac).padStart(3, "0")}`;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("eezee");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState(false);
  const [payFor, setPayFor] = useState<"self" | "other">("other");
  const [selectedAmount, setSelectedAmount] = useState(6);
  const [billAmount] = useState(() => randomBillAmount());
  const [loading, setLoading] = useState(false);

  const phoneRef = useRef<TextInput>(null);

  const isPhoneValid = phone.length === 8 && /^9\d{7}$/.test(phone);

  const handlePhoneChange = useCallback((v: string) => {
    const cleaned = v.replace(/\D/g, "").slice(0, 8);
    setPhone(cleaned);
    setPhoneError(!!cleaned && (cleaned.length !== 8 || !/^9\d{7}$/.test(cleaned)));
  }, []);

  const finalAmount = useMemo(() => {
    if (tab === "eezee") return selectedAmount.toFixed(3);
    return billAmount;
  }, [tab, selectedAmount, billAmount]);

  const handleSubmit = useCallback(async () => {
    if (!isPhoneValid || loading) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const record = await api.post<{ id: number }>("/payment-records", {
        pay_type: tab === "eezee" ? "recharge" : "bill",
        pay_for: payFor,
        phone_number: phone,
        amount: finalAmount,
      });
      router.push({
        pathname: "/knet",
        params: {
          amount: finalAmount,
          phone,
          recordId: String(record.id),
        },
      });
    } catch {
      setLoading(false);
    }
  }, [isPhoneValid, loading, tab, payFor, phone, finalAmount]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: "#EBEBEB" }]}>
      {/* Header */}
      <LinearGradient
        colors={["#003f7f", "#0070CD"]}
        style={[styles.header, { paddingTop: topPad + 12 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>زين | ZAIN</Text>
            <Text style={styles.headerSubtitle}>Kuwait Quick Pay</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/dashboard")}
            style={styles.adminBtn}
          >
            <Feather name="settings" size={18} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "eezee" && styles.tabBtnActive]}
            onPress={() => setTab("eezee")}
          >
            <Text style={[styles.tabBtnText, tab === "eezee" && styles.tabBtnTextActive]}>
              eeZee Recharge
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "bill" && styles.tabBtnActive]}
            onPress={() => setTab("bill")}
          >
            <Text style={[styles.tabBtnText, tab === "bill" && styles.tabBtnTextActive]}>
              Bill Payment
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAwareScrollViewCompat
        bottomOffset={40}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
      >
        <View style={styles.body}>
          {/* Form Card */}
          <View style={styles.card}>
            {/* Pay For (eeZee only) */}
            {tab === "eezee" && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Recharge for</Text>
                <View style={styles.segmentRow}>
                  {PAY_FOR_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.segmentBtn,
                        payFor === opt.value && styles.segmentBtnActive,
                      ]}
                      onPress={() => setPayFor(opt.value as "self" | "other")}
                    >
                      <Text
                        style={[
                          styles.segmentBtnText,
                          payFor === opt.value && styles.segmentBtnTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Phone Number */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Mobile Number</Text>
              <View style={[styles.inputWrapper, phoneError && styles.inputWrapperError]}>
                <Text style={styles.inputPrefix}>+965</Text>
                <TextInput
                  ref={phoneRef}
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  placeholder="9XXXXXXX"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={8}
                  returnKeyType="done"
                />
              </View>
              {phoneError && (
                <Text style={styles.errorText}>Must be 8 digits starting with 9</Text>
              )}
            </View>

            {/* Amount (eeZee) */}
            {tab === "eezee" && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Select Amount</Text>
                <View style={styles.amountGrid}>
                  {AMOUNTS.map((amt) => (
                    <TouchableOpacity
                      key={amt.value}
                      style={[
                        styles.amountCard,
                        selectedAmount === amt.value && styles.amountCardSelected,
                      ]}
                      onPress={() => {
                        setSelectedAmount(amt.value);
                        Haptics.selectionAsync();
                      }}
                    >
                      <Text
                        style={[
                          styles.amountValue,
                          selectedAmount === amt.value && styles.amountValueSelected,
                        ]}
                      >
                        {amt.label}
                      </Text>
                      <Text
                        style={[
                          styles.amountValidity,
                          selectedAmount === amt.value && styles.amountValiditySelected,
                        ]}
                      >
                        {amt.validity}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Bill Amount (bill pay) */}
            {tab === "bill" && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Bill Amount</Text>
                <View style={styles.billAmountBox}>
                  <Text style={styles.billAmountValue}>{billAmount}</Text>
                  <Text style={styles.billAmountCurrency}>KD</Text>
                </View>
                <Text style={styles.billNote}>
                  Current outstanding balance for your line
                </Text>
              </View>
            )}
          </View>

          {/* Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount to Pay</Text>
              <Text style={styles.summaryValue}>{finalAmount} KD</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment via</Text>
              <Text style={styles.summaryValue}>KNET</Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, (!isPhoneValid || loading) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!isPhoneValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="credit-card" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>Proceed to Payment</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
            <Text style={styles.footerText}>Secured by KNET • Your data is encrypted</Text>
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 0 },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  adminBtn: {
    padding: 8,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    padding: 3,
    marginBottom: 0,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: "#FFFFFF" },
  tabBtnText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Inter_500Medium",
  },
  tabBtnTextActive: { color: "#0070CD", fontFamily: "Inter_600SemiBold" },
  body: { padding: 16 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  fieldGroup: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#6B7280",
    marginBottom: 8,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    fontFamily: "Inter_600SemiBold",
  },
  segmentRow: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  segmentBtnActive: { backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3, elevation: 1 },
  segmentBtnText: { fontSize: 14, color: "#6B7280", fontFamily: "Inter_500Medium" },
  segmentBtnTextActive: { color: "#0070CD", fontFamily: "Inter_600SemiBold" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#DDE3EA",
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
  },
  inputWrapperError: { borderColor: "#EF4444" },
  inputPrefix: {
    fontSize: 15,
    color: "#374151",
    fontFamily: "Inter_500Medium",
    marginRight: 6,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  phoneInput: {
    flex: 1,
    height: 46,
    fontSize: 16,
    color: "#1A1A2E",
    fontFamily: "Inter_400Regular",
    letterSpacing: 2,
  },
  errorText: { fontSize: 12, color: "#EF4444", marginTop: 4, fontFamily: "Inter_400Regular" },
  amountGrid: {
    flexDirection: "row",
    flexWrap: "wrap" as const,
    gap: 8,
  },
  amountCard: {
    width: "31%",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  amountCardSelected: { borderColor: "#0070CD", backgroundColor: "#E8F4FF" },
  amountValue: { fontSize: 13, fontWeight: "700" as const, color: "#374151", fontFamily: "Inter_700Bold" },
  amountValueSelected: { color: "#0070CD" },
  amountValidity: { fontSize: 10, color: "#9CA3AF", marginTop: 2, fontFamily: "Inter_400Regular" },
  amountValiditySelected: { color: "#0070CD" },
  billAmountBox: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F0F9FF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  billAmountValue: { fontSize: 32, fontWeight: "bold" as const, color: "#0070CD", fontFamily: "Inter_700Bold" },
  billAmountCurrency: { fontSize: 16, color: "#0070CD", fontFamily: "Inter_600SemiBold" },
  billNote: { fontSize: 12, color: "#6B7280", marginTop: 6, fontFamily: "Inter_400Regular" },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  summaryLabel: { fontSize: 14, color: "#6B7280", fontFamily: "Inter_400Regular" },
  summaryValue: { fontSize: 14, fontWeight: "600" as const, color: "#1A1A2E", fontFamily: "Inter_600SemiBold" },
  submitBtn: {
    backgroundColor: "#0070CD",
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0070CD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  submitBtnText: { fontSize: 16, fontWeight: "bold" as const, color: "#FFFFFF", fontFamily: "Inter_700Bold" },
  footer: { alignItems: "center", paddingTop: 16 },
  footerText: { fontSize: 11, color: "#9CA3AF", fontFamily: "Inter_400Regular" },
});
