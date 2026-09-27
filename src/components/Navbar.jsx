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
      <button
        className="nav-btn"
        onClick={onMenuClick}
        aria-label="মেনু খুলুন"
      >
        ☰
      </button>

      <div className="nav-welcome">
        <div className="hello">স্বাগতম</div>
        <div className="name">{userName}</div>
      </div>

      <BalanceBox amount={balance} onClick={onBalanceClick} />
    </nav>
  );
}
