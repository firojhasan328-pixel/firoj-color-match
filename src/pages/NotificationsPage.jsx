import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabaseClient";
import { getMyProfile } from "../services/profileService";
import { getMyBalance } from "../services/walletService";
import { signOut } from "../services/authService";
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  timeAgo,
  getNotificationStyle,
} from "../services/notificationService";
import "../styles/home.css";
import "../styles/notifications.css";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");
  const [balance, setBalance] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) {
        navigate("/login");
        return;
      }

      const profile = await getMyProfile();
      if (profile?.full_name) setUserName(profile.full_name);

      const bal = await getMyBalance();
      setBalance(bal);

      const [list, count] = await Promise.all([
        getMyNotifications(100),
        getUnreadCount(),
      ]);
      setNotifications(list);
      setUnread(count);
    } catch (err) {
      console.error("Notifications load error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [navigate]);

  // Real-time
  useEffect(() => {
    let channel;

    async function setupRealtime() {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;

      channel = supabase
        .channel("notifications-page-rt")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadData();
          }
        )
        .subscribe();
    }

    setupRealtime();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  async function handleMarkRead(id) {
    if (notifications.find((n) => n.id === id)?.is_read) return;
    await markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnread((u) => Math.max(0, u - 1));
  }

  async function handleMarkAllRead() {
    if (unread === 0) return;
    if (!confirm("সব Notification পড়া হিসেবে Mark করবেন?")) return;

    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!confirm("এই Notification টি ডিলিট করবেন?")) return;

    const wasUnread = !notifications.find((n) => n.id === id)?.is_read;
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnread((u) => Math.max(0, u - 1));
  }

  async function handleDeleteAll() {
    if (notifications.length === 0) return;
    if (
      !confirm(
        "⚠️ সব Notification ডিলিট করবেন?\n\nএটা Undo করা যাবে না!"
      )
    )
      return;

    await deleteAllNotifications();
    setNotifications([]);
    setUnread(0);
  }

  function handleItemClick(notif) {
    handleMarkRead(notif.id);
    if (notif.link && notif.link.trim() !== "") {
      navigate(notif.link);
    }
  }

  const filteredNotifications =
    filter === "all"
      ? notifications
      : filter === "unread"
      ? notifications.filter((n) => !n.is_read)
      : filter === "premium"
      ? notifications.filter((n) => n.type === "premium")
      : filter === "withdraw"
      ? notifications.filter((n) => n.type === "withdraw")
      : notifications;

  const FILTERS = [
    { id: "all", label: "সব", icon: "📋" },
    { id: "unread", label: "Unread", icon: "🔵" },
    { id: "premium", label: "Premium", icon: "👑" },
    { id: "withdraw", label: "Withdraw", icon: "💰" },
  ];

  return (
    <div className="home-page">
      <Navbar
        userName={userName}
        balance={balance}
        onMenuClick={() => setMenuOpen(true)}
        onBalanceClick={() => navigate("/balance")}
      />

      {menuOpen && (
        <>
          <div
            className="side-overlay"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="side-menu">
            <button
              className="side-close"
              onClick={() => setMenuOpen(false)}
              aria-label="বন্ধ করুন"
            >
              ✕
            </button>
            <h3>Color Match</h3>
            <a href="/home" onClick={() => setMenuOpen(false)}>
              🏠 হোম
            </a>
            <a href="/home" onClick={() => setMenuOpen(false)}>
              🎨 কালার ম্যাচিং
            </a>
            <a href="/balance" onClick={() => setMenuOpen(false)}>
              💰 ব্যালেন্স
            </a>
            <a href="/premium" onClick={() => setMenuOpen(false)}>
              💎 প্রিমিয়াম
            </a>
            <a href="/notifications" onClick={() => setMenuOpen(false)}>
              🔔 নোটিফিকেশন
            </a>
            <a href="/profile" onClick={() => setMenuOpen(false)}>
              👤 প্রোফাইল
            </a>
            <button onClick={handleLogout}>🚪 লগআউট</button>
          </aside>
        </>
      )}

      <div className="notif-page">
        <button className="back-btn" onClick={() => navigate("/home")}>
          ← ফিরে যান
        </button>

        {/* Header */}
        <div className="notif-header">
          <div className="notif-header-left">
            <h1 className="notif-header-title">
              🔔 নোটিফিকেশন
              {unread > 0 && (
                <span className="notif-unread-count">{unread}</span>
              )}
            </h1>
          </div>

          <div className="notif-header-actions">
            {unread > 0 && (
              <button
                className="notif-action-btn"
                onClick={handleMarkAllRead}
              >
                ✅ সব পড়া
              </button>
            )}
            {notifications.length > 0 && (
              <button
                className="notif-action-btn danger"
                onClick={handleDeleteAll}
              >
                🗑️ সব ডিলিট
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        {notifications.length > 0 && (
          <div className="notif-tabs">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                className={`notif-tab ${
                  filter === f.id ? "active" : ""
                }`}
                onClick={() => setFilter(f.id)}
              >
                <span>{f.icon}</span>
                <span>{f.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="notif-loading">
            <div className="admin-spinner-large" />
            <p className="notif-loading-text">লোড হচ্ছে...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="notif-empty">
            <div className="notif-empty-icon">📭</div>
            <h3 className="notif-empty-title">
              {filter === "all"
                ? "এখনো কোনো Notification নেই"
                : filter === "unread"
                ? "সব Notification পড়া হয়েছে ✅"
                : "এই Category-তে কোনো Notification নেই"}
            </h3>
            <p className="notif-empty-text">
              {filter === "all"
                ? "নতুন Notification এলে এখানে দেখা যাবে"
                : "অন্য Category চেক করুন"}
            </p>
          </div>
        ) : (
          <div className="notif-list">
            {filteredNotifications.map((n) => {
              const style = getNotificationStyle(n.type);
              return (
                <div
                  key={n.id}
                  className={`notif-item ${!n.is_read ? "unread" : ""}`}
                  onClick={() => handleItemClick(n)}
                >
                  <div
                    className="notif-icon"
                    style={{
                      background: style.bg,
                      color: style.color,
                    }}
                  >
                    {n.icon || style.icon}
                  </div>

                  <div className="notif-content">
                    <div className="notif-title">
                      {n.title}
                      {!n.is_read && (
                        <span className="notif-title-unread-dot" />
                      )}
                    </div>
                    <p className="notif-message">{n.message}</p>
                    <div className="notif-time">
                      <span className="notif-time-icon">🕐</span>
                      {timeAgo(n.created_at)}
                    </div>
                  </div>

                  <button
                    className="notif-delete"
                    onClick={(e) => handleDelete(n.id, e)}
                    aria-label="ডিলিট"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
