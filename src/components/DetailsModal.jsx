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
    if (!color) return;
    onSave({ color, details });
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
                  কালার বিস্তারিত (কী দিয়ে তৈরি, কী ধরনের রঙ)
                </label>
                <textarea
                  id="details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="যেমন: লাল, কমলা ও বাদামী রঙের মিশ্রণ, উষ্ণ আবহ..."
                  rows={4}
                  className="details-textarea"
                />
              </div>

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
