import React, { useEffect, useState } from "react";
import { extractDominantColor } from "../services/colorService";

export default function DetailsModal({
  imageFile,
  imagePreview,
  onClose,
  onSave,
  saving,
}) {
  const [color, setColor] = useState(null);
  const [details, setDetails] = useState("");
  const [analyzing, setAnalyzing] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function analyze() {
      try {
        const c = await extractDominantColor(imagePreview);
        setColor(c);
      } catch (err) {
        console.error(err);
      } finally {
        setAnalyzing(false);
      }
    }
    if (imagePreview) analyze();
  }, [imagePreview]);

  function handleSave() {
    setError("");

    if (!color) {
      setError("কালার বিশ্লেষণ শেষ হয়নি। অপেক্ষা করুন।");
      return;
    }

    const trimmed = details.trim();
    if (!trimmed) {
      setError("কালার বিস্তারিত অবশ্যই দিতে হবে। বিস্তারিত ছাড়া সেভ করা যাবে না।");
      return;
    }

    if (trimmed.length < 5) {
      setError("বিস্তারিত কমপক্ষে ৫ অক্ষরের হতে হবে।");
      return;
    }

    onSave({ color, details: trimmed });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">📝 ছবির বিস্তারিত দিন</h3>

        <div className="details-preview">
          <img src={imagePreview} alt="Preview" />
        </div>

        {analyzing ? (
          <div className="scanner-status">
            <span className="pulse" />
            কালার বিশ্লেষণ করা হচ্ছে...
          </div>
        ) : (
          color && (
            <>
              <div className="auto-color-box">
                <div
                  className="scan-color-chip"
                  style={{ background: color.hex }}
                />
                <div className="scan-info">
                  <p className="scan-label">
                    🤖 AI অটো-ডিটেক্টেড কালার কোড
                  </p>
                  <p className="scan-hex">{color.hex}</p>
                  <p className="scan-rgb">{color.rgbString}</p>
                </div>
              </div>

              <div className="field" style={{ marginTop: "14px" }}>
                <label htmlFor="details">
                  কালার বিস্তারিত{" "}
                  <span className="required-mark">*</span>
                </label>
                <textarea
                  id="details"
                  value={details}
                  onChange={(e) => {
                    setDetails(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="যেমন: লাল, কমলা ও বাদামী রঙের মিশ্রণ, উষ্ণ আবহ..."
                  rows={4}
                  className="details-textarea"
                />
                <p className="field-hint">
                  কমপক্ষে ৫ অক্ষরের বিস্তারিত দিন — এটা বাধ্যতামূলক।
                </p>
              </div>

              <div className="watermark-note">
                🔒 আপনার ইউনিক আইডি এবং কালার কোড ({color.hex}) স্বয়ংক্রিয়ভাবে
                ছবির সাথে যুক্ত হয়ে যাবে — কেউ পরিবর্তন করতে পারবে না।
              </div>

              {error && <div className="error-box">{error}</div>}

              <div className="modal-actions">
                <button
                  className="modal-btn secondary"
                  onClick={onClose}
                  disabled={saving}
                >
                  বাতিল
                </button>
                <button
                  className="modal-btn primary"
                  onClick={handleSave}
                  disabled={saving || !color}
                >
                  {saving ? "সেভ হচ্ছে..." : "✅ সেভ করুন"}
                </button>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}
