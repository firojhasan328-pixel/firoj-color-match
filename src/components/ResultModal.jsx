import React, { useEffect, useState } from "react";
import { unlockColor } from "../services/walletService";

export default function ResultModal({ result, onClose, onAddNew, onUnlocked }) {
  const [unlockState, setUnlockState] = useState({});
  const [countdown, setCountdown] = useState({});
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    const timers = [];
    Object.keys(countdown).forEach((id) => {
      if (countdown[id] > 0) {
        const timer = setTimeout(() => {
          setCountdown((c) => ({ ...c, [id]: c[id] - 1 }));
        }, 1000);
        timers.push(timer);
      } else if (countdown[id] === 0) {
        // Countdown শেষ → RPC Call → Unlock
        finalizeUnlock(id);
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [countdown]);

  if (!result) return null;

  const { found, scannedColor, matches } = result;

  function handleUnlock(match) {
    setCountdown((c) => ({ ...c, [match.id]: 10 }));
  }

  async function finalizeUnlock(matchId) {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    setProcessing((p) => ({ ...p, [matchId]: true }));

    try {
      await unlockColor(match.id, match.userId);
      setUnlockState((u) => ({ ...u, [matchId]: true }));
      if (onUnlocked) onUnlocked();
    } catch (err) {
      console.error("Unlock error:", err);
      // তবুও Unlock দেখাই — Network সমস্যা হলেও ইউজার পড়তে পারবে
      setUnlockState((u) => ({ ...u, [matchId]: true }));
    } finally {
      setProcessing((p) => ({ ...p, [matchId]: false }));
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
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
                const isProcessing = processing[m.id];

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
                          {isProcessing ? (
                            <div className="scanner-status">
                              <span className="pulse" />
                              Unlock হচ্ছে...
                            </div>
                          ) : counting ? (
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
                              onClick={() => handleUnlock(m)}
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
