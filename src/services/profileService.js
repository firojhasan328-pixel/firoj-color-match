import { supabase } from "../lib/supabaseClient";

export async function getMyProfile() {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      const newCode = await generateUserCode();
      const meta = user.user_metadata || {};

      const { data: created, error: createErr } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          user_code: newCode,
          full_name:
            meta.full_name || user.email?.split("@")[0] || "User",
          email: user.email,
          mobile: meta.mobile || "",
          company: meta.company || "",
          designation: meta.designation || "",
          present_address: meta.present_address || "",
          status: "active",
        })
        .select()
        .single();

      if (createErr) throw createErr;
      return created;
    }
    throw error;
  }

  return data;
}

async function generateUserCode() {
  const random = Math.floor(Math.random() * 900000) + 100000;
  return "CM" + random;
}

// ========================================
// Account Status Check
// ========================================
export function checkAccountStatus(profile) {
  if (!profile) return { blocked: false };

  const status = profile.status || "active";
  const reason = profile.lock_reason || "";

  if (status === "suspended") {
    return {
      blocked: true,
      type: "suspended",
      title: "আপনার অ্যাকাউন্ট সাসপেন্ড করা হয়েছে",
      message: reason
        ? `কারণ: ${reason}`
        : "নিয়ম ভঙ্গের কারণে আপনার অ্যাকাউন্ট সাসপেন্ড করা হয়েছে।",
      help: "বিস্তারিত জানতে বা অ্যাকাউন্ট সচল করতে লাইভ চ্যাটে অথবা Support Team-এর সাথে যোগাযোগ করুন।",
    };
  }

  if (status === "locked") {
    return {
      blocked: true,
      type: "locked",
      title: "আপনার অ্যাকাউন্ট লক করা হয়েছে",
      message: reason
        ? `কারণ: ${reason}`
        : "সন্দেহজনক কার্যকলাপের কারণে আপনার অ্যাকাউন্ট লক করা হয়েছে।",
      help: "বিস্তারিত জানতে বা অ্যাকাউন্ট সচল করতে লাইভ চ্যাটে অথবা Support Team-এর সাথে যোগাযোগ করুন।",
    };
  }

  return { blocked: false };
}

// ========================================
// ⭐ Premium Status Check
// ========================================
export function checkPremiumStatus(profile) {
  if (!profile?.is_premium) {
    return { isPremium: false, expiresAt: null, daysLeft: 0 };
  }

  let expiresAt = profile.premium_expires_at;
  let isPremium = true;

  // Expire Check
  if (expiresAt) {
    const exp = new Date(expiresAt);
    const now = new Date();
    if (exp < now) {
      isPremium = false;
    }
  }

  // Days Left
  let daysLeft = 0;
  if (expiresAt && isPremium) {
    const exp = new Date(expiresAt);
    const now = new Date();
    daysLeft = Math.max(
      0,
      Math.ceil((exp - now) / (1000 * 60 * 60 * 24))
    );
  }

  return {
    isPremium,
    expiresAt,
    daysLeft,
  };
}

// ========================================
// Format Premium Date
// ========================================
export function formatPremiumExpiry(expiresAt) {
  if (!expiresAt) return "—";
  return new Date(expiresAt).toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
