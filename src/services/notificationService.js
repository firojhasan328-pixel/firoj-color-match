import { supabase } from "../lib/supabaseClient";

// ========================================
// নিজের সব Notification আনা
// ========================================
export async function getMyNotifications(limit = 100) {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Notifications load error:", error);
    return [];
  }
  return data || [];
}

// ========================================
// Unread Count
// ========================================
export async function getUnreadCount() {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Unread count error:", error);
    return 0;
  }
  return count || 0;
}

// ========================================
// একটি Notification Read Mark করা
// ========================================
export async function markAsRead(notificationId) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) {
    console.error("Mark read error:", error);
    return false;
  }
  return true;
}

// ========================================
// সব Notification Read Mark করা
// ========================================
export async function markAllAsRead() {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) return false;

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Mark all read error:", error);
    return false;
  }
  return true;
}

// ========================================
// একটি Notification Delete
// ========================================
export async function deleteNotification(notificationId) {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) {
    console.error("Delete notification error:", error);
    return false;
  }
  return true;
}

// ========================================
// সব Notification Delete
// ========================================
export async function deleteAllNotifications() {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) return false;

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.error("Delete all error:", error);
    return false;
  }
  return true;
}

// ========================================
// Format Time Ago
// ========================================
export function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;

  if (diff < 60000) return "এইমাত্র";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} মিনিট আগে`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ঘণ্টা আগে`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} দিন আগে`;

  return d.toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ========================================
// Notification Type Icon & Color
// ========================================
export function getNotificationStyle(type) {
  const styles = {
    premium: { icon: "👑", color: "#f59e0b", bg: "#fef3c7" },
    withdraw: { icon: "💰", color: "#10b981", bg: "#ecfdf5" },
    system: { icon: "⚙️", color: "#64748b", bg: "#f1f5f9" },
    admin: { icon: "📢", color: "#a855f7", bg: "#faf5ff" },
    test: { icon: "✅", color: "#0ea5e9", bg: "#f0f9ff" },
  };
  return (
    styles[type] || { icon: "🔔", color: "#0ea5e9", bg: "#f0f9ff" }
  );
}
