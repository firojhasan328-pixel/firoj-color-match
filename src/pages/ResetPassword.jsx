import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import PasswordInput from "../components/PasswordInput";
import { supabase } from "../lib/supabaseClient";
import "../styles/otp.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validSession, setValidSession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        // URL Hash থেকে Session আসতে সময় দিতে হবে
        await new Promise((r) => setTimeout(r, 1500));

        const { data, error } = await supabase.auth.getSession();

        if (error || !data?.session) {
          setError(
            "❌ পাসওয়ার্ড রিসেট লিংকটি বৈধ নয় বা মেয়াদ শেষ হয়ে গেছে। আবার চেষ্টা করুন।"
          );
          setValidSession(false);
        } else {
          setValidSession(true);
        }
      } catch (err) {
        console.error("Session check error:", err);
        setError("লিংক যাচাই করা যায়নি।");
        setValidSession(false);
      } finally {
        setChecking(false);
      }
    }
    checkSession();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password || password.length < 6) {
      setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return;
    }
    if (password !== confirm) {
      setError("পাসওয়ার্ড দুটি একই নয়।");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess(
        "✅ পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে! Login Page-এ নিয়ে যাওয়া হচ্ছে..."
      );

      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("Update error:", err);
      setError(
        "পাসওয়ার্ড পরিবর্তন করা যায়নি: " +
          (err?.message || "অজানা সমস্যা")
      );
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <AuthLayout>
        <div className="otp-page">
          <div className="details-loading">
            <span className="pulse" />
            লিংক যাচাই করা হচ্ছে...
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (!validSession) {
    return (
      <AuthLayout>
        <div className="otp-page">
          <div className="otp-icon-wrap">
            <div
              className="otp-icon"
              style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
              }}
            >
              ⚠️
            </div>
          </div>

          <h2 className="auth-title">লিংকটি বৈধ নয়</h2>
          <p className="auth-sub">
            পাসওয়ার্ড রিসেট লিংকটি মেয়াদ শেষ হয়ে গেছে অথবা ইতিমধ্যে
            ব্যবহার করা হয়েছে।
          </p>

          {error && <div className="error-box">{error}</div>}

          <Link
            to="/forgot-password"
            style={{ width: "100%", textDecoration: "none" }}
          >
            <button
              className="btn-primary"
              style={{ width: "100%", marginTop: "16px" }}
            >
              🔄 আবার চেষ্টা করুন
            </button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="otp-page">
        <div className="otp-icon-wrap">
          <div className="otp-icon">🔑</div>
        </div>

        <h2 className="auth-title">নতুন পাসওয়ার্ড দিন</h2>
        <p className="auth-sub">
          আপনার অ্যাকাউন্টের জন্য একটি নতুন এবং নিরাপদ পাসওয়ার্ড দিন।
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <PasswordInput
            id="password"
            label="নতুন পাসওয়ার্ড"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            placeholder="নতুন পাসওয়ার্ড লিখুন"
          />

          <PasswordInput
            id="confirm"
            label="পাসওয়ার্ড নিশ্চিত করুন"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (error) setError("");
            }}
            placeholder="পাসওয়ার্ড আবার লিখুন"
          />

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
              "✅ পাসওয়ার্ড পরিবর্তন করুন"
            )}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
