import React, { useState } from "react";
import { PAYMENT_METHODS } from "../services/withdrawService";

const MIN_WITHDRAW = 300;

export default function WithdrawModal({
  balance,
  onClose,
  onSubmit,
  submitting,
}) {
  const [amount, setAmount] = useState(MIN_WITHDRAW);
  const [method, setMethod] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [error, setError] = useState("");

  function handleSubmit() {
    setError("");

    if (!amount || amount < MIN_WITHDRAW) {
      setError(`সর্বনিম্ন ৳${MIN_WITHDRAW} Withdraw করা যাবে।`);
      return;
    }
    if (amount > balance) {
      setError("আপনার ব্যালেন্সের চেয়ে বেশি Withdraw করা যাবে না।");
      return;
    }
    if (!method) {
      setError("Payment Method নির্বাচন করুন।");
      return;
    }
    if (!accountNumber || accountNumber.trim().length < 11) {
      setError("সঠিক Account Number দিন (কমপক্ষে ১১ ডিজিট)।");
      return;
    }

    onSubmit({
      amount: parseInt(amount),
      paymentMethod: method,
      accountNumber: accountNumber.trim(),
    });
  }

  return (
    <div className="wd-overlay" onClick={onClose}>
      <div className="wd-card" onClick={(e) => e.stopPropagation()}>
        <div className="wd-header">
          <h3 className="wd-title">💸 Withdraw Request</h3>
          <button className="wd-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="wd-body">
          {/* Balance Info */}
          <div className="wd-balance-info">
            <span className="wd-balance-label">আপনার ব্যালেন্স</span>
            <span className="wd-balance-value">৳{balance}</span>
          </div>

          {/* Amount */}
          <div className="wd-field">
            <label className="wd-label">
              পরিমাণ (৳) <span className="required-mark">*</span>
            </label>
            <input
              type="number"
              className="wd-input"
              value={amount}
              min={MIN_WITHDRAW}
              max={balance}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setAmount(isNaN(val) ? "" : val);
                if (error) setError("");
              }}
              placeholder={`${MIN_WITHDRAW}`}
            />
            <p className="wd-hint">
              সর্বনিম্ন ৳{MIN_WITHDRAW} · সর্বোচ্চ ৳{balance}
            </p>
          </div>

          {/* Payment Method */}
          <div className="wd-field">
            <label className="wd-label">
              Payment Method <span className="required-mark">*</span>
            </label>
            <div className="wd-method-grid">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`wd-method-btn ${
                    method === m.id ? "active" : ""
                  }`}
                  onClick={() => {
                    setMethod(m.id);
                    if (error) setError("");
                  }}
                  style={{
                    borderColor: method === m.id ? m.color : "#e2e8f0",
                  }}
                >
                  <span className="wd-method-icon">{m.icon}</span>
                  <span
                    className="wd-method-label"
                    style={{
                      color: method === m.id ? m.color : "#334155",
                    }}
                  >
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Account Number */}
          <div className="wd-field">
            <label className="wd-label">
              Account Number <span className="required-mark">*</span>
            </label>
            <input
              type="tel"
              className="wd-input"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value.replace(/[^0-9]/g, ""));
                if (error) setError("");
              }}
              placeholder="যেমন: 01918568313"
              maxLength={11}
            />
            <p className="wd-hint">
              যে নাম্বারে টাকা পাঠানো হবে সেটি দিন
            </p>
          </div>

          {error && <div className="error-box">{error}</div>}

          <div className="wd-note">
            ⏱️ Request করার পর ২৪-৪৮ ঘণ্টার মধ্যে Payment পাঠানো হবে।
          </div>
        </div>

        <div className="wd-footer">
          <button
            className="wd-btn secondary"
            onClick={onClose}
            disabled={submitting}
          >
            বাতিল
          </button>
          <button
            className="wd-btn primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "পাঠানো হচ্ছে..." : "✅ Request পাঠান"}
          </button>
        </div>
      </div>
    </div>
  );
}
