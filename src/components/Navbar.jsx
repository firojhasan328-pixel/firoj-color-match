import React from "react";
import BalanceBox from "./BalanceBox";

export default function Navbar({
  userName = "User",
  balance = 0,
  onMenuClick,
  onBalanceClick,
}) {
  return (
    <nav className="navbar">
      {/* বাম: মেনু বাটন */}
      <button
        className="nav-btn"
        onClick={onMenuClick}
        aria-label="মেনু খুলুন"
      >
        ☰
      </button>

      {/* মাঝ: স্বাগতম মেসেজ */}
      <div className="nav-welcome">
        <div className="hello">স্বাগতম</div>
        <div className="name">{userName}</div>
      </div>

      {/* ডান: ব্যালেন্স বক্স */}
      <BalanceBox amount={balance} onClick={onBalanceClick} />
    </nav>
  );
}
