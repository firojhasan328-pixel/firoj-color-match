import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import UploadBox from "../components/UploadBox";
import Gallery from "../components/Gallery";
import { supabase } from "../lib/supabaseClient";
import { signOut } from "../services/authService";
import "../styles/home.css";

export default function Home() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Login করা User-এর নাম বের করা
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
    // Functionality পরের ধাপে
    console.log("Local file selected:", file?.name);
  }

  function handleUrlUpload(url) {
    // Functionality পরের ধাপে
    console.log("URL uploaded:", url);
  }

  return (
    <div className="home-page">
      <Navbar userName={userName} onMenuClick={() => setMenuOpen(true)} />

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
          নিচের যেকোনো একটি উপায়ে ছবি আপলোড করুন
        </p>
        <UploadBox
          onLocalUpload={handleLocalUpload}
          onUrlUpload={handleUrlUpload}
        />
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
    </div>
  );
}
