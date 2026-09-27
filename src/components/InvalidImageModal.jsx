import React from "react";

export default function InvalidImageModal({
  preview,
  score,
  reason,
  onClose,
  onTryAgain,
}) {
  return (
    <div className="invalid-overlay" onClick={onClose}>
      <div className="invalid-card" onClick={(e) => e.stopPropagation()}>
        <div className="invalid-icon-wrap">
          <div className="invalid-icon">🚫</div>
        </div>

        <h3 className="invalid-title">শুধু একরঙা ছবি আপলোড করুন</h3>

        <p className="invalid-text">
          আপনার দেওয়া ছবিতে অনেক ধরনের রঙ, প্যাটার্ন বা বস্তু আছে — যা
          গ্রহণ করা যায় না। Color Match-এ শুধু <strong>একরঙা (Solid Color)</strong> ছবি
          আপলোড করা যাবে।
        </p>

        {preview && (
          <div className="invalid-preview">
            <img src={preview} alt="Invalid" />
            <div className="invalid-preview-note">
              এই ছবিটি গ্রহণ করা যায় না
            </div>
          </div>
        )}

        {score !== undefined && (
          <div className="invalid-score-box">
            <span className="invalid-score-label">
              Color Complexity Score
            </span>
            <span className="invalid-score-value">{score}%</span>
            <span className="invalid-score-threshold">
              (গ্রহণযোগ্য সীমা: ১২% বা কম)
            </span>
          </div>
        )}

        <div className="invalid-tips">
          <p className="invalid-tips-title">✅ কী ধরনের ছবি আপলোড করবেন:</p>
          <ul>
            <li>শুধু একটা রঙ দিয়ে আঁকা ছবি</li>
            <li>রঙের সলিড বা একরঙা পটভূমি</li>
            <li>কোনো বস্তু, মুখ, প্রাকৃতিক দৃশ্য নয়</li>
          </ul>
        </div>

        <div className="invalid-actions">
          <button className="invalid-btn secondary" onClick={onClose}>
            বাতিল
          </button>
          <button className="invalid-btn primary" onClick={onTryAgain}>
            🔄 আবার চেষ্টা করুন
          </button>
        </div>
      </div>
    </div>
  );
}
