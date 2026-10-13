import { supabase } from "../lib/supabaseClient";
import {
  checkAccountLockStatus,
  logFailedLogin,
  logSuccessfulLogin,
} from "./securityService";

// ========================================
// LOGIN — Lock-aware
// ========================================
export async function signInWithEmail(email, password) {
  const cleanEmail = email.trim().toLowerCase();
  const startTime = Date.now();

  // ---------- STEP 1: Lock Status Check ----------
  const lockStatus = await checkAccountLockStatus(cleanEmail);

  if (lockStatus.locked) {
    // Lock or Permanent — throw with special structure
    const err = new Error(
      lockStatus.permanent
        ? "আপনার Account স্থায়ীভাবে বন্ধ করা হয়েছে। Support: 01918568313"
        : `আপনার Account সাময়িকভাবে লক করা হয়েছে। ${lockStatus.remaining_seconds ? "বাকি: " + Math.floor(lockStatus.remaining_seconds / 3600) + " ঘণ্টা" : ""}`
    );
    err.code = lockStatus.permanent ? "ACCOUNT_PERMANENT" : "ACCOUNT_LOCKED";
    err.lockInfo = lockStatus;
    throw err;
  }

  // ---------- STEP 2: Sign In ----------
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  const responseMs = Date.now() - startTime;

  // ---------- STEP 3: Handle Wrong Password ----------
  if (error) {
    const errMsg = (error.message || "").toLowerCase();

    // Wrong credentials হলে failed log
    if (
      errMsg.includes("invalid") ||
      errMsg.includes("credentials") ||
      errMsg.includes("password")
    ) {
      const failResult = await logFailedLogin(cleanEmail, responseMs);

      // Locked হলে special error throw
      if (failResult?.locked) {
        const lockErr = new Error(
          "অনেকবার ভুল Password দিয়েছেন। আপনার Account ৭২ ঘণ্টার জন্য লক করা হয়েছে।"
        );
        lockErr.code = "ACCOUNT_LOCKED";
        lockErr.lockInfo = {
          locked: true,
          tier: failResult.tier || 3,
          locked_until: failResult.locked_until,
          duration_hours: 72,
          user_id: lockStatus.user_id,
          full_name: lockStatus.full_name,
        };
        throw lockErr;
      }

      // Warning level
      const warnErr = new Error(
        failResult?.message || "ভুল Password"
      );
      warnErr.code = "WRONG_PASSWORD";
      warnErr.attemptInfo = failResult;
      throw warnErr;
    }

    // অন্য error
    throw error;
  }

  // ---------- STEP 4: Success Log ----------
  if (data?.user?.id) {
    await logSuccessfulLogin(cleanEmail, responseMs);
  }

  return data;
}

// ========================================
// Signup
// ========================================
export async function signUpWithEmail(name, email, password, extra = {}) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: name,
        mobile: extra.mobile || "",
        company: extra.company || "",
        designation: extra.designation || "",
        present_address: extra.present_address || "",
      },
    },
  });
  if (error) throw error;
  return data;
}

// ========================================
// Logout
// ========================================
export async function signOut() {
  await supabase.auth.signOut();
}