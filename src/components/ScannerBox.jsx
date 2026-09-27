import React, { useRef, useState } from "react";
import {
  extractDominantColor,
  findMatchingImages,
} from "../services/colorService";
import { fetchAllColors } from "../services/colorStorage";

export default function ScannerBox({ onResult }) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);

  function handleCameraClick() {
    cameraInputRef.current?.click();
  }

  function handleGalleryClick() {
    galleryInputRef.current?.click();
  }

  async function processImage(file) {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      setPreview(dataUrl);
      setScanning(true);

      try {
        // ১। স্ক্যান করা ছবি থেকে Color বের করি
        const scannedColor = await extractDominantColor(dataUrl);

        // ২। Global Gallery থেকে সব ছবি আনি
        const allColors = await fetchAllColors();

        // ৩। Database Row-কে Matchable Format-এ নিই
        const galleryImages = allColors.map((row) => ({
          id: row.id,
          url: row.image_url,
          caption: row.details?.slice(0, 30) || row.owner_name,
          hex: row.color_hex,
          color: { r: row.color_r, g: row.color_g, b: row.color_b },
          owner: row.owner_name,
          ownerCode: row.user_code,
          userId: row.user_id,
          details: row.details,
        }));

        // ৪। শক্তিশালী Match Logic চালাই
        const matches = findMatchingImages(scannedColor, galleryImages);

        const result = {
          found: matches.length > 0,
          scannedColor,
          matches,
        };

        if (onResult) onResult(result);
      } catch (err) {
        console.error("Scan error:", err);
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    processImage(file);
    if (e.target) e.target.value = "";
  }

  function handleReset() {
    setPreview(null);
    setScanning(false);
    if (onResult) onResult(null);
  }

  return (
    <div className="scanner-card">
      {!preview ? (
        <>
          <div className="scanner-icon">🎯</div>
          <h3>AI কালার স্ক্যানার</h3>
          <p>
            ক্যামেরা দিয়ে স্কান করুন অথবা গ্যালারি থেকে ছবি নির্বাচন করুন —
            আমরা গ্লোবাল গ্যালারিতে তার ম্যাচ খুঁজে বের করব।
          </p>

          <div className="scan-btn-group">
            <button className="scan-btn" onClick={handleCameraClick}>
              📷 ক্যামেরা
            </button>
            <button
              className="scan-btn secondary"
              onClick={handleGalleryClick}
            >
              🖼️ গ্যালারি
            </button>
          </div>

          {/* Camera Input */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          {/* Gallery Input */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </>
      ) : (
        <div className="scanner-preview">
          <img src={preview} alt="Scanned" />
          {scanning ? (
            <div className="scanner-status">
              <span className="pulse" />
              বিশ্লেষণ করা হচ্ছে...
            </div>
          ) : (
            <div className="scanner-status done">✅ বিশ্লেষণ সম্পন্ন</div>
          )}
          <div className="scanner-actions">
            <button className="scan-btn secondary" onClick={handleReset}>
              🔄 আবার স্কান করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
