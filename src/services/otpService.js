import { supabase } from "../lib/supabaseClient";

// ========================================
// ৬ সংখ্যার Random OTP তৈরি
// ========================================
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ========================================
// OTP Database-এ Save (৫ মিনিট Expire)
// ========================================
export async function saveOTP(email, otpCode, userData) {
  // পুরনো OTP Delete (একই Email-এর)
  await supabase
    .from("otp_verifications")
    .delete()
    .eq("email", email)
    .eq("verified", false);

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // ৫ মিনিট

  const { data, error } = await supabase
    .from("otp_verifications")
    .insert({
      email: email,
      otp_code: otpCode,
      user_data: userData,
      expires_at: expiresAt.toISOString(),
      verified: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ========================================
// OTP Verify করা
// ========================================
export async function verifyOTP(email, enteredCode) {
  const { data, error } = await supabase
    .from("otp_verifications")
    .select("*")
    .eq("email", email)
    .eq("verified", false)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) {
    return {
      success: false,
      reason: "no_otp",
      message: "কোনো OTP পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।",
    };
  }

  const record = data[0];

  // Expire Check
  const now = new Date();
  const expires = new Date(record.expires_at);
  if (now > expires) {
    return {
      success: false,
      reason: "expired",
      message: "কোডের সময় শেষ হয়ে গেছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
    };
  }

  // Code Match Check
  if (record.otp_code !== enteredCode) {
    return {
      success: false,
      reason: "wrong_code",
      message:
        "আপনার কোডটি সঠিক নয়। অনুগ্রহ করে সঠিক কোড প্রদান করুন।",
    };
  }

  // Verified Mark
  await supabase
    .from("otp_verifications")
    .update({ verified: true })
    .eq("id", record.id);

  return {
    success: true,
    userData: record.user_data,
    message: "OTP সফলভাবে যাচাই হয়েছে!",
  };
}

// ========================================
// Countdown Timer Helpers
// ========================================
export function getRemainingTime(createdAt) {
  const created = new Date(createdAt);
  const expires = new Date(created.getTime() + 5 * 60 * 1000);
  const now = new Date();
  const remaining = Math.max(0, Math.floor((expires - now) / 1000));
  return remaining; // Seconds
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
