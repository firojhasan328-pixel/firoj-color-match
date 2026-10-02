import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import WithdrawModal from "../components/WithdrawModal";
import { supabase } from "../lib/supabaseClient";
import { getMyProfile } from "../services/profileService";
import { getMyBalance } from "../services/walletService";
import { signOut } from "../services/authService";
import {
  getMyWithdrawals,
  createWithdrawRequest,
  calculateWithdrawStats,
  PAYMENT_METHODS,
} from "../services/withdrawService";
import "../styles/home.css";

const MIN_WITHDRAW = 300;

export default function Balance() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");
  const [userId, setUserId] = useState(null);
  const [userCode, setUserCode] = useState("");
  const [balance, setBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
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

      const wd = await getMyWithdrawals();
      setWithdrawals(wd);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [navigate]);

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  async function handleWithdrawSubmit({
    amount,
    paymentMethod,
    accountNumber,
  }) {
    setSubmitting(true);
    try {
      await createWithdrawRequest({
        userId,
        userCode,
        ownerName: userName,
        amount,
        paymentMethod,
        accountNumber,
      });
      setModalOpen(false);
      await loadData();
      alert(
        "✅ Withdraw Request পাঠানো হয়েছে! ২৪-৪৮ ঘণ্টার মধ্যে Payment পাবেন।"
      );
    } catch (err) {
      console.error(err);
      alert("❌ Request পাঠানো যায়নি: " + (err?.message || "অজানা সমস্যা"));
    } finally {
      setSubmitting(false);
    }
  }

  const { totalWithdrawn, pendingAmount } = calculateWithdrawStats(withdrawals);

  function getMethodLabel(id) {
    const m = PAYMENT_METHODS.find((x) => x.id === id);
    return m ? m.label : id;
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getStatusBadge(status) {
    const map = {
      pending: { text: "⏳ Pending", cls: "pending" },
      approved: { text: "✅ Approved", cls: "approved" },
      rejected: { text: "❌ Rejected", cls: "rejected" },
    };
    return map[status] || map.pending;
  }

  const canWithdraw = balance >= MIN_WITHDRAW;

  return (
    <div className="home-page">
      <Navbar
        userName={userName}
        balance={balance}
        onMenuClick={() => setMenuOpen(true)}
        onBalanceClick={() => {}}
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
            <a href="/profile" onClick={() => setMenuOpen(false)}>
              👤 প্রোফাইল
            </a>
            <button onClick={handleLogout}>🚪 লগআউট</button>
          </aside>
        </>
      )}

      <section className="section" style={{ maxWidth: "560px" }}>
        <button
          className="back-btn"
          onClick={() => navigate("/home")}
        >
          ← ফিরে যান
        </button>

        {loading ? (
          <div className="empty-gallery">
            <span className="pulse" /> লোড হচ্ছে...
          </div>
        ) : (
          <>
            {/* Main Balance Card */}
            <div className="balance-main-card">
              <p className="balance-main-label">মোট ব্যালেন্স</p>
              <h1 className="balance-main-amount">৳{balance}</h1>

              <div className="balance-stats-row">
                <div className="balance-stat">
                  <p className="balance-stat-label">মোট Withdraw</p>
                  <p className="balance-stat-value">
                    ৳{totalWithdrawn}
                  </p>
                </div>
                <div className="balance-stat">
                  <p className="balance-stat-label">Pending</p>
                  <p className="balance-stat-value">৳{pendingAmount}</p>
                </div>
              </div>

              <button
                className={`withdraw-btn ${
                  canWithdraw ? "" : "disabled"
                }`}
                onClick={() => canWithdraw && setModalOpen(true)}
                disabled={!canWithdraw}
              >
                {canWithdraw
                  ? "💸 Withdraw করুন"
                  : `💸 ৳${MIN_WITHDRAW} হলে Withdraw করতে পারবেন`}
              </button>
            </div>

            {/* Withdraw History */}
            <h3 className="section-title" style={{ marginTop: "24px" }}>
              <span className="icon">📜</span> Withdraw History
            </h3>

            {withdrawals.length === 0 ? (
              <div className="empty-gallery">
                এখনো কোনো Withdraw Request নেই।
              </div>
            ) : (
              <div className="wd-history-list">
                {withdrawals.map((w) => {
                  const badge = getStatusBadge(w.status);
                  return (
                    <div key={w.id} className="wd-history-item">
                      <div className="wd-history-left">
                        <div className="wd-history-method">
                          {getMethodLabel(w.payment_method)}
                        </div>
                        <div className="wd-history-account">
                          {w.account_number}
                        </div>
                        <div className="wd-history-date">
                          {formatDate(w.created_at)}
                        </div>
                      </div>
                      <div className="wd-history-right">
                        <div className="wd-history-amount">
                          ৳{w.amount}
                        </div>
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

      {modalOpen && (
        <WithdrawModal
          balance={balance}
          onClose={() => setModalOpen(false)}
          onSubmit={handleWithdrawSubmit}
          submitting={submitting}
        />
      )}
    </div>
  );
}
