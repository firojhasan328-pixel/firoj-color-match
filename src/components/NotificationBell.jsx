import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  getUnreadCount,
  subscribeToNotifCount,
} from "../services/notificationService";

export default function NotificationBell() {
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  // Count Refresh Function
  async function refresh() {
    const count = await getUnreadCount();
    setUnread(count);
  }

  // Initial Load
  useEffect(() => {
    refresh();
  }, []);

  // Subscribe to Global Event (যেকোনো Read/Delete হলে Fire হবে)
  useEffect(() => {
    const unsubscribe = subscribeToNotifCount(() => {
      refresh();
    });
    return () => unsubscribe();
  }, []);

  // Real-time Subscription (নতুন Notification এলে)
  useEffect(() => {
    let channel;

    async function setupRealtime() {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      channel = supabase
        .channel("notif-bell-count")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            refresh();
          }
        )
        .subscribe();
    }

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <button
      className="notif-bell-btn"
      onClick={() => navigate("/notifications")}
      aria-label="নোটিফিকেশন"
    >
      🔔
      {unread > 0 && (
        <span className="notif-bell-badge">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
}
