import React from "react";

export default function DuplicateModal({ existingColor, onViewDetails, onCancel }) {
  if (!existingColor) return null;

  return (
    <div className="dup-overlay" onClick={onCancel}>
      <div className="dup-card" onClick={(e) => e.stopPropagation()}>
        <div className="dup-icon-wrap">
          <div className="dup-icon">🎨</div>
        </div>

        <h3 className="dup-title">এই কালার টোন আগে থেকেই আছে!</h3>

        <p className="dup-text">
          গ্লোবাল গ্যালারিতে <strong>{existingColor.color_hex}</strong> কোডের
          একটি ছবি ইতিমধ্যে আপলোড করা হয়েছে। আপনি চাইলে সেই ছবির বিস্তারিত
          দেখতে পারেন।
        </p>

        <div className="dup-preview">
          <img
            src={existingColor.image_url}
            alt="Existing"
            className="dup-image"
          />
          <div className="dup-image-info">
            <div
              className="dup-color-chip"
              style={{ background: existingColor.color_hex }}
            />
            <div>
              <p className="dup-hex">{existingColor.color_hex}</p>
              <p className="dup-owner">
                @{existingColor.owner_name} · {existingColor.user_code}
              </p>
            </div>
          </div>
        </div>

        <div className="dup-lock-note">
          🔒 এই ছবির Details দেখতে Unlock করতে হবে
        </div>

        <div className="dup-actions">
          <button className="dup-btn secondary" onClick={onCancel}>
            বাতিল
          </button>
          <button className="dup-btn primary" onClick={onViewDetails}>
            📋 ডিটেল্স দেখুন
          </button>
        </div>
      </div>
    </div>
  );
}
