import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import UploadBox from "../components/UploadBox";
import ScannerBox from "../components/ScannerBox";
import Gallery from "../components/Gallery";
import ResultModal from "../components/ResultModal";
import { supabase } from "../lib/supabaseClient";
import { signOut } from "../services/authService";
import "../styles/home.css";

export default function Home() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");
  const [balance, setBalance] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) {
        navigate("/login");
        return;
      }
      const name =
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "User";
      setUserName(name);
    }
    loadUser();
  }, [navigate]);

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  function handleLocalUpload(file) {
    console.log("Local file selected:", file?.name);
  }

  function handleScanResult(result) {
    setScanResult(result);
  }

  function handleAddNew() {
    // Phase 3-এ এখানে Details Form খুলবে
    alert("পরের ধাপে Details ফর্ম যুক্ত হবে।");
    setScanResult(null);
  }

  return (
    <div className="home-page">
      <Navbar
        userName={userName}
        balance={balance}
        onMenuClick={() => setMenuOpen(true)}
        onBalanceClick={() => console.log("Balance clicked")}
      />

      {/* Side Menu */}
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
            <a href="/" onClick={() => setMenuOpen(false)}>
              🏠 হোম
            </a>
            <a href="/" onClick={() => setMenuOpen(false)}>
              🎨 কালার ম্যাচিং
            </a>
            <a href="/" onClick={() => setMenuOpen(false)}>
              ⭐ ফেভারিট
            </a>
            <a href="/" onClick={() => setMenuOpen(false)}>
              👤 প্রোফাইল
            </a>
            <button onClick={handleLogout}>🚪 লগআউট</button>
          </aside>
        </>
      )}

      {/* Hero */}
      <section className="hero">
        <h1>
          আপনার ছবির <span className="grad">নিখুঁত রঙ</span> খুঁজে নিন
        </h1>
        <p>
          যেকোনো ছবি আপলোড করুন — আমরা তার ভেতরের রঙ বিশ্লেষণ করে সেরা
          কালার কম্বিনেশন তৈরি করে দেব।
        </p>
      </section>

      {/* Upload Section */}
      <section className="section">
        <h2 className="section-title">
          <span className="icon">📸</span> ছবি যুক্ত করুন
        </h2>
        <p className="section-sub">
          ডিভাইস থেকে ছবি নির্বাচন করুন, অথবা নিচের AI স্ক্যানার দিয়ে
          সরাসরি কালার স্কান করুন
        </p>
        <UploadBox onLocalUpload={handleLocalUpload} />
      </section>

      {/* Scanner Section */}
      <section className="section">
        <h2 className="section-title">
          <span className="icon">🔍</span> AI কালার স্ক্যানার
        </h2>
        <p className="section-sub">
          ক্যামেরা দিয়ে স্কান করুন — গ্লোবাল গ্যালারি থেকে ম্যাচিং কালার
          খুঁজে বের করুন
        </p>
        <ScannerBox onResult={handleScanResult} />
      </section>

      {/* Gallery Section */}
      <section className="section">
        <h2 className="section-title">
          <span className="icon">🌍</span> গ্লোবাল গ্যালারি
        </h2>
        <p className="section-sub">
          আমাদের কমিউনিটির শেয়ার করা কালার ইনস্পিরেশন
        </p>
        <Gallery />
      </section>

      <p className="home-footer">© 2025 Color Match</p>

      {/* Result Modal */}
      <ResultModal
        result={scanResult}
        onClose={() => setScanResult(null)}
        onAddNew={handleAddNew}
      />
    </div>
  );
}
