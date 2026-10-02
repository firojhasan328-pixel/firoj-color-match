import React, { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { supabase } from "../lib/supabaseClient";
import "../styles/otp.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("ইমেইল দিন।");
      return;
    }

    setLoading(true);
    try {
      const redirectUrl =
        window.location.origin + "/reset-password";

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: redirectUrl,
        });

      if (resetError) throw resetError;

      setSuccess(
        "✅ আপনার ইমেইলে পাসওয়ার্ড রিসেট করার লিংক পাঠানো হয়েছে। ইমেইল চেক করে লিংকে ক্লিক করুন।"
      );
      setEmail("");
    } catch (err) {
      console.error("Reset error:", err);
      const msg = (err?.message || "").toLowerCase();
      if (msg.includes("not found") || msg.includes("user")) {
        setError(
          "এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। সঠিক ইমেইল দিন।"
        );
      } else if (msg.includes("rate") || msg.includes("limit")) {
        setError(
          "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।"
        );
      } else {
        setError(
          "পাসওয়ার্ড রিসেট করা যায়নি: " +
            (err?.message || "অজানা সমস্যা")
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="otp-page">
        <div className="otp-icon-wrap">
          <div className="otp-icon">🔐</div>
        </div>

        <h2 className="auth-title">পাসওয়ার্ড রিসেট</h2>
        <p className="auth-sub">
          আপনার অ্যাকাউন্টের ইমেইল দিন। আমরা সেখানে পাসওয়ার্ড রিসেট করার
          একটি লিংক পাঠাব।
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label htmlFor="email">
              ইমেইল <span className="required-mark">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              placeholder="আপনার ইমেইল লিখুন"
              autoComplete="email"
            />
          </div>

          {error && <div className="error-box">{error}</div>}
          {success && <div className="success-box">{success}</div>}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner" />
            ) : (
              "📧 রিসেট লিংক পাঠান"
            )}
          </button>
        </form>

        <p className="switch-text">
          মনে পড়েছে? <Link to="/login">লগইন করুন</Link>
        </p>

        <div className="otp-footer-text" style={{ marginTop: "20px" }}>
          💡 ইমেইল না পেলে Spam Folder চেক করুন। লিংকটি ১ ঘণ্টার জন্য বৈধ।
        </div>
      </div>
    </AuthLayout>
  );
}
