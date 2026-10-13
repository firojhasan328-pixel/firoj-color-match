import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import PasswordInput from "../components/PasswordInput";
import AccountLockedModal from "../components/AccountLockedModal";
import { signInWithEmail } from "../services/authService";
import { autoPromptPermission } from "../services/onesignal";
import {
  checkAccountLockStatus,
  trackLoginBehavior,
  resetLoginBehavior,
} from "../services/securityService";
import "../styles/otp.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [lockInfo, setLockInfo] = useState(null);

  // ========================================
  // Track Clicks (Bot Detection)
  // ========================================
  useEffect(() => {
    function handleClick() {
      const behavior = trackLoginBehavior("click");
      if (behavior.suspicious) {
        console.warn("⚠️ Suspicious activity detected");
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // ========================================
  // Handle Login
  // ========================================
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setWarning("");

    if (!email.trim()) {
      setError("ইমেইল দিন।");
      return;
    }
    if (!password) {
      setError("পাসওয়ার্ড দিন।");
      return;
    }

    // Track attempt
    const behavior = trackLoginBehavior("attempt");
    if (behavior.suspicious) {
      console.warn("⚠️ Too many attempts detected");
    }

    setLoading(true);
    try {
      const data = await signInWithEmail(email.trim(), password);

      // Reset behavior on success
      resetLoginBehavior();

      // OneSignal setup
      if (data?.user?.id) {
        try {
          await autoPromptPermission(data.user.id);
        } catch (err) {
          console.error("OneSignal setup error:", err);
        }
      }

      navigate("/home");
    } catch (err) {
      console.error("Login error:", err);

      // ========================================
      // Handle Lock
      // ========================================
      if (err.code === "ACCOUNT_LOCKED") {
        setLockInfo(err.lockInfo);
        setLoading(false);
        return;
      }

      // ========================================
      // Handle Permanent
      // ========================================
      if (err.code === "ACCOUNT_PERMANENT") {
        setLockInfo({
          locked: true,
          permanent: true,
          tier: 4,
          user_id: err.lockInfo?.user_id,
          full_name: err.lockInfo?.full_name,
        });
        setLoading(false);
        return;
      }

      // ========================================
      // Handle Wrong Password + Warning
      // ========================================
      if (err.code === "WRONG_PASSWORD") {
        const attempt = err.attemptInfo || {};
        const count = attempt.attempt_count || 0;
        const remaining = attempt.remaining_attempts ?? 5 - count;

        if (attempt.show_warning) {
          setWarning(
            attempt.message ||
              `⚠️ সতর্কতা! আর ${remaining} বার ভুল করলে Account লক হয়ে যাবে।`
          );
        } else {
          setError(
            remaining > 0
              ? `ভুল Password। আরও ${remaining} বার চেষ্টা করতে পারবেন।`
              : "ভুল Password।"
          );
        }
      } else {
        // Generic error
        const msg = err.message || "";
        if (
          msg.toLowerCase().includes("invalid") ||
          msg.toLowerCase().includes("credentials")
        ) {
          setError("ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।");
        } else {
          setError(msg || "Login ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // Check Lock on Email Blur (pre-check)
  // ========================================
  async function handleEmailBlur() {
    if (!email.trim() || email.length < 5) return;

    try {
      const status = await checkAccountLockStatus(email.trim());
      if (status.locked) {
        setLockInfo({
          locked: true,
          permanent: status.permanent,
          tier: status.tier,
          locked_until: status.locked_until,
          remaining_seconds: status.remaining_seconds,
          user_id: status.user_id,
          full_name: status.full_name,
        });
      }
    } catch (err) {
      // Silently fail — not critical
    }
  }

  return (
    <AuthLayout>
      <h2 className="auth-title">লগইন করুন</h2>
      <p className="auth-sub">
        আপনার অ্যাকাউন্টে প্রবেশ করতে আপনার তথ্য দিন।
      </p>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="field">
          <label htmlFor="email">ইমেইল</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
              if (warning) setWarning("");
            }}
            onBlur={handleEmailBlur}
            placeholder="আপনার ইমেইল লিখুন"
            autoComplete="email"
            disabled={loading}
          />
        </div>

        <PasswordInput
          id="password"
          label="পাসওয়ার্ড"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError("");
            if (warning) setWarning("");
          }}
          placeholder="আপনার পাসওয়ার্ড লিখুন"
        />

        <div className="forgot-row">
          <Link to="/forgot-password" className="forgot-link">
            🔑 পাসওয়ার্ড ভুলে গেছেন?
          </Link>
        </div>

        {/* Warning Box (Before Lock) */}
        {warning && (
          <div className="login-warning-box">
            <span className="login-warning-icon">⚠️</span>
            <span className="login-warning-text">{warning}</span>
          </div>
        )}

        {/* Error Box */}
        {error && <div className="error-box">{error}</div>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : "লগইন করুন"}
        </button>
      </form>

      <p className="switch-text">
        অ্যাকাউন্ট নেই? <Link to="/signup">অ্যাকাউন্ট তৈরি করুন</Link>
      </p>

      {/* Security Notice */}
      <div className="login-security-notice">
        🔐 আপনার Account নিরাপত্তার জন্য সুরক্ষিত
      </div>

      {/* Lock Modal */}
      {lockInfo && (
        <AccountLockedModal
          lockInfo={lockInfo}
          onClose={() => setLockInfo(null)}
        />
      )}
    </AuthLayout>
  );
}
