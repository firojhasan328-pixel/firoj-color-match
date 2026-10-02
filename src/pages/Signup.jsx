import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import PasswordInput from "../components/PasswordInput";
import { generateOTP, saveOTP } from "../services/otpService";
import { sendOtpEmail } from "../services/emailService";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [company, setCompany] = useState("");
  const [designation, setDesignation] = useState("");
  const [presentAddress, setPresentAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // ========================================
    // Validation
    // ========================================
    if (!name.trim()) {
      setError("নাম দিন।");
      return;
    }
    if (!email.trim()) {
      setError("ইমেইল দিন।");
      return;
    }
    if (!mobile.trim() || mobile.trim().length !== 11) {
      setError("সঠিক মোবাইল নাম্বার দিন (১১ ডিজিট)।");
      return;
    }
    if (!company.trim()) {
      setError("আপনি কোন টেক্সটাইলে চাকরি করেন সেটি লিখুন।");
      return;
    }
    if (!designation.trim()) {
      setError("আপনার পদবী লিখুন।");
      return;
    }
    if (!presentAddress.trim()) {
      setError("বর্তমান ঠিকানা লিখুন।");
      return;
    }
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
      // ========================================
      // ১। OTP তৈরি
      // ========================================
      const otpCode = generateOTP();

      // ========================================
      // ২। User Data তৈরি (পরে Signup-এ ব্যবহার হবে)
      // ========================================
      const userData = {
        name: name.trim(),
        email: email.trim(),
        password: password,
        mobile: mobile.trim(),
        company: company.trim(),
        designation: designation.trim(),
        present_address: presentAddress.trim(),
      };

      // ========================================
      // ৩। OTP Database-এ Save
      // ========================================
      await saveOTP(email.trim(), otpCode, userData);

      // ========================================
      // ৪। EmailJS দিয়ে Email পাঠাই
      // ========================================
      await sendOtpEmail(email.trim(), name.trim(), otpCode);

      // ========================================
      // ৫। Verify Page-এ Navigate
      // ========================================
      navigate("/verify", {
        state: { email: email.trim(), name: name.trim() },
      });
    } catch (err) {
      console.error("Signup error:", err);
      setError(
        "OTP পাঠানো যায়নি: " + (err?.message || "অজানা সমস্যা")
      );
    } finally {
      setLoading(false);
    }
  }

  function handleMobileChange(e) {
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 11);
    setMobile(val);
    if (error) setError("");
  }

  return (
    <AuthLayout>
      <h2 className="auth-title">অ্যাকাউন্ট তৈরি করুন</h2>
      <p className="auth-sub">
        নতুন অ্যাকাউন্ট তৈরি করতে নিচের তথ্যগুলো পূরণ করুন।
      </p>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="field">
          <label htmlFor="name">
            নাম <span className="required-mark">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="আপনার নাম লিখুন"
          />
        </div>

        <div className="field">
          <label htmlFor="email">
            ইমেইল <span className="required-mark">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="আপনার ইমেইল লিখুন"
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label htmlFor="mobile">
            মোবাইল নাম্বার <span className="required-mark">*</span>
          </label>
          <input
            id="mobile"
            type="tel"
            value={mobile}
            onChange={handleMobileChange}
            placeholder="যেমন: 01918568313"
            maxLength={11}
            inputMode="numeric"
          />
          <p className="field-hint">১১ ডিজিটের মোবাইল নাম্বার দিন</p>
        </div>

        <div className="field">
          <label htmlFor="company">
            আপনি কোন টেক্সটাইলে চাকরি করেন{" "}
            <span className="required-mark">*</span>
          </label>
          <input
            id="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="যেমন: Square Textiles Ltd."
          />
        </div>

        <div className="field">
          <label htmlFor="designation">
            আপনার পদবী <span className="required-mark">*</span>
          </label>
          <input
            id="designation"
            type="text"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="যেমন: Dyeing Master / Manager"
          />
        </div>

        <div className="field">
          <label htmlFor="presentAddress">
            বর্তমান ঠিকানা <span className="required-mark">*</span>
          </label>
          <input
            id="presentAddress"
            type="text"
            value={presentAddress}
            onChange={(e) => setPresentAddress(e.target.value)}
            placeholder="যেমন: সাভার, ঢাকা"
          />
        </div>

        <PasswordInput
          id="password"
          label="পাসওয়ার্ড"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="আপনার পাসওয়ার্ড লিখুন"
        />

        <PasswordInput
          id="confirm"
          label="পাসওয়ার্ড নিশ্চিত করুন"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="পাসওয়ার্ড আবার লিখুন"
        />

        {error && <div className="error-box">{error}</div>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <span className="spinner" />
          ) : (
            "অ্যাকাউন্ট তৈরি করুন"
          )}
        </button>
      </form>

      <p className="switch-text">
        আগেই অ্যাকাউন্ট আছে? <Link to="/login">লগইন করুন</Link>
      </p>
    </AuthLayout>
  );
}
