import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import PasswordInput from "../components/PasswordInput";
import { signUpWithEmail } from "../services/authService";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !password || !confirm) {
      setError("সব তথ্য পূরণ করুন।");
      return;
    }
    if (password.length < 6) {
      setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return;
    }
    if (password !== confirm) {
      setError("পাসওয়ার্ড দুটি একই নয়।");
      return;
    }

    setLoading(true);
    try {
      const data = await signUpWithEmail(name.trim(), email.trim(), password);
      if (data?.user && !data.session) {
        setSuccess(
          "আপনার ইমেইলে একটি Verification Link পাঠানো হয়েছে। ইমেইল যাচাই করে Login করুন।"
        );
      } else {
        navigate("/");
      }
    } catch (err) {
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("already")) {
        setError("এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে।");
      } else if (msg.toLowerCase().includes("password")) {
        setError("পাসওয়ার্ড যথেষ্ট নিরাপদ নয়।");
      } else {
        setError("অ্যাকাউন্ট তৈরি করা যায়নি। আবার চেষ্টা করুন।");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h2 className="auth-title">অ্যাকাউন্ট তৈরি করুন</h2>
      <p className="auth-sub">
        নতুন অ্যাকাউন্ট তৈরি করতে নিচের তথ্যগুলো পূরণ করুন।
      </p>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="field">
          <label htmlFor="name">নাম</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="আপনার নাম লিখুন"
          />
        </div>

        <div className="field">
          <label htmlFor="email">ইমেইল</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="আপনার ইমেইল লিখুন"
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
