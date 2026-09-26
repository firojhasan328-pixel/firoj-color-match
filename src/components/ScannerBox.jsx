import React, { useRef, useState } from "react";
import {
  extractDominantColor,
  findMatchingImages,
} from "../services/colorService";
import { sampleColorImages } from "../data/sampleColors";

export default function ScannerBox({ onResult }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);

  function handleScanClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      setPreview(dataUrl);
      setScanning(true);

      try {
        const color = await extractDominantColor(dataUrl);
        const matches = findMatchingImages(color, sampleColorImages);

        const result = {
          found: matches.length > 0,
          scannedColor: color,
          matches,
        };

        if (onResult) onResult(result);
      } catch (err) {
        console.error("Color extraction failed:", err);
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleReset() {
    setPreview(null);
    setScanning(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onResult) onResult(null);
  }

  return (
    <div className="scanner-card">
      {!preview ? (
        <>
          <div className="scanner-icon">🎯</div>
          <h3>AI কালার স্ক্যানার</h3>
          <p>
            যেকোনো কালার বা ইমেজের উপর স্ক্যান করুন — আমরা গ্লোবাল
            গ্যালারিতে তার ম্যাচ খুঁজে বের করব।
          </p>
          <button className="scan-btn" onClick={handleScanClick}>
            📷 স্কান করুন
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
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
