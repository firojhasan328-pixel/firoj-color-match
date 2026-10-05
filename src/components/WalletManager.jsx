import React, { useState } from "react";
import {
  WALLET_METHODS,
  saveWallet,
  deleteWallet,
  setDefaultWallet,
} from "../services/walletService";

export default function WalletManager({
  wallets = [],
  onUpdate,
  embedded = false,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formNumber, setFormNumber] = useState("");
  const [formDefault, setFormDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function getMethodInfo(methodId) {
    return (
      WALLET_METHODS.find((m) => m.id === methodId) || {
        id: methodId,
        label: methodId,
        icon: "💳",
        color: "#64748b",
      }
    );
  }

  function handleOpenForm(method) {
    setEditingMethod(method);
    const existing = wallets.find((w) => w.method === method);
    setFormNumber(existing?.number || "");
    setFormDefault(existing?.is_default || false);
    setShowForm(true);
    setError("");
  }

  async function handleSave() {
    setError("");

    if (!formNumber.trim() || formNumber.trim().length !== 11) {
      setError("সঠিক ১১ ডিজিটের নাম্বার দিন।");
      return;
    }

    setSaving(true);
    try {
      await saveWallet({
        method: editingMethod,
        number: formNumber.trim(),
        isDefault: formDefault,
      });
      setShowForm(false);
      if (onUpdate) await onUpdate();
    } catch (err) {
      console.error(err);
      setError("সেভ করা যায়নি: " + (err?.message || "অজানা সমস্যা"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(wallet) {
    if (!confirm(`${getMethodInfo(wallet.method).label} নাম্বার ডিলিট করবেন?`))
      return;

    try {
      await deleteWallet(wallet.id);
      if (onUpdate) await onUpdate();
    } catch (err) {
      console.error(err);
      alert("ডিলিট করা যায়নি: " + err.message);
    }
  }

  async function handleSetDefault(wallet) {
    try {
      await setDefaultWallet(wallet.id);
      if (onUpdate) await onUpdate();
    } catch (err) {
      console.error(err);
      alert("Default সেট করা যায়নি: " + err.message);
    }
  }

  return (
    <div className={embedded ? "" : "wallet-manager-card"}>
      <div className="wallet-manager-header">
        <h3 className="wallet-manager-title">
          💳 ই-ওয়ালেট নাম্বার
        </h3>
        <p className="wallet-manager-sub">
          আপনার bKash/Nagad/Rocket নাম্বার সেভ করে রাখুন
        </p>
      </div>

      {/* Wallet List */}
      <div className="wallet-list">
        {WALLET_METHODS.map((m) => {
          const saved = wallets.find((w) => w.method === m.id);

          return (
            <div
              key={m.id}
              className={`wallet-item ${saved ? "saved" : ""} ${
                saved?.is_default ? "default" : ""
              }`}
            >
              <div
                className="wallet-icon-box"
                style={{ background: `${m.color}15`, color: m.color }}
              >
                {m.icon}
              </div>

              <div className="wallet-info">
                <p className="wallet-method-name">
                  {m.label}
                  {saved?.is_default && (
                    <span className="default-badge">✓ Default</span>
                  )}
                </p>
                <p className="wallet-number">
                  {saved ? saved.number : "নাম্বার যোগ করুন"}
                </p>
              </div>

              <div className="wallet-actions">
                {saved ? (
                  <>
                    {!saved.is_default && (
                      <button
                        className="wallet-action-btn set-default"
                        onClick={() => handleSetDefault(saved)}
                        title="Default সেট করুন"
                      >
                        ⭐
                      </button>
                    )}
                    <button
                      className="wallet-action-btn edit"
                      onClick={() => handleOpenForm(m.id)}
                      title="এডিট করুন"
                    >
                      ✏️
                    </button>
                    <button
                      className="wallet-action-btn delete"
                      onClick={() => handleDelete(saved)}
                      title="ডিলিট করুন"
                    >
                      🗑️
                    </button>
                  </>
                ) : (
                  <button
                    className="wallet-add-btn"
                    onClick={() => handleOpenForm(m.id)}
                  >
                    ➕ যোগ করুন
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div
          className="wallet-modal-overlay"
          onClick={() => setShowForm(false)}
        >
          <div
            className="wallet-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wallet-modal-header">
              <div
                className="wallet-modal-icon"
                style={{
                  background: `${getMethodInfo(editingMethod).color}20`,
                  color: getMethodInfo(editingMethod).color,
                }}
              >
                {getMethodInfo(editingMethod).icon}
              </div>
              <div>
                <h4 className="wallet-modal-title">
                  {getMethodInfo(editingMethod).label} নাম্বার
                </h4>
                <p className="wallet-modal-sub">
                  ১১ ডিজিটের সঠিক নাম্বার দিন
                </p>
              </div>
              <button
                className="wallet-modal-close"
                onClick={() => setShowForm(false)}
              >
                ✕
              </button>
            </div>

            <div className="wallet-modal-body">
              <div className="field">
                <label>নাম্বার</label>
                <input
                  type="tel"
                  value={formNumber}
                  onChange={(e) => {
                    const v = e.target.value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 11);
                    setFormNumber(v);
                    if (error) setError("");
                  }}
                  placeholder="01XXXXXXXXX"
                  inputMode="numeric"
                  maxLength={11}
                  autoFocus
                />
              </div>

              <label className="wallet-checkbox">
                <input
                  type="checkbox"
                  checked={formDefault}
                  onChange={(e) => setFormDefault(e.target.checked)}
                />
                <span>⭐ এই নাম্বারটি Default হিসেবে সেট করুন</span>
              </label>

              {error && <div className="error-box">{error}</div>}
            </div>

            <div className="wallet-modal-footer">
              <button
                className="wallet-btn secondary"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                বাতিল
              </button>
              <button
                className="wallet-btn primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "সেভ হচ্ছে..." : "✅ সেভ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
