import React, { useEffect, useState } from "react";
import { unlockColor } from "../services/walletService";
import { logAdUnlock } from "../services/adService";
import AdUnlockModal from "./AdUnlockModal";

export default function ResultModal({
  result,
  onClose,
  onAddNew,
  onUnlocked,
  currentUserId,
}) {
  const [unlockState, setUnlockState] = useState({});
  const [processing, setProcessing] = useState({});
  const [adModalMatch, setAdModalMatch] = useState(null);

  if (!result) return null;

  const { found, scannedColor, scannedImage, matches } = result;

  // Ad Modal থেকে ফিরে আসার পর
  async function handleAdComplete() {
    const match = adModalMatch;
    if (!match) return;

    setAdModalMatch(null);
    setProcessing((p) => ({ ...p, [match.id]: true }));

    try {
      // Ad Log Save
      await logAdUnlock(currentUserId, match.id, 30);

      // Unlock RPC
      await unlockColor(match.id, match.userId);
      setUnlockState((u) => ({ ...u, [match.id]: true }));
      if (onUnlocked) onUnlocked();
    } catch (err) {
      console.error("Unlock error:", err);
      setUnlockState((u) => ({ ...u, [match.id]: true }));
    } finally {
      setProcessing((p) => ({ ...p, [match.id]: false }));
    }
  }

  function handleAdCancel() {
    setAdModalMatch(null);
  }

  return (
    <>
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
                  const isProcessing = processing[m.id];
                  const isOwn =
                    currentUserId && currentUserId === m.userId;

                  return (
                    <div key={m.id} className="match-item-wrapper">
                      <div className="vs-comparison">
                        <div className="vs-side">
                          <img
                            src={scannedImage || m.url}
                            alt="Scanned"
                            className="vs-image"
                          />
                          <p className="vs-hex">{scannedColor.hex}</p>
                        </div>

                        <div className="vs-divider">
                          <span className="vs-text">Vs</span>
                        </div>

                        <div className="vs-side">
                          <img
                            src={m.url}
                            alt={m.caption}
                            className="vs-image"
                          />
                          <p className="vs-hex">{m.hex}</p>
                        </div>
                      </div>

                      <div className="vs-owner-bar">
                        <span className="vs-owner-text">
                          @{m.owner} · {m.ownerCode}
                          {isOwn && " (আপনার)"}
                        </span>
                      </div>

                      {unlocked ? (
                        <div className="details-unlocked">
                          <p className="details-unlocked-label">
                            📋 বিস্তারিত
                          </p>
                          <p className="details-unlocked-text">
                            {m.details || "কোনো বিস্তারিত নেই"}
                          </p>
                          {!isOwn && (
                            <div className="earning-note">
                              💰 ছবির মালিক ৳১ পেয়েছেন
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="details-locked">
                          <div className="lock-icon">🔒</div>
                          <p className="lock-text">
                            বিস্তারিত দেখতে Ad দেখে Unlock করুন
                          </p>

                          {isProcessing ? (
                            <div className="unlock-status">
                              <span className="pulse" />
                              Unlock হচ্ছে...
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="unlock-btn"
                              onClick={() => setAdModalMatch(m)}
                            >
                              📺 Ad দেখে Unlock করুন
                            </button>
                          )}
                        </div>
                      )}
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

      {/* Ad Unlock Modal */}
      {adModalMatch && (
        <AdUnlockModal
          onComplete={handleAdComplete}
          onCancel={handleAdCancel}
        />
      )}
    </>
  );
}
