import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { supabase } from "../lib/supabaseClient";
import { verifyOTP, formatTime } from "../services/otpService";
import { signInWithEmail } from "../services/authService";
import "../styles/otp.css";

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, name } = location.state || {};

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes = 300 seconds
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expired, setExpired] = useState(false);

  const inputRefs = useRef([]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate("/signup");
    }
  }, [email, navigate]);

  // Countdown Timer
  useEffect(() => {
    if (expired) return;
    if (timeLeft <= 0) {
      setExpired(true);
      setError(
        "কোডের সময় শেষ হয়ে গেছে। অনুগ্রহ করে আবার সাইনআপ করুন।"
      );
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, expired]);

  // Auto Focus First Input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Handle OTP Digit Input
  function handleChange(index, value) {
    if (expired) return;
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (error) setError("");

    // Auto focus next
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  // Handle Backspace
  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  // Handle Paste
  function handlePaste(e) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (pastedData.length >= 6) {
      const newOtp = pastedData.slice(0, 6).split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  }

  async function handleVerify() {
    setError("");
    setSuccess("");

    if (expired) {
      setError("কোডের সময় শেষ। অনুগ্রহ করে আবার সাইনআপ করুন।");
      return;
    }

    const enteredCode = otp.join("");
    if (enteredCode.length !== 6) {
      setError("৬ সংখ্যার সম্পূর্ণ কোড দিন।");
      return;
    }

    setLoading(true);
    try {
      // ১। OTP Verify
      const result = await verifyOTP(email, enteredCode);

      if (!result.success) {
        setError(result.message);
        // Wrong code হলে Input Clear
        if (result.reason === "wrong_code") {
          setOtp(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        }
        if (result.reason === "expired") {
          setExpired(true);
        }
        return;
      }

      // ২। Verified — এখন আসল Account তৈরি
      const userData = result.userData;
      setSuccess("✅ কোড যাচাই সফল! Account তৈরি হচ্ছে...");

      const { data, error: signupError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.name,
            mobile: userData.mobile,
            company: userData.company,
            designation: userData.designation,
            present_address: userData.present_address,
          },
        },
      });

      if (signupError) throw signupError;

      // ৩। Profile Update
      if (data?.user?.id) {
        await new Promise((r) => setTimeout(r, 800));
        await supabase
          .from("profiles")
          .update({
            mobile: userData.mobile,
            company: userData.company,
            designation: userData.designation,
            present_address: userData.present_address,
          })
          .eq("id", data.user.id);
      }

      // ৪। Auto Login
      if (data?.session) {
        navigate("/home");
      } else {
        // Email Confirmation চালু থাকলে
        try {
          await signInWithEmail(userData.email, userData.password);
          navigate("/home");
        } catch {
          setSuccess(
            "✅ অ্যাকাউন্ট তৈরি হয়েছে! এখন Login করুন।"
          );
          setTimeout(() => navigate("/login"), 2000);
        }
      }
    } catch (err) {
      console.error("Verify error:", err);
      setError(
        "যাচাই করা যায়নি: " + (err?.message || "অজানা সমস্যা")
      );
    } finally {
      setLoading(false);
    }
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft <= 60;

  return (
    <AuthLayout>
      <div className="otp-page">
        <div className="otp-icon-wrap">
          <div className="otp-icon">📧</div>
        </div>

        <h2 className="auth-title">ইমেইল ভেরিফিকেশন</h2>
        <p className="auth-sub">
          আপনার ইমেইলে ৬ সংখ্যার একটি কোড পাঠানো হয়েছে
          <br />
          <strong className="otp-email">{email}</strong>
        </p>

        {/* Timer */}
        <div
          className={`otp-timer ${isUrgent ? "urgent" : ""} ${
            expired ? "expired" : ""
          }`}
        >
          {expired ? (
            <span>⏱️ সময় শেষ</span>
          ) : (
            <>
              <span className="otp-timer-label">⏱️ বাকি সময়:</span>
              <span className="otp-timer-value">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </span>
            </>
          )}
        </div>

        {/* OTP Input Boxes */}
        <div className="otp-input-wrap" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              className={`otp-input ${error ? "error" : ""} ${
                digit ? "filled" : ""
              }`}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              maxLength={1}
              inputMode="numeric"
              disabled={expired || loading}
            />
          ))}
        </div>

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}

        <button
          className="btn-primary"
          onClick={handleVerify}
          disabled={loading || expired || otp.join("").length !== 6}
        >
          {loading ? <span className="spinner" /> : "✅ যাচাই করুন"}
        </button>

        {expired && (
          <button
            className="otp-resend-btn"
            onClick={() => navigate("/signup")}
          >
            🔄 আবার সাইনআপ করুন
          </button>
        )}

        <p className="otp-footer-text">
          কোড পাননি? আপনার Spam Folder চেক করুন।
        </p>
      </div>
    </AuthLayout>
  );
}
