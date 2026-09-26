import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import PasswordInput from "../components/PasswordInput";
import { signInWithEmail } from "../services/authService";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("ইমেইল এবং পাসওয়ার্ড দুটোই দিন।");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      navigate("/home");
    } catch (err) {
      setError("ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h2 className="auth-title">লগইন করুন</h2>
      <p className="auth-sub">আপনার অ্যাকাউন্টে প্রবেশ করতে আপনার তথ্য দিন।</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="field">
          <label htmlFor="email">ইমেইল</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="আপনার ইমেইল লিখুন"
            autoComplete="email"
          />
        </div>

        <PasswordInput
          id="password"
          label="পাসওয়ার্ড"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="আপনার পাসওয়ার্ড লিখুন"
        />

        {error && <div className="error-box">{error}</div>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : "লগইন করুন"}
        </button>
      </form>

      <p className="switch-text">
        অ্যাকাউন্ট নেই? <Link to="/signup">অ্যাকাউন্ট তৈরি করুন</Link>
      </p>
    </AuthLayout>
  );
}
