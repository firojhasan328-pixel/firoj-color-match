import React from "react";

export default function BalanceBox({ amount = 0, onClick }) {
  return (
    <button
      className="balance-box"
      onClick={onClick}
      aria-label="ব্যালেন্স দেখুন"
    >
      <span className="balance-icon">💰</span>
      <span className="balance-amount">৳{Number(amount).toFixed(0)}</span>
    </button>
  );
}
