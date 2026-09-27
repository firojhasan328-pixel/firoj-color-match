import React, { useEffect, useState } from "react";

export default function ResultModal({ result, onClose, onAddNew }) {
  const [unlockState, setUnlockState] = useState({});
  const [countdown, setCountdown] = useState({});

  useEffect(() => {
    // Countdown Timer চালানো
    const timers = [];
    Object.keys(countdown).forEach((id) => {
      if (countdown[id] > 0) {
        const timer = setTimeout(() => {
          setCountdown((c) => ({ ...c, [id]: c[id] - 1 }));
        }, 1000);
        timers.push(timer);
      } else if (countdown[id] === 0) {
        setUnlockState((u) => ({ ...u, [id]: true }));
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [countdown]);

  if (!result) return null;

  const { found, scannedColor, matches } = result;

  function handleUnlock(id) {
    setCountdown((c) => ({ ...c, [id]: 10 }));
  }

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
              {matches.map((m) => {
                const unlocked = unlockState[m.id];
                const counting = countdown[m.id] > 0;
                const countNum = countdown[m.id];

                return (
                  <div key={m.id} className="match-item-wrapper">
                    <div className="match-item">
                      <img src={m.url} alt={m.caption} />
                      <div className="match-info">
                        <p className="match-caption">{m.caption}</p>
                        <p className="match-owner">
                          @{m.owner} · {m.ownerCode}
                        </p>
                      </div>
                      <div
                        className="match-chip"
                        style={{ background: m.hex }}
                      />
                    </div>

                    {/* Details Section */}
                    <div className="match-details-section">
                      {unlocked ? (
                        <div className="details-unlocked">
                          <p className="details-unlocked-label">
                            📋 বিস্তারিত
                          </p>
                          <p className="details-unlocked-text">
                            {m.details || "কোনো বিস্তারিত নেই"}
                          </p>
                          <div className="earning-note">
                            💰 ছবির মালিক ৳১ পেয়েছেন
                          </div>
                        </div>
                      ) : (
                        <div className="details-locked">
                          <div className="lock-icon">🔒</div>
                          <p className="lock-text">
                            বিস্তারিত দেখতে Unlock করুন
                          </p>
                          {counting ? (
                            <div className="countdown-box">
                              <span className="countdown-num">
                                {countNum}
                              </span>
                              <span className="countdown-label">
                                সেকেন্ড অপেক্ষা করুন...
                              </span>
                            </div>
                          ) : (
                            <button
                              className="unlock-btn"
                              onClick={() => handleUnlock(m.id)}
                            >
                              🔓 Unlock করুন
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
