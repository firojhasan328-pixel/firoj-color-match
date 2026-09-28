import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import UploadBox from "../components/UploadBox";
import ScannerBox from "../components/ScannerBox";
import Gallery from "../components/Gallery";
import ResultModal from "../components/ResultModal";
import DetailsModal from "../components/DetailsModal";
import DuplicateModal from "../components/DuplicateModal";
import InvalidImageModal from "../components/InvalidImageModal";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabaseClient";
import { signOut } from "../services/authService";
import { getMyProfile } from "../services/profileService";
import { getMyBalance } from "../services/walletService";
import {
  uploadColorImage,
  saveColorRecord,
  addWatermarkToImage,
  checkDuplicateColor,
} from "../services/colorStorage";
import "../styles/home.css";

export default function Home() {
  const navigate = useNavigate();
  const uploadSectionRef = useRef(null);
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
  const [uploadHighlight, setUploadHighlight] = useState(false);
  const [scannedFile, setScannedFile] = useState(null);
  const [scannedPreview, setScannedPreview] = useState(null);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [invalidInfo, setInvalidInfo] = useState(null);

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

      try {
        const bal = await getMyBalance();
        setBalance(bal);
      } catch (err) {
        console.error("Balance load error:", err);
      }
    }
    loadUser();
  }, [navigate]);

  async function refreshBalance() {
    try {
      const bal = await getMyBalance();
      setBalance(bal);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  function handleLocalUpload(file, dataUrl) {
    setUploadFile(file);
    setUploadPreview(dataUrl);
  }

  function handleScanImage(file, dataUrl) {
    setScannedFile(file);
    setScannedPreview(dataUrl);
  }

  function handleInvalidImage(info) {
    setInvalidInfo(info);
  }

  async function handleSaveDetails({
    color,
    colorMix,
    details,
    totalWeight,
  }) {
    if (!userId || !uploadFile) return;
    setSaving(true);

    try {
      const duplicate = await checkDuplicateColor(color.hex);

      if (duplicate) {
        setDuplicateInfo(duplicate);
        setUploadFile(null);
        setUploadPreview(null);
        setSaving(false);
        return;
      }

      const watermarkedFile = await addWatermarkToImage(
        uploadFile,
        userCode || "CM000000",
        color.hex
      );

      const imageUrl = await uploadColorImage(watermarkedFile, userId);

      await saveColorRecord({
        userId,
        ownerName: userName,
        userCode: userCode || "CM000000",
        imageUrl,
        color,
        details,
        colorMix,
        totalWeight,
      });

      setUploadFile(null);
      setUploadPreview(null);
      setScannedFile(null);
      setScannedPreview(null);
      setGalleryRefresh((k) => k + 1);
      alert("✅ সফলভাবে গ্যালারিতে যোগ হয়েছে!");
    } catch (err) {
      console.error(err);
      alert("❌ সেভ করা যায়নি: " + (err?.message || "অজানা সমস্যা"));
    } finally {
      setSaving(false);
    }
  }

  function handleAddNewFromScan() {
    setScanResult(null);

    if (scannedFile && scannedPreview) {
      setUploadFile(scannedFile);
      setUploadPreview(scannedPreview);
    }

    setTimeout(() => {
      if (uploadSectionRef.current) {
        uploadSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      setUploadHighlight(true);

      setTimeout(() => {
        setUploadHighlight(false);
      }, 3000);
    }, 200);
  }

  function handleDuplicateViewDetails() {
    if (duplicateInfo?.id) {
      navigate(`/details/${duplicateInfo.id}`);
    }
    setDuplicateInfo(null);
  }

  function handleDuplicateCancel() {
    setDuplicateInfo(null);
  }

  function handleInvalidClose() {
    setInvalidInfo(null);
  }

  function handleInvalidTryAgain() {
    setInvalidInfo(null);
    setTimeout(() => {
      if (uploadSectionRef.current) {
        uploadSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 200);
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
          যেকোনো একরঙা ছবি আপলোড করুন — আমরা তার ভেতরের রঙ বিশ্লেষণ করে
          সেরা কালার কম্বিনেশন তৈরি করে দেব।
        </p>
      </section>

      <section className="section" ref={uploadSectionRef} id="upload-section">
        <h2 className="section-title">
          <span className="icon">📸</span> ছবি যুক্ত করুন
        </h2>
        <p className="section-sub">
          ডিভাইস থেকে ছবি নির্বাচন করুন — শুধু একরঙা ছবি গ্রহণ করা হবে
        </p>
        <div className={uploadHighlight ? "upload-highlight" : ""}>
          <UploadBox
            onLocalUpload={handleLocalUpload}
            onInvalidImage={handleInvalidImage}
          />
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">
          <span className="icon">🔍</span> AI কালার স্ক্যানার
        </h2>
        <p className="section-sub">
          ক্যামেরা দিয়ে স্কান করুন — শুধু একরঙা ছবি গ্রহণ করা হবে
        </p>
        <ScannerBox
          onResult={setScanResult}
          onScanImage={handleScanImage}
          onInvalidImage={handleInvalidImage}
        />
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

      <Footer />

      <ResultModal
        result={scanResult}
        onClose={() => setScanResult(null)}
        onAddNew={handleAddNewFromScan}
        onUnlocked={refreshBalance}
        currentUserId={userId}
      />

      {uploadPreview && (
        <DetailsModal
          imageFile={uploadFile}
          imagePreview={uploadPreview}
          onClose={() => {
            setUploadFile(null);
            setUploadPreview(null);
            setScannedFile(null);
            setScannedPreview(null);
          }}
          onSave={handleSaveDetails}
          saving={saving}
        />
      )}

      {duplicateInfo && (
        <DuplicateModal
          existingColor={duplicateInfo}
          onViewDetails={handleDuplicateViewDetails}
          onCancel={handleDuplicateCancel}
        />
      )}

      {invalidInfo && (
        <InvalidImageModal
          preview={invalidInfo.preview}
          score={invalidInfo.score}
          reason={invalidInfo.reason}
          onClose={handleInvalidClose}
          onTryAgain={handleInvalidTryAgain}
        />
      )}
    </div>
  );
}
