import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabaseClient";
import { getMyProfile } from "../services/profileService";
import { getMyBalance } from "../services/walletService";
import { signOut } from "../services/authService";
import {
  PREMIUM_PLANS,
  PAYMENT_METHODS,
  submitPremiumRequest,
  getMyPremiumRequests,
  getMyPremiumStatus,
  formatPremiumDate,
  getDaysLeft,
} from "../services/premiumService";
import "../styles/home.css";
import "../styles/premium.css";

export default function Premium() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");
  const [userId, setUserId] = useState(null);
  const [userCode, setUserCode] = useState("");
  const [balance, setBalance] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const [premiumStatus, setPremiumStatus] = useState({
    isPremium: false,
    expiresAt: null,
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [selectedPlan, setSelectedPlan] = useState(PREMIUM_PLANS[0]);
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0]);
  const [trxId, setTrxId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!user) {
          navigate("/login");
          return;
        }
        setUserId(user.id);
        setUserName(
          user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "User"
        );

        const profile = await getMyProfile();
        if (profile?.user_code) setUserCode(profile.user_code);

        const bal = await getMyBalance();
        setBalance(bal);

        const status = await getMyPremiumStatus();
        setPremiumStatus(status);

        const reqs = await getMyPremiumRequests();
        setRequests(reqs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!trxId.trim()) {
      setError("Transaction ID দিন।");
      return;
    }
    if (trxId.trim().length < 6) {
      setError("Transaction ID কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return;
    }
    if (!senderNumber.trim() || senderNumber.trim().length !== 11) {
      setError("সঠিক ১১ ডিজিটের সেন্ডার নাম্বার দিন।");
      return;
    }

    setSubmitting(true);
    try {
      await submitPremiumRequest({
        userId,
        userCode,
        ownerName: userName,
        plan: selectedPlan.id,
        amount: selectedPlan.price,
        paymentMethod: selectedMethod.id,
        trxId: trxId.trim(),
        senderNumber: senderNumber.trim(),
      });

      setSuccess(
        "✅ প্রিমিয়াম রিকোয়েস্ট পাঠানো হয়েছে! ২০-৩০ মিনিটের মধ্যে অ্যাডমিন Verify করে Premium চালু করবেন।"
      );
      setTrxId("");
      setSenderNumber("");

      // Refresh requests
      const reqs = await getMyPremiumRequests();
      setRequests(reqs);
    } catch (err) {
      console.error(err);
      setError(
        "রিকোয়েস্ট পাঠানো যায়নি: " + (err?.message || "অজানা সমস্যা")
      );
    } finally {
      setSubmitting(false);
    }
  }

  function getStatusBadge(status) {
    const map = {
      pending: { text: "⏳ Pending", cls: "pending" },
      approved: { text: "✅ Approved", cls: "approved" },
      rejected: { text: "❌ Rejected", cls: "rejected" },
    };
    return map[status] || map.pending;
  }

  function getPlanName(planId) {
    const p = PREMIUM_PLANS.find((x) => x.id === planId);
    return p ? p.name : planId;
  }

  function getMethodName(methodId) {
    const m = PAYMENT_METHODS.find((x) => x.id === methodId);
    return m ? m.label : methodId;
  }

  const daysLeft = getDaysLeft(premiumStatus.expiresAt);

  return (
    <div className="home-page">
      <Navbar
        userName={userName}
        balance={balance}
        onMenuClick={() => setMenuOpen(true)}
        onBalanceClick={() => navigate("/balance")}
      />

      {menuOpen && (
        <>
          <div
            className="side-overlay"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="side-menu">
            <button
              className="side-close"
              onClick={() => setMenuOpen(false)}
              aria-label="বন্ধ করুন"
            >
              ✕
            </button>
            <h3>Color Match</h3>
            <a href="/home" onClick={() => setMenuOpen(false)}>
              🏠 হোম
            </a>
            <a href="/home" onClick={() => setMenuOpen(false)}>
              🎨 কালার ম্যাচিং
            </a>
            <a href="/balance" onClick={() => setMenuOpen(false)}>
              💰 ব্যালেন্স
            </a>
            <a href="/premium" onClick={() => setMenuOpen(false)}>
              💎 প্রিমিয়াম
            </a>
            <a href="/profile" onClick={() => setMenuOpen(false)}>
              👤 প্রোফাইল
            </a>
            <button onClick={handleLogout}>🚪 লগআউট</button>
          </aside>
        </>
      )}

      <section className="section" style={{ maxWidth: "560px" }}>
        <button className="back-btn" onClick={() => navigate("/home")}>
          ← ফিরে যান
        </button>

        {loading ? (
          <div className="empty-gallery">
            <span className="pulse" /> লোড হচ্ছে...
          </div>
        ) : (
          <>
            {/* ===== Active Premium Card ===== */}
            {premiumStatus.isPremium && (
              <div className="premium-active-card">
                <div className="premium-active-badge">👑 PREMIUM</div>
                <h2 className="premium-active-title">
                  আপনি প্রিমিয়াম মেম্বার!
                </h2>
                <p className="premium-active-sub">
                  মেয়াদ শেষ: {formatPremiumDate(premiumStatus.expiresAt)}
                </p>
                <div className="premium-days-left">
                  <span className="days-num">{daysLeft}</span>
                  <span className="days-label">দিন বাকি</span>
                </div>
              </div>
            )}

            {/* ===== Hero ===== */}
            {!premiumStatus.isPremium && (
              <div className="premium-hero">
                <div className="premium-hero-icon">💎</div>
                <h1 className="premium-hero-title">
                  প্রিমিয়াম মেম্বারশিপ
                </h1>
                <p className="premium-hero-sub">
                  অ্যাড দেখার ঝামেলা থেকে মুক্তি পান এবং সব Details আনলক
                  করুন এক ক্লিকে
                </p>
              </div>
            )}

            {/* ===== Plans ===== */}
            <h3 className="section-title" style={{ marginTop: "20px" }}>
              <span className="icon">🎯</span> প্ল্যান নির্বাচন করুন
            </h3>
            <div className="premium-plans-grid">
              {PREMIUM_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`premium-plan-card ${
                    selectedPlan.id === plan.id ? "selected" : ""
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  {plan.badge && (
                    <div className="plan-badge">{plan.badge}</div>
                  )}

                  <div className="plan-header">
                    <h4 className="plan-name">{plan.name}</h4>
                    <p className="plan-duration">{plan.duration}</p>
                  </div>

                  <div className="plan-price">
                    <span className="price-currency">৳</span>
                    <span className="price-amount">{plan.price}</span>
                  </div>

                  {plan.savings && (
                    <div className="plan-savings">💚 {plan.savings}</div>
                  )}

                  <ul className="plan-features">
                    {plan.features.map((f, i) => (
                      <li key={i}>
                        <span className="check-icon">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="plan-check">
                    {selectedPlan.id === plan.id ? "✓ নির্বাচিত" : "নির্বাচন করুন"}
                  </div>
                </div>
              ))}
            </div>

            {/* ===== Payment Info ===== */}
            <h3 className="section-title" style={{ marginTop: "24px" }}>
              <span className="icon">💳</span> পেমেন্ট পদ্ধতি
            </h3>

            <div className="premium-payment-info">
              <p className="payment-info-note">
                নিচের যেকোনো একটি নাম্বারে{" "}
                <strong>৳{selectedPlan.price}</strong> Send Money করুন
              </p>

              <div className="payment-methods-grid">
                {PAYMENT_METHODS.map((m) => (
                  <div
                    key={m.id}
                    className={`payment-method-card ${
                      selectedMethod.id === m.id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedMethod(m)}
                  >
                    <div className="payment-method-icon">{m.icon}</div>
                    <div className="payment-method-info">
                      <p className="payment-method-name">{m.label}</p>
                      <p className="payment-method-number">
                        {m.number}
                      </p>
                    </div>
                    {selectedMethod.id === m.id && (
                      <div className="payment-check">✓</div>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="payment-copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(selectedMethod.number);
                  alert("নাম্বার কপি হয়েছে: " + selectedMethod.number);
                }}
              >
                📋 নাম্বার কপি করুন
              </button>
            </div>

            {/* ===== Submit Form ===== */}
            <h3 className="section-title" style={{ marginTop: "24px" }}>
              <span className="icon">📝</span> পেমেন্ট তথ্য দিন
            </h3>

            <form onSubmit={handleSubmit} className="premium-form">
              <div className="field">
                <label htmlFor="trxId">
                  Transaction ID <span className="required-mark">*</span>
                </label>
                <input
                  id="trxId"
                  type="text"
                  value={trxId}
                  onChange={(e) => {
                    setTrxId(e.target.value.toUpperCase());
                    if (error) setError("");
                  }}
                  placeholder="যেমন: BT78K2XYZ"
                  maxLength={30}
                />
                <p className="field-hint">
                  Send Money করার পর SMS-এ পাওয়া TrxID দিন
                </p>
              </div>

              <div className="field">
                <label htmlFor="senderNumber">
                  সেন্ডার নাম্বার <span className="required-mark">*</span>
                </label>
                <input
                  id="senderNumber"
                  type="tel"
                  value={senderNumber}
                  onChange={(e) => {
                    const v = e.target.value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 11);
                    setSenderNumber(v);
                    if (error) setError("");
                  }}
                  placeholder="যে নাম্বার থেকে পাঠিয়েছেন"
                  inputMode="numeric"
                  maxLength={11}
                />
              </div>

              <div className="premium-summary">
                <div className="summary-row">
                  <span>প্ল্যান:</span>
                  <strong>{selectedPlan.name}</strong>
                </div>
                <div className="summary-row">
                  <span>মূল্য:</span>
                  <strong>৳{selectedPlan.price}</strong>
                </div>
                <div className="summary-row">
                  <span>মেথড:</span>
                  <strong>
                    {selectedMethod.label} ({selectedMethod.number})
                  </strong>
                </div>
              </div>

              {error && <div className="error-box">{error}</div>}
              {success && <div className="success-box">{success}</div>}

              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting
                  ? "পাঠানো হচ্ছে..."
                  : "✅ প্রিমিয়াম রিকোয়েস্ট পাঠান"}
              </button>
            </form>

            {/* ===== Request History ===== */}
            <h3 className="section-title" style={{ marginTop: "24px" }}>
              <span className="icon">📜</span> প্রিমিয়াম হিস্ট্রি
            </h3>

            {requests.length === 0 ? (
              <div className="empty-gallery">
                এখনো কোনো প্রিমিয়াম রিকোয়েস্ট নেই।
              </div>
            ) : (
              <div className="wd-history-list">
                {requests.map((r) => {
                  const badge = getStatusBadge(r.status);
                  return (
                    <div key={r.id} className="wd-history-item">
                      <div className="wd-history-left">
                        <div className="wd-history-method">
                          {getPlanName(r.plan)} প্ল্যান
                        </div>
                        <div className="wd-history-account">
                          {getMethodName(r.payment_method)} · TrxID:{" "}
                          {r.trx_id}
                        </div>
                        <div className="wd-history-date">
                          {formatPremiumDate(r.created_at)}
                        </div>
                      </div>
                      <div className="wd-history-right">
                        <div className="wd-history-amount">৳{r.amount}</div>
                        <div className={`wd-status ${badge.cls}`}>
                          {badge.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}
