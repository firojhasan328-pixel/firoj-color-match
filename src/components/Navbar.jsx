import React, { useState } from "react";

export default function Navbar({ userName = "User", onMenuClick }) {
  const [notifOpen, setNotifOpen] = useState(false);

  // নোটিফিকেশন ডেটা — পরে Supabase থেকে আসবে
  const notifications = [
    { id: 1, text: "Color Match-এ আপনাকে স্বাগতম!", time: "এইমাত্র" },
  ];

  return (
    <>
      <nav className="navbar">
        {/* বাম: মেনু বাটন */}
        <button
          className="nav-btn"
          onClick={onMenuClick}
          aria-label="মেনু খুলুন"
        >
          ☰
        </button>

        {/* মাঝ: স্বাগতম মেসেজ */}
        <div className="nav-welcome">
          <div className="hello">স্বাগতম</div>
          <div className="name">{userName}</div>
        </div>

        {/* ডান: নোটিফিকেশন বাটন */}
        <button
          className="nav-btn"
          onClick={() => setNotifOpen((s) => !s)}
          aria-label="নোটিফিকেশন"
        >
          🔔
          {notifications.length > 0 && (
            <span className="badge">{notifications.length}</span>
          )}
        </button>
      </nav>

      {/* নোটিফিকেশন প্যানেল */}
      {notifOpen && (
        <div className="notif-panel">
          <h4 className="notif-title">নোটিফিকেশন</h4>
          {notifications.length === 0 ? (
            <p className="notif-empty">কোনো নোটিফিকেশন নেই</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="notif-item">
                <p>{n.text}</p>
                <span>{n.time}</span>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
