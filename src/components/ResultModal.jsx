import React from "react";

export default function ResultModal({ result, onClose, onAddNew }) {
  if (!result) return null;

  const { found, scannedColor, matches } = result;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Scanned Color Preview */}
        <div className="modal-scan-preview">
          <div
            className="scan-color-chip"
            style={{ background: scannedColor.hex }}
          />
          <div className="scan-info">
            <p className="scan-label">স্ক্যান করা কালার</p>
            <p className="scan-hex">{scannedColor.hex}</p>
          </div>
        </div>

        {found ? (
          <>
            <h3 className="modal-title">
              🎉 {matches.length}টি ম্যাচ পাওয়া গেছে!
            </h3>
            <div className="match-list">
              {matches.map((m) => (
                <div key={m.id} className="match-item">
                  <img src={m.url} alt={m.caption} />
                  <div className="match-info">
                    <p className="match-caption">{m.caption}</p>
                    <p className="match-owner">@{m.owner}</p>
                  </div>
                  <div
                    className="match-chip"
                    style={{ background: m.hex }}
                  />
                </div>
              ))}
            </div>
            <button className="modal-btn primary" onClick={onClose}>
              বন্ধ করুন
            </button>
          </>
        ) : (
          <>
            <h3 className="modal-title">😔 খুঁজে পাওয়া যায়নি</h3>
            <p className="modal-text">
              আপনার কালার টোন খুঁজে পাওয়া যায়নি। এই কালার টোন গ্লোবাল
              গ্যালারিতে যোগ করতে চাইলে "অ্যাড" বাটনে চাপুন।
            </p>
            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={onClose}>
                বাতিল
              </button>
              <button className="modal-btn primary" onClick={onAddNew}>
                ➕ অ্যাড করুন
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
