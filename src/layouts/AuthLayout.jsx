import React from "react";
import Logo from "../components/Logo";
import "../styles/auth.css";

export default function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <div className="auth-bg-glow" />
      <div className="auth-card">
        <Logo />
        {children}
      </div>
      <p className="auth-footer">© 2025 Color Match</p>
    </div>
  );
}
