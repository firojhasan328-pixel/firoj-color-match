import React, { useEffect, useState } from "react";
import { signOut } from "../services/authService";
import {
  formatRemainingTime,
  markContactRequested,
} from "../services/securityService";
import "../styles/account-blocked.css";

const SUPPORT_PHONE = "01918568313";
const WHATSAPP = "8801918568313";

export default function AccountLockedModal({ lockInfo, onClose }) {
  const [remaining, setRemaining] = useState(
    lockInfo?.remaining_seconds || 0
  );
  const [contacted, setContacted] = useState(false);
  const [marking, setMarking] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (!lockInfo || !lockInfo.locked_until) return;
    if (lockInfo.permanent) return;

    const target = new Date(lockInfo.locked_until).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const sec = Math.max(0, Math.floor((target - now) / 1000));
      setRemaining(sec);

      if (sec === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockInfo]);

  if (!lockInfo) return null;

  const isPermanent = lockInfo.permanent === true;
  const tier = lockInfo.tier || 3;
  const is72Hour = tier === 3;

  // ================================
  // Contact Support Click
  // ================================
  async function handleContactSupport() {
    setMarking(true);
    try {
      const userId = lockInfo.user_id;
      if (userId) {
        await markContactRequested(userId);
      }
      setContacted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setMarking(false);
    }
  }

  // ================================
  // Handle Logout
  // ================================
  async function handleLogout() {
    await signOut();
    if (onClose) onClose();
    window.location.href = "/login";
  }

  // ================================
  // Render
  // ================================
  return (
    <div className="locked-overlay">
      <div
        className={`locked-card ${
          isPermanent ? "permanent" : is72Hour ? "locked72" : "warning"
        }`}
      >
        {/* Top Glow */}
        <div className="locked-top-glow" />

        {/* Icon */}
        <div className="locked-icon-wrap">
          <div className="locked-icon">
            {isPermanent ? "🚫" : is72Hour ? "🔒" : "⚠️"}
          </div>
        </div>

        {/* Title */}
        <h2 className="locked-title">
          {isPermanent
            ? "Account স্থায়ীভাবে বন্ধ"
            : is72Hour
            ? "Account সাময়িকভাবে Lock"
            : "সতর্কবার্তা"}
        </h2>

        {/* Message */}
        <div className="locked-message-box">
          {isPermanent ? (
            <p className="locked-message">
              আপনার Account{" "}
              <strong className="locked-highlight permanent">
                স্থায়ীভাবে বন্ধ
              </strong>{" "}
              করা হয়েছে।
              <br />
              <br />
              কারণ: নিরাপত্তা নিয়ম ভঙ্গের কারণে বা ৭২ ঘণ্টার মধ্যে Support
              Team-এর সাথে যোগাযোগ করা হয়নি।
              <br />
              <br />
              <strong>Support Team-এর সাথে যোগাযোগ করুন:</strong>
            </p>
          ) : is72Hour ? (
            <p className="locked-message">
              আপনার{" "}
              <strong className="locked-highlight">
                ৫ বার পরপর ভুল Password
              </strong>{" "}
              দেওয়ার কারণে আপনার Account{" "}
              <strong className="locked-highlight">৭২ ঘণ্টার জন্য</strong>{" "}
              সাময়িকভাবে লক করা হয়েছে।
              <br />
              <br />
              <strong>⚠️ গুরুত্বপূর্ণ:</strong> এই ৭২ ঘণ্টার মধ্যে আমাদের
              Support Team-এর সাথে যোগাযোগ না করলে আপনার Account{" "}
              <strong className="locked-highlight permanent">
                স্থায়ীভাবে বন্ধ
              </strong>{" "}
              হয়ে যাবে।
            </p>
          ) : (
            <p className="locked-message">
              আপনার Account-এ সাময়িক সমস্যা শনাক্ত হয়েছে। অনুগ্রহ করে
              Support Team-এর সাথে যোগাযোগ করুন।
            </p>
          )}
        </div>

        {/* Countdown (Only for 72-hour lock) */}
        {!isPermanent && is72Hour && remaining > 0 && (
          <div className="locked-countdown-box">
            <p className="locked-countdown-label">
              ⏱️ স্থায়ীভাবে বন্ধ হওয়ার আগে বাকি
            </p>
            <p className="locked-countdown-time">
              {formatRemainingTime(remaining)}
            </p>
          </div>
        )}

        {/* Warning Banner (Only for 72-hour lock) */}
        {!isPermanent && is72Hour && (
          <div className="locked-warning-banner">
            <span className="locked-warning-icon">⚠️</span>
            <span className="locked-warning-text">
              {remaining > 0
                ? "৭২ ঘণ্টার মধ্যে যোগাযোগ না করলে Account স্থায়ীভাবে বন্ধ হয়ে যাবে"
                : "সময় শেষ! Account এখন স্থায়ীভাবে বন্ধ"}
            </span>
          </div>
        )}

        {/* Contact Section */}
        <div className="locked-contact-section">
          <p className="locked-contact-title">
            📞 Support Team-এর সাথে যোগাযোগ করুন
          </p>

          <div className="locked-contact-grid">
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="locked-contact-btn whatsapp"
              onClick={handleContactSupport}
            >
              <span className="locked-contact-icon">💬</span>
              <div className="locked-contact-text">
                <span className="locked-contact-label">WhatsApp</span>
                <span className="locked-contact-value">
                  {SUPPORT_PHONE}
                </span>
              </div>
            </a>

            <a
              href={`tel:${SUPPORT_PHONE}`}
              className="locked-contact-btn call"
              onClick={handleContactSupport}
            >
              <span className="locked-contact-icon">📞</span>
              <div className="locked-contact-text">
                <span className="locked-contact-label">Phone Call</span>
                <span className="locked-contact-value">
                  {SUPPORT_PHONE}
                </span>
              </div>
            </a>
          </div>

          {contacted && (
            <div className="locked-contact-confirmed">
              ✅ আপনার Contact Request পাঠানো হয়েছে। Support Team শীঘ্রই
              আপনার সাথে যোগাযোগ করবে।
            </div>
          )}

          {marking && (
            <div className="locked-contact-confirmed" style={{ opacity: 0.7 }}>
              ⏳ Request পাঠানো হচ্ছে...
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="locked-info-footer">
          <p className="locked-info-text">
            🔐 আপনার Account-এর নিরাপত্তার জন্য এই পদক্ষেপ নেওয়া হয়েছে
          </p>
        </div>

        {/* Logout Button */}
        <button
          className="locked-logout-btn"
          onClick={handleLogout}
        >
          🚪 লগআউট
        </button>

        {/* Footer */}
        <p className="locked-footer-text">
          © 2026 Color Match · Security Team
        </p>
      </div>
    </div>
  );
}
