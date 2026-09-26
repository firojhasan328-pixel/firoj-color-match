import React, { useRef } from "react";

export default function UploadBox({ onLocalUpload }) {
  const fileInputRef = useRef(null);

  function handleLocalClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onLocalUpload) onLocalUpload(file);
  }

  return (
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
  );
}
