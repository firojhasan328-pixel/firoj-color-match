import OneSignal from "react-onesignal";
import { supabase } from "../lib/supabaseClient";

// ========================================
// OneSignal App ID
// ========================================
export const ONESIGNAL_APP_ID = "a49eb448-6c04-4734-bc30-2b4d70da8a6e";

// ========================================
// OneSignal Initialize
// ========================================
export async function initializeOneSignal() {
  try {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      notifyButton: {
        enable: false, // আমরা নিজেদের Bell Icon ব্যবহার করব
      },
    });

    console.log("✅ OneSignal initialized");
    return true;
  } catch (err) {
    console.error("OneSignal init error:", err);
    return false;
  }
}

// ========================================
// Notification Permission চাওয়া
// ========================================
export async function askNotificationPermission() {
  try {
    const permission = await OneSignal.Notifications.requestPermission();
    return permission;
  } catch (err) {
    console.error("Permission request error:", err);
    return false;
  }
}

// ========================================
// Permission Status
// ========================================
export function isNotificationEnabled() {
  try {
    return OneSignal.Notifications.permission;
  } catch (err) {
    return false;
  }
}

// ========================================
// User-কে OneSignal-এ Link করা
// ========================================
export async function linkUserToOneSignal(userId) {
  try {
    await OneSignal.login(userId);
    console.log("✅ OneSignal user linked:", userId);
    return true;
  } catch (err) {
    console.error("OneSignal login error:", err);
    return false;
  }
}

// ========================================
// Unlink User (Logout-এর সময়)
// ========================================
export async function unlinkUserFromOneSignal() {
  try {
    await OneSignal.logout();
    console.log("✅ OneSignal user unlinked");
    return true;
  } catch (err) {
    console.error("OneSignal logout error:", err);
    return false;
  }
}

// ========================================
// Current Subscription ID
// ========================================
export function getSubscriptionId() {
  try {
    return OneSignal.User.PushSubscription.id;
  } catch (err) {
    return null;
  }
}

// ========================================
// Subscription ID Save to Supabase
// ========================================
export async function saveSubscriptionIdToSupabase(userId) {
  try {
    const subscriptionId = getSubscriptionId();
    if (!subscriptionId || !userId) return false;

    const { error } = await supabase
      .from("profiles")
      .update({
        onesignal_id: subscriptionId,
      })
      .eq("id", userId);

    if (error) {
      console.error("Save subscription ID error:", error);
      return false;
    }

    console.log("✅ Subscription ID saved:", subscriptionId);
    return true;
  } catch (err) {
    console.error("Save subscription error:", err);
    return false;
  }
}

// ========================================
// Auto Permission Prompt (Login-এর পরে)
// ========================================
export async function autoPromptPermission(userId) {
  try {
    // Permission চেক করি
    const hasPermission = isNotificationEnabled();

    if (!hasPermission) {
      // Permission চাই
      await askNotificationPermission();
    }

    // User Link
    if (userId) {
      await linkUserToOneSignal(userId);
      await saveSubscriptionIdToSupabase(userId);
    }

    return true;
  } catch (err) {
    console.error("Auto prompt error:", err);
    return false;
  }
}
