import React, { useRef, useState } from "react";

export default function UploadBox({ onLocalUpload, onUrlUpload }) {
  const fileInputRef = useRef(null);
  const [url, setUrl] = useState("");

  function handleLocalClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // এখন শুধু নির্বাচিত ফাইল Parent-এ পাঠাচ্ছি (Functionality পরে)
    if (onLocalUpload) onLocalUpload(file);
  }

  function handleUrlSubmit() {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (onUrlUpload) onUrlUpload(trimmed);
    setUrl("");
  }

  return (
    <div className="upload-grid">
      {/* বাম: Local Storage Upload */}
      <div className="upload-card" onClick={handleLocalClick}>
        <div className="upload-icon">📁</div>
        <h3>ডিভাইস থেকে আপলোড</h3>
        <p>আপনার মোবাইল বা কম্পিউটার থেকে একটি ছবি নির্বাচন করুন</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      {/* ডান: URL Upload */}
      <div className="upload-card">
        <div className="upload-icon">🔗</div>
        <h3>URL দিয়ে আপলোড</h3>
        <p>ছবির একটি লিংক পেস্ট করে যুক্ত করুন</p>
        <div className="url-input-wrap">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
          <button type="button" onClick={handleUrlSubmit}>
            যোগ
          </button>
        </div>
      </div>
    </div>
  );
}
