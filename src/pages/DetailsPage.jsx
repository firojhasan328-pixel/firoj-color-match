import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabaseClient";
import { fetchColorById } from "../services/colorStorage";
import { unlockColor } from "../services/walletService";
import { getMyBalance } from "../services/walletService";
import { signOut } from "../services/authService";
import "../styles/home.css";

export default function DetailsPage() {
  const { colorId } = useParams();
  const navigate = useNavigate();

  const [color, setColor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("User");
  const [balance, setBalance] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const [unlocked, setUnlocked] = useState(false);
  const [counting, setCounting] = useState(false);
  const [countNum, setCountNum] = useState(0);
  const [processing, setProcessing] = useState(false);

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

        const bal = await getMyBalance();
        setBalance(bal);

        const row = await fetchColorById(colorId);
        setColor(row);
      } catch (err) {
        console.error(err);
        setError("ছবিটি খুঁজে পাওয়া যায়নি।");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [colorId, navigate]);

  // Countdown Timer
  useEffect(() => {
    if (counting && countNum > 0) {
      const timer = setTimeout(() => {
        setCountNum((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (counting && countNum === 0) {
      finalizeUnlock();
    }
  }, [counting, countNum]);

  function handleUnlock() {
    setCounting(true);
    setCountNum(10);
  }

  async function finalizeUnlock() {
    setProcessing(true);
    try {
      await unlockColor(color.id, color.user_id);
      setUnlocked(true);
      const bal = await getMyBalance();
      setBalance(bal);
    } catch (err) {
      console.error("Unlock error:", err);
      setUnlocked(true);
    } finally {
      setProcessing(false);
      setCounting(false);
    }
  }

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  const isOwn = userId && color && userId === color.user_id;

  return (
    <div className="home-page">
      <Navbar
        userName={userName}
        balance={balance}
        onMenuClick={() => setMenuOpen(true)}
        onBalanceClick={() => navigate("/home")}
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
            <a href="/home" onClick={() => setMenuOpen(false)}>
              ⭐ ফেভারিট
            </a>
            <a href="/profile" onClick={() => setMenuOpen(false)}>
              👤 প্রোফাইল
            </a>
            <button onClick={handleLogout}>🚪 লগআউট</button>
          </aside>
        </>
      )}

      <section className="section" style={{ maxWidth: "520px" }}>
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
        ) : error ? (
          <div className="empty-gallery">{error}</div>
        ) : color ? (
          <div className="details-page-card">
            {/* Image */}
            <div className="details-page-image-wrap">
              <img
                src={color.image_url}
                alt="Color"
                className="details-page-image"
              />
            </div>

            {/* Color Info */}
            <div className="details-page-color-row">
              <div
                className="details-page-color-chip"
                style={{ background: color.color_hex }}
              />
              <div className="details-page-color-info">
                <p className="details-page-hex">{color.color_hex}</p>
                <p className="details-page-rgb">
                  rgb({color.color_r}, {color.color_g}, {color.color_b})
                </p>
              </div>
            </div>

            {/* Owner Info */}
            <div className="details-page-owner">
              <span className="details-owner-text">
                👤 @{color.owner_name} · {color.user_code}
                {isOwn && " (আপনার)"}
              </span>
            </div>

            {/* Details Section */}
            {unlocked ? (
              <div className="details-unlocked">
                <p className="details-unlocked-label">📋 বিস্তারিত</p>
                <p className="details-unlocked-text">
                  {color.details || "কোনো বিস্তারিত নেই"}
                </p>
                {!isOwn && (
                  <div className="earning-note">
                    💰 ছবির মালিক ৳১ পেয়েছেন
                  </div>
                )}
              </div>
            ) : (
              <div className="details-locked">
                <div className="lock-icon">🔒</div>
                <p className="lock-text">বিস্তারিত দেখতে Unlock করুন</p>

                {processing ? (
                  <div className="unlock-status">
                    <span className="pulse" />
                    Unlock হচ্ছে...
                  </div>
                ) : counting ? (
                  <div className="countdown-box">
                    <span className="countdown-num">{countNum}</span>
                    <span className="countdown-label">
                      সেকেন্ড অপেক্ষা করুন...
                    </span>
                  </div>
                ) : (
                  <button
                    className="unlock-btn"
                    onClick={handleUnlock}
                  >
                    🔓 Unlock করুন
                  </button>
                )}
              </div>
            )}
          </div>
        ) : null}
      </section>

      <p className="home-footer">© 2025 Color Match</p>
    </div>
  );
}
