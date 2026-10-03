import React, { useEffect, useRef, useState } from "react";
import { AD_COUNTDOWN, openAdLink } from "../services/adService";

export default function AdUnlockModal({ onComplete, onCancel }) {
  const [countdown, setCountdown] = useState(AD_COUNTDOWN);
  const [tabActive, setTabActive] = useState(true);
  const [adOpened, setAdOpened] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  const timerRef = useRef(null);

  // ========================================
  // Tab Visibility Detection
  // ========================================
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        setTabActive(false);
      } else {
        setTabActive(true);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // ========================================
  // Countdown Timer
  // ========================================
  useEffect(() => {
    // Ad খোলার আগে Timer চলবে না
    if (!adOpened) return;

    // Tab Active না হলে Timer Pause
    if (!tabActive) return;

    if (countdown <= 0) {
      // Countdown শেষ
      if (onComplete) onComplete();
      return;
    }

    timerRef.current = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timerRef.current);
  }, [countdown, tabActive, adOpened, onComplete]);

  // ========================================
  // Ad Open করার Handler
  // ========================================
  function handleOpenAd() {
    openAdLink();
    setAdOpened(true);
    setAdLoaded(true);
  }

  // ========================================
  // Progress Percentage
  // ========================================
  const progress = ((AD_COUNTDOWN - countdown) / AD_COUNTDOWN) * 100;

  return (
    <div className="ad-modal-overlay">
      <div className="ad-modal-card">
        {/* Header */}
        <div className="ad-modal-header">
          <div className="ad-modal-header-content">
            <span className="ad-modal-icon">📺</span>
            <div>
              <h3 className="ad-modal-title">Ad দেখে Unlock করুন</h3>
              <p className="ad-modal-subtitle">
                {AD_COUNTDOWN} সেকেন্ডের বিজ্ঞাপন দেখতে হবে
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="ad-modal-body">
          {!adOpened ? (
            // Step 1: Ad Open করার আগে
            <>
              <div className="ad-intro-box">
                <div className="ad-intro-icon">🎬</div>
                <h4 className="ad-intro-title">
                  Unlock করতে যা যা করতে হবে
                </h4>
                <ul className="ad-intro-list">
                  <li>
                    <span className="step-num">১</span>
                    নিচের "Ad দেখুন" বাটনে ক্লিক করুন
                  </li>
                  <li>
                    <span className="step-num">২</span>
                    নতুন Tab-এ ৩০ সেকেন্ডের Ad দেখুন
                  </li>
                  <li>
                    <span className="step-num">৩</span>
                    Ad থেকে ফিরে এলে Details Unlock হবে
                  </li>
                </ul>

                <div className="ad-warning">
                  ⚠️ <strong>মনে রাখবেন:</strong> এই Tab থেকে গেলে
                  Countdown বন্ধ হয়ে যাবে
                </div>
              </div>

              <button className="ad-open-btn" onClick={handleOpenAd}>
                🎬 Ad দেখুন
              </button>

              <button className="ad-cancel-btn" onClick={onCancel}>
                বাতিল
              </button>
            </>
          ) : (
            // Step 2: Ad Open হয়েছে
            <>
              <div className="ad-progress-wrap">
                <div className="ad-progress-circle">
                  <svg viewBox="0 0 100 100" className="ad-progress-svg">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="ad-progress-bg"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="ad-progress-fill"
                      style={{
                        strokeDasharray: `${2 * Math.PI * 42}`,
                        strokeDashoffset: `${
                          2 * Math.PI * 42 * (1 - progress / 100)
                        }`,
                      }}
                    />
                  </svg>
                  <div className="ad-progress-text">
                    <span className="ad-progress-num">{countdown}</span>
                    <span className="ad-progress-unit">sec</span>
                  </div>
                </div>
              </div>

              {tabActive ? (
                <div className="ad-status active">
                  <span className="ad-status-icon">▶️</span>
                  <span>Ad চলছে... অপেক্ষা করুন</span>
                </div>
              ) : (
                <div className="ad-status paused">
                  <span className="ad-status-icon">⏸️</span>
                  <span>
                    Ad দেখতে হবে — Tab-এ ফিরে আসুন
                  </span>
                </div>
              )}

              <div className="ad-note">
                💡 Ad শেষ হলে এই Page-এ ফিরে আসুন এবং Unlock করুন।
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {adOpened && (
          <div className="ad-modal-footer">
            <button className="ad-cancel-btn" onClick={onCancel}>
              বাতিল করুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
