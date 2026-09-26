import React, { useRef, useState } from "react";

export default function ScannerBox({ onCapture }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);

  function handleScanClick() {
    // Camera সহ File Input খুলবে (মোবাইলে সরাসরি Camera আসবে)
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target.result);
      setScanning(true);
      // Phase 2-এ এখানে Color Detection হবে
      if (onCapture) onCapture(file, event.target.result);
    };
    reader.readAsDataURL(file);
  }

  function handleReset() {
    setPreview(null);
    setScanning(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
          {scanning && (
            <div className="scanner-status">
              <span className="pulse" />
              বিশ্লেষণ করা হচ্ছে...
            </div>
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
