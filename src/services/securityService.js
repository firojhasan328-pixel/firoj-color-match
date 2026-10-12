import { supabase } from "../lib/supabaseClient";

// ========================================
// IP Address আন (Best Effort)
// ========================================
async function getClientIP() {
  try {
    const res = await fetch("https://api.ipify.org?format=json", {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();
    return data?.ip || "unknown";
  } catch {
    return "unknown";
  }
}

// ========================================
// User Agent আন
// ========================================
function getUserAgent() {
  return navigator?.userAgent?.slice(0, 300) || "unknown";
}

// ========================================
// Account Lock Status Check
// ========================================
export async function checkAccountLockStatus(email) {
  try {
    const { data, error } = await supabase.rpc(
      "check_account_lock_status",
      { p_email: email.trim().toLowerCase() }
    );

    if (error) {
      console.error("Lock check error:", error);
      return { found: false, locked: false, error: error.message };
    }

    return data || { found: false, locked: false };
  } catch (err) {
    console.error("Lock check exception:", err);
    return { found: false, locked: false, error: err.message };
  }
}

// ========================================
// Failed Login Log
// ========================================
export async function logFailedLogin(email, responseMs = 0) {
  try {
    const ip = await getClientIP();
    const ua = getUserAgent();

    const { data, error } = await supabase.rpc("log_failed_login", {
      p_email: email.trim().toLowerCase(),
      p_ip: ip,
      p_user_agent: ua,
      p_response_ms: responseMs,
    });

    if (error) {
      console.error("Log failed login error:", error);
      return { locked: false, error: error.message };
    }

    return data || { locked: false };
  } catch (err) {
    console.error("Log failed exception:", err);
    return { locked: false, error: err.message };
  }
}

// ========================================
// Successful Login Log
// ========================================
export async function logSuccessfulLogin(email, responseMs = 0) {
  try {
    const ip = await getClientIP();
    const ua = getUserAgent();

    const { error } = await supabase.rpc("log_successful_login", {
      p_email: email.trim().toLowerCase(),
      p_ip: ip,
      p_user_agent: ua,
      p_response_ms: responseMs,
    });

    if (error) {
      console.error("Log success login error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Log success exception:", err);
    return false;
  }
}

// ========================================
// Contact Support Mark
// ========================================
export async function markContactRequested(userId) {
  try {
    const { data, error } = await supabase.rpc("mark_contact_requested", {
      p_user_id: userId,
    });

    if (error) throw error;
    return data?.success || false;
  } catch (err) {
    console.error("Mark contact error:", err);
    return false;
  }
}

// ========================================
// Remaining Time Format
// ========================================
export function formatRemainingTime(seconds) {
  if (!seconds || seconds <= 0) return "০";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) return `${hours} ঘণ্টা ${minutes} মিনিট`;
  if (minutes > 0) return `${minutes} মিনিট ${secs} সেকেন্ড`;
  return `${secs} সেকেন্ড`;
}

// ========================================
// Suspicious Activity Detect (Behavior)
// ========================================
const BEHAVIOR_KEY = "cm_login_behavior";

export function trackLoginBehavior(action) {
  try {
    const now = Date.now();
    let data = JSON.parse(sessionStorage.getItem(BEHAVIOR_KEY) || "{}");

    if (!data.attempts) data.attempts = [];
    if (!data.clicks) data.clicks = [];

    if (action === "attempt") {
      data.attempts.push(now);
      // Only keep last 60 seconds
      data.attempts = data.attempts.filter((t) => now - t < 60000);
    } else if (action === "click") {
      data.clicks.push(now);
      // Only keep last 10 seconds
      data.clicks = data.clicks.filter((t) => now - t < 10000);
    }

    sessionStorage.setItem(BEHAVIOR_KEY, JSON.stringify(data));

    // Suspicious detection
    const recentAttempts = data.attempts.length;
    const recentClicks = data.clicks.length;

    return {
      suspicious: recentAttempts > 8 || recentClicks > 15,
      attempts: recentAttempts,
      clicks: recentClicks,
    };
  } catch {
    return { suspicious: false, attempts: 0, clicks: 0 };
  }
}

export function resetLoginBehavior() {
  try {
    sessionStorage.removeItem(BEHAVIOR_KEY);
  } catch {}
}
