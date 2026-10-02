import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import PasswordInput from "../components/PasswordInput";
import { signUpWithEmail } from "../services/authService";
import { supabase } from "../lib/supabaseClient";

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
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

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
    // Mobile: ১১ ডিজিট হতে হবে
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
      const data = await signUpWithEmail(
        name.trim(),
        email.trim(),
        password,
        {
          mobile: mobile.trim(),
          company: company.trim(),
          designation: designation.trim(),
          present_address: presentAddress.trim(),
        }
      );

      // Profile Update (Signup-এর পর Profile-এ নতুন Field সেভ)
      if (data?.user?.id) {
        await supabase
          .from("profiles")
          .update({
            mobile: mobile.trim(),
            company: company.trim(),
            designation: designation.trim(),
            present_address: presentAddress.trim(),
          })
          .eq("id", data.user.id);
      }

      if (data?.session) {
        await new Promise((r) => setTimeout(r, 800));
        navigate("/home");
      } else if (data?.user && !data.session) {
        setSuccess(
          "আপনার ইমেইলে একটি Verification Link পাঠানো হয়েছে। ইমেইল যাচাই করে Login করুন।"
        );
      } else {
        navigate("/home");
      }
    } catch (err) {
      const msg = (err?.message || "").toLowerCase();
      console.error("Signup error:", err);

      if (
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("exists")
      ) {
        setError(
          "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে। লগইন করুন অথবা অন্য ইমেইল ব্যবহার করুন।"
        );
      } else if (msg.includes("password")) {
        setError("পাসওয়ার্ড যথেষ্ট নিরাপদ নয়। কমপক্ষে ৬ অক্ষর দিন।");
      } else if (msg.includes("email") && msg.includes("invalid")) {
        setError("ইমেইলের ঠিকানাটি সঠিক নয়।");
      } else if (msg.includes("rate") || msg.includes("limit")) {
        setError(
          "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।"
        );
      } else {
        setError(
          "অ্যাকাউন্ট তৈরি করা যায়নি: " + (err?.message || "অজানা সমস্যা")
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // Mobile Input (শুধু ডিজিট)
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
        {/* Name */}
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

        {/* Email */}
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

        {/* Mobile */}
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
          <p className="field-hint">
            ১১ ডিজিটের মোবাইল নাম্বার দিন
          </p>
        </div>

        {/* Company */}
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

        {/* Designation */}
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

        {/* Present Address */}
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

        {/* Password */}
        <PasswordInput
          id="password"
          label="পাসওয়ার্ড"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="আপনার পাসওয়ার্ড লিখুন"
        />

        {/* Confirm Password */}
        <PasswordInput
          id="confirm"
          label="পাসওয়ার্ড নিশ্চিত করুন"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="পাসওয়ার্ড আবার লিখুন"
        />

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : "অ্যাকাউন্ট তৈরি করুন"}
        </button>
      </form>

      <p className="switch-text">
        আগেই অ্যাকাউন্ট আছে? <Link to="/login">লগইন করুন</Link>
      </p>
    </AuthLayout>
  );
}
