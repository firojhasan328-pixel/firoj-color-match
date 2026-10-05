import React from "react";
import { signOut } from "../services/authService";
import "../styles/account-blocked.css";

export default function AccountBlockedModal({ info, onLogout }) {
  if (!info || !info.blocked) return null;

  const isSuspended = info.type === "suspended";

  async function handleLogout() {
    await signOut();
    if (onLogout) onLogout();
    window.location.href = "/login";
  }

  return (
    <div className="blocked-overlay">
      <div
        className={`blocked-card ${isSuspended ? "suspended" : "locked"}`}
      >
        <div className="blocked-icon-wrap">
          <div className="blocked-icon">
            {isSuspended ? "🚫" : "🔒"}
          </div>
        </div>

        <h2 className="blocked-title">{info.title}</h2>

        <p className="blocked-message">{info.message}</p>

        <div className="blocked-help-box">
          <p className="blocked-help-title">📞 সহায়তা প্রয়োজন?</p>
          <p className="blocked-help-text">{info.help}</p>
        </div>

        <div className="blocked-contact">
          <a
            href="https://wa.me/8801918568313"
            target="_blank"
            rel="noopener noreferrer"
            className="blocked-contact-btn whatsapp"
          >
            💬 WhatsApp
          </a>
          <a
            href="tel:01918568313"
            className="blocked-contact-btn call"
          >
            📞 Call Support
          </a>
        </div>

        <button className="blocked-logout-btn" onClick={handleLogout}>
          🚪 লগআউট করুন
        </button>

        <p className="blocked-footer-text">
          © 2026 Color Match · Support Team
        </p>
      </div>
    </div>
  );
}
