import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getMyProfile } from "../services/profileService";
import { getMyBalance } from "../services/walletService";
import { signOut } from "../services/authService";
import "../styles/home.css";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMyProfile();
        if (!data) {
          navigate("/login");
          return;
        }
        setProfile(data);

        const bal = await getMyBalance();
        setBalance(bal);
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

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <div className="home-page">
      <Navbar
        userName={profile?.full_name || "User"}
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
            <a href="/profile" onClick={() => setMenuOpen(false)}>
              👤 প্রোফাইল
            </a>
            <button onClick={handleLogout}>🚪 লগআউট</button>
          </aside>
        </>
      )}

      {loading ? (
        <div className="empty-gallery" style={{ margin: "40px 16px" }}>
          <span className="pulse" /> প্রোফাইল লোড হচ্ছে...
        </div>
      ) : (
        <section className="section" style={{ maxWidth: "520px" }}>
          <div className="profile-card">
            <div className="profile-avatar">
              {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <h2 className="profile-name">
              {profile?.full_name || "User"}
            </h2>

            <div className="profile-code-badge">
              <span className="code-label">ইউনিক আইডি</span>
              <span className="code-value">{profile?.user_code}</span>
            </div>

            <div className="profile-info-list">
              <div className="profile-info-row">
                <span className="info-icon">👤</span>
                <div className="info-content">
                  <p className="info-label">নাম</p>
                  <p className="info-value">
                    {profile?.full_name || "—"}
                  </p>
                </div>
              </div>

              <div className="profile-info-row">
                <span className="info-icon">📧</span>
                <div className="info-content">
                  <p className="info-label">ইমেইল</p>
                  <p className="info-value">{profile?.email || "—"}</p>
                </div>
              </div>

              <div className="profile-info-row">
                <span className="info-icon">📱</span>
                <div className="info-content">
                  <p className="info-label">মোবাইল নাম্বার</p>
                  <p className="info-value">{profile?.mobile || "—"}</p>
                </div>
              </div>

              <div className="profile-info-row">
                <span className="info-icon">🏭</span>
                <div className="info-content">
                  <p className="info-label">টেক্সটাইল</p>
                  <p className="info-value">{profile?.company || "—"}</p>
                </div>
              </div>

              <div className="profile-info-row">
                <span className="info-icon">💼</span>
                <div className="info-content">
                  <p className="info-label">পদবী</p>
                  <p className="info-value">
                    {profile?.designation || "—"}
                  </p>
                </div>
              </div>

              <div className="profile-info-row">
                <span className="info-icon">📍</span>
                <div className="info-content">
                  <p className="info-label">বর্তমান ঠিকানা</p>
                  <p className="info-value">
                    {profile?.present_address || "—"}
                  </p>
                </div>
              </div>

              <div className="profile-info-row">
                <span className="info-icon">💰</span>
                <div className="info-content">
                  <p className="info-label">ব্যালেন্স</p>
                  <p className="info-value">৳{balance}</p>
                </div>
              </div>

              <div className="profile-info-row">
                <span className="info-icon">📅</span>
                <div className="info-content">
                  <p className="info-label">যোগদানের তারিখ</p>
                  <p className="info-value">
                    {formatDate(profile?.created_at)}
                  </p>
                </div>
              </div>
            </div>

            <div className="profile-note">
              ℹ️ আপনার প্রোফাইল তথ্য শুধু দেখার জন্য। পরিবর্তন করা যাবে না।
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
