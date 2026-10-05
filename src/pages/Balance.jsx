import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import WithdrawModal from "../components/WithdrawModal";
import WalletManager from "../components/WalletManager";
import { supabase } from "../lib/supabaseClient";
import { getMyProfile } from "../services/profileService";
import {
  getMyBalance,
  getMyWallets,
  WALLET_METHODS,
} from "../services/walletService";
import { signOut } from "../services/authService";
import {
  getMyWithdrawals,
  calculateWithdrawStats,
} from "../services/withdrawService";
import "../styles/home.css";
import "../styles/wallet.css";

const MIN_WITHDRAW = 300;

export default function Balance() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");
  const [userId, setUserId] = useState(null);
  const [userCode, setUserCode] = useState("");
  const [balance, setBalance] = useState(0);
  const [wallets, setWallets] = useState([]);
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

      const w = await getMyWallets();
      setWallets(w);

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

  async function refreshWallets() {
    const w = await getMyWallets();
    setWallets(w);
  }

  async function handleWithdrawSubmit({
    amount,
    paymentMethod,
    accountNumber,
  }) {
    setSubmitting(true);
    try {
      const { createWithdrawRequest } = await import(
        "../services/withdrawService"
      );
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

  function getMethodInfo(methodId) {
    return (
      WALLET_METHODS.find((m) => m.id === methodId) || {
        label: methodId,
        icon: "💳",
        color: "#64748b",
      }
    );
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
  const progress = Math.min(100, (balance / MIN_WITHDRAW) * 100);

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
            {/* ===== Premium Balance Card ===== */}
            <div className="wallet-hero-card">
              <div className="wallet-hero-glow" />
              <div className="wallet-hero-content">
                <p className="wallet-hero-label">💰 মোট ব্যালেন্স</p>
                <h1 className="wallet-hero-amount">৳{balance}</h1>
                <p className="wallet-hero-sub">
                  {canWithdraw
                    ? "আপনি এখন Withdraw করতে পারবেন"
                    : `আরও ৳${MIN_WITHDRAW - balance} যোগ করলে Withdraw করতে পারবেন`}
                </p>

                {/* Progress Bar */}
                <div className="wallet-progress-wrap">
                  <div
                    className="wallet-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="wallet-progress-labels">
                  <span>৳০</span>
                  <span>৳{MIN_WITHDRAW}</span>
                </div>
              </div>
            </div>

            {/* ===== Stats Grid ===== */}
            <div className="wallet-stats-grid">
              <div className="wallet-stat-card">
                <div className="wallet-stat-icon earned">📈</div>
                <div>
                  <p className="wallet-stat-label">মোট Withdraw</p>
                  <p className="wallet-stat-value">৳{totalWithdrawn}</p>
                </div>
              </div>

              <div className="wallet-stat-card">
                <div className="wallet-stat-icon pending">⏳</div>
                <div>
                  <p className="wallet-stat-label">Pending</p>
                  <p className="wallet-stat-value">৳{pendingAmount}</p>
                </div>
              </div>
            </div>

            {/* ===== Withdraw Button ===== */}
            <button
              className={`wallet-withdraw-btn ${
                canWithdraw ? "" : "disabled"
              }`}
              onClick={() => canWithdraw && setModalOpen(true)}
              disabled={!canWithdraw}
            >
              {canWithdraw ? (
                <>
                  <span className="withdraw-icon">💸</span>
                  Withdraw করুন
                </>
              ) : (
                <>
                  <span className="withdraw-icon">🔒</span>
                  ৳{MIN_WITHDRAW} হলে Withdraw করতে পারবেন
                </>
              )}
            </button>

            {/* ===== E-Wallet Manager ===== */}
            <h3 className="section-title" style={{ marginTop: "24px" }}>
              <span className="icon">💳</span> আমার ই-ওয়ালেট
            </h3>
            <WalletManager
              wallets={wallets}
              onUpdate={refreshWallets}
              embedded
            />

            {/* ===== Withdraw History ===== */}
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
                  const methodInfo = getMethodInfo(w.payment_method);
                  return (
                    <div key={w.id} className="wd-history-item">
                      <div
                        className="wd-method-icon"
                        style={{
                          background: `${methodInfo.color}15`,
                          color: methodInfo.color,
                        }}
                      >
                        {methodInfo.icon}
                      </div>
                      <div className="wd-history-left">
                        <div className="wd-history-method">
                          {methodInfo.label}
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
          savedWallets={wallets}
          onClose={() => setModalOpen(false)}
          onSubmit={handleWithdrawSubmit}
          submitting={submitting}
        />
      )}
    </div>
  );
}
