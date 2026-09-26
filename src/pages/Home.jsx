import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import UploadBox from "../components/UploadBox";
import ScannerBox from "../components/ScannerBox";
import Gallery from "../components/Gallery";
import ResultModal from "../components/ResultModal";
import DetailsModal from "../components/DetailsModal";
import { supabase } from "../lib/supabaseClient";
import { signOut } from "../services/authService";
import { getMyProfile } from "../services/profileService";
import {
  uploadColorImage,
  saveColorRecord,
  addWatermarkToImage,
} from "../services/colorStorage";
import "../styles/home.css";

export default function Home() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");
  const [userId, setUserId] = useState(null);
  const [userCode, setUserCode] = useState("");
  const [balance, setBalance] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [galleryRefresh, setGalleryRefresh] = useState(0);

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
      setUserId(user.id);

      try {
        const profile = await getMyProfile();
        if (profile?.user_code) setUserCode(profile.user_code);
      } catch (err) {
        console.error("Profile load error:", err);
      }
    }
    loadUser();
  }, [navigate]);

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  function handleLocalUpload(file, dataUrl) {
    setUploadFile(file);
    setUploadPreview(dataUrl);
  }

  async function handleSaveDetails({ color, details }) {
    if (!userId || !uploadFile) return;
    setSaving(true);

    try {
      // ১। Watermark + Color Code সহ ছবি তৈরি
      const watermarkedFile = await addWatermarkToImage(
        uploadFile,
        userCode || "CM000000",
        color.hex
      );

      // ২। Storage-এ আপলোড
      const imageUrl = await uploadColorImage(watermarkedFile, userId);

      // ৩। Database-এ সেভ
      await saveColorRecord({
        userId,
        ownerName: userName,
        userCode: userCode || "CM000000",
        imageUrl,
        color,
        details,
      });

      setUploadFile(null);
      setUploadPreview(null);
      setGalleryRefresh((k) => k + 1);
      alert("✅ সফলভাবে গ্যালারিতে যোগ হয়েছে!");
    } catch (err) {
      console.error(err);
      alert("❌ সেভ করা যায়নি: " + (err?.message || "অজানা সমস্যা"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="home-page">
      <Navbar
        userName={userName}
        balance={balance}
        onMenuClick={() => setMenuOpen(true)}
        onBalanceClick={() => console.log("Balance clicked")}
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

      <section className="hero">
        <h1>
          আপনার ছবির <span className="grad">নিখুঁত রঙ</span> খুঁজে নিন
        </h1>
        <p>
          যেকোনো ছবি আপলোড করুন — আমরা তার ভেতরের রঙ বিশ্লেষণ করে সেরা
          কালার কম্বিনেশন তৈরি করে দেব।
        </p>
      </section>

      <section className="section">
        <h2 className="section-title">
          <span className="icon">📸</span> ছবি যুক্ত করুন
        </h2>
        <p className="section-sub">
          ডিভাইস থেকে ছবি নির্বাচন করুন — গ্লোবাল গ্যালারিতে যোগ হবে
        </p>
        <UploadBox onLocalUpload={handleLocalUpload} />
      </section>

      <section className="section">
        <h2 className="section-title">
          <span className="icon">🔍</span> AI কালার স্ক্যানার
        </h2>
        <p className="section-sub">
          ক্যামেরা দিয়ে স্কান করুন — গ্লোবাল গ্যালারি থেকে ম্যাচিং কালার
          খুঁজে বের করুন
        </p>
        <ScannerBox onResult={setScanResult} />
      </section>

      <section className="section">
        <h2 className="section-title">
          <span className="icon">🌍</span> গ্লোবাল গ্যালারি
        </h2>
        <p className="section-sub">
          আমাদের কমিউনিটির শেয়ার করা কালার ইনস্পিরেশন
        </p>
        <Gallery refreshKey={galleryRefresh} />
      </section>

      <p className="home-footer">© 2025 Color Match</p>

      <ResultModal
        result={scanResult}
        onClose={() => setScanResult(null)}
        onAddNew={() => {
          alert("স্ক্যান করা কালার অ্যাড করার ফিচার পরের ধাপে আসবে।");
          setScanResult(null);
        }}
      />

      {uploadPreview && (
        <DetailsModal
          imageFile={uploadFile}
          imagePreview={uploadPreview}
          onClose={() => {
            setUploadFile(null);
            setUploadPreview(null);
          }}
          onSave={handleSaveDetails}
          saving={saving}
        />
      )}
    </div>
  );
}
