import { supabase } from "../lib/supabaseClient";

// ========================================
// Adsterra Direct Link
// ========================================
export const ADSTERRA_LINK =
  "https://asiafilm.org/4/61d9c134b4dde93576e9b6f21dab89b8";

// ========================================
// Ad Countdown Time (Seconds)
// ========================================
export const AD_COUNTDOWN = 30;

// ========================================
// Ad Unlock Log Save
// ========================================
export async function logAdUnlock(userId, colorId, countdownSeconds) {
  try {
    await supabase.from("ad_unlock_logs").insert({
      user_id: userId,
      color_id: colorId,
      countdown_seconds: countdownSeconds,
    });
  } catch (err) {
    console.error("Ad log error:", err);
  }
}

// ========================================
// Ad Link Open (New Tab)
// ========================================
export function openAdLink() {
  window.open(ADSTERRA_LINK, "_blank", "noopener,noreferrer");
}
