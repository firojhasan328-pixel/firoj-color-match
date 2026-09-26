import React, { useState } from "react";

export default function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="off"
        />
        <button
          type="button"
          className="eye-btn"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখান"}
        >
          {show ? "🙈" : "👁️"}
        </button>
      </div>
    </div>
  );
}
