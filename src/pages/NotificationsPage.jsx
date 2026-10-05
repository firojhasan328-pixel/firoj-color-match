import React, { useEffect, useState, useRef } from "react";
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
  const [selectedNotif, setSelectedNotif] = useState(null);

  // Real-time থামানোর জন্য Ref
  const realtimeChannelRef = useRef(null);
  const isMountedRef = useRef(true);

  async function loadData(showLoader = false) {
    if (showLoader) setLoading(true);
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

      if (isMountedRef.current) {
        setNotifications(list);
        setUnread(count);
      }
    } catch (err) {
      console.error("Notifications load error:", err);
    } finally {
      if (showLoader && isMountedRef.current) setLoading(false);
    }
  }

  // Initial Load
  useEffect(() => {
    isMountedRef.current = true;
    loadData(true);

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Real-time (শুধু নতুন Notification এলে Count Update)
  useEffect(() => {
    async function setupRealtime() {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;

      realtimeChannelRef.current = supabase
        .channel("notifications-page-rt")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // শুধু নতুন Insert হলে Count Update
            if (isMountedRef.current) {
              loadData(false);
            }
          }
        )
        .subscribe();
    }

    setupRealtime();

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, []);

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  // Notification Tap করলে
  async function handleItemClick(notif) {
    // ১। UI-তে সাথে সাথে Read Mark করি (Optimistic Update)
    if (!notif.is_read) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id ? { ...n, is_read: true } : n
        )
      );
      setUnread((u) => Math.max(0, u - 1));

      // ২। Database-এ Read Mark করি
      try {
        await markAsRead(notif.id);
      } catch (err) {
        console.error("Mark read error:", err);
      }
    }

    // ৩। Full Details Modal খুলি (Reload না)
    setSelectedNotif({ ...notif, is_read: true });
  }

  // Modal বন্ধ
  function handleCloseModal() {
    setSelectedNotif(null);
  }

  // Modal থেকে Link-এ যাওয়া
  function handleGoToLink() {
    if (selectedNotif?.link && selectedNotif.link.trim() !== "") {
      const link = selectedNotif.link;
      setSelectedNotif(null);
      navigate(link);
    }
  }

  async function handleMarkAllRead() {
    if (unread === 0) return;
    if (!confirm("সব Notification পড়া হিসেবে Mark করবেন?")) return;

    // Optimistic
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);

    try {
      await markAllAsRead();
    } catch (err) {
      console.error(err);
      loadData(false);
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!confirm("এই Notification টি ডিলিট করবেন?")) return;

    const wasUnread = !notifications.find((n) => n.id === id)?.is_read;

    // Optimistic
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnread((u) => Math.max(0, u - 1));

    try {
      await deleteNotification(id);
    } catch (err) {
      console.error(err);
      loadData(false);
    }
  }

  async function handleDeleteAll() {
    if (notifications.length === 0) return;
    if (
      !confirm(
        "⚠️ সব Notification ডিলিট করবেন?\n\nএটা Undo করা যাবে না!"
      )
    )
      return;

    // Optimistic
    setNotifications([]);
    setUnread(0);

    try {
      await deleteAllNotifications();
    } catch (err) {
      console.error(err);
      loadData(false);
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

  const selectedStyle = selectedNotif
    ? getNotificationStyle(selectedNotif.type)
    : null;

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
            <a href="/notifications" onClick={() => setMenuOpen(false)}>
              🔔 নোটিফিকেশন
            </a>
            <a href="/premium" onClick={() => setMenuOpen(false)}>
              💎 প্রিমিয়াম
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

      {/* ⭐ Full Details Modal */}
      {selectedNotif && (
        <div className="notif-modal-overlay" onClick={handleCloseModal}>
          <div
            className="notif-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="notif-modal-header">
              <div
                className="notif-modal-icon"
                style={{
                  background: selectedStyle?.bg,
                  color: selectedStyle?.color,
                }}
              >
                {selectedNotif.icon || selectedStyle?.icon}
              </div>
              <button
                className="notif-modal-close"
                onClick={handleCloseModal}
              >
                ✕
              </button>
            </div>

            <h2 className="notif-modal-title">{selectedNotif.title}</h2>

            <p className="notif-modal-time">
              🕐 {timeAgo(selectedNotif.created_at)}
            </p>

            <div className="notif-modal-body">
              <p className="notif-modal-message">{selectedNotif.message}</p>
            </div>

            <div className="notif-modal-actions">
              {selectedNotif.link && selectedNotif.link.trim() !== "" && (
                <button
                  className="notif-modal-btn primary"
                  onClick={handleGoToLink}
                >
                  🔗 এখানে যান
                </button>
              )}
              <button
                className="notif-modal-btn secondary"
                onClick={handleCloseModal}
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
