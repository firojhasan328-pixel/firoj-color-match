import React, { useEffect, useState } from "react";
import { extractDominantColor } from "../services/colorService";
import {
  COLOR_MASTER,
  SET_TYPES,
  getCodesByColorName,
  getHexByColorName,
  WEIGHT_MIN,
  WEIGHT_MAX,
  WEIGHT_STEP,
} from "../data/colorMaster";

export default function DetailsModal({
  imageFile,
  imagePreview,
  onClose,
  onSave,
  saving,
}) {
  const [color, setColor] = useState(null);
  const [analyzing, setAnalyzing] = useState(true);
  const [error, setError] = useState("");

  // Form Fields
  const [colorName, setColorName] = useState("Yellow");
  const [colorCode, setColorCode] = useState("");
  const [setType, setSetType] = useState("1 kg");
  const [weight, setWeight] = useState(20);

  // "অন্যান্য" States
  const [customColorName, setCustomColorName] = useState("");
  const [customColorCode, setCustomColorCode] = useState("");
  const [showCustomName, setShowCustomName] = useState(false);
  const [showCustomCode, setShowCustomCode] = useState(false);

  // Dropdown Open States
  const [openSetDropdown, setOpenSetDropdown] = useState(false);
  const [openNameDropdown, setOpenNameDropdown] = useState(false);
  const [openCodeDropdown, setOpenCodeDropdown] = useState(false);

  useEffect(() => {
    async function analyze() {
      try {
        const c = await extractDominantColor(imagePreview);
        setColor(c);
      } catch (err) {
        console.error(err);
      } finally {
        setAnalyzing(false);
      }
    }
    if (imagePreview) analyze();
  }, [imagePreview]);

  // Color Name পরিবর্তন হলে Code Auto-Select
  useEffect(() => {
    if (!showCustomName) {
      const codes = getCodesByColorName(colorName);
      setColorCode(codes[0] || "");
      setShowCustomCode(false);
    }
  }, [colorName, showCustomName]);

  function handleColorNameSelect(name) {
    if (name === "__OTHER__") {
      setShowCustomName(true);
      setCustomColorName("");
      setOpenNameDropdown(false);
    } else {
      setShowCustomName(false);
      setColorName(name);
      setOpenNameDropdown(false);
    }
  }

  function handleColorCodeSelect(code) {
    if (code === "__OTHER__") {
      setShowCustomCode(true);
      setCustomColorCode("");
      setOpenCodeDropdown(false);
    } else {
      setShowCustomCode(false);
      setColorCode(code);
      setOpenCodeDropdown(false);
    }
  }

  function adjustWeight(delta) {
    let newW = weight + delta;
    if (newW < WEIGHT_MIN) newW = WEIGHT_MIN;
    if (newW > WEIGHT_MAX) newW = WEIGHT_MAX;
    setWeight(newW);
  }

  function handleSave() {
    setError("");

    // Validation
    const finalColorName = showCustomName
      ? customColorName.trim()
      : colorName;
    const finalColorCode = showCustomCode
      ? customColorCode.trim()
      : colorCode;

    if (!finalColorName) {
      setError("কালারের নাম দিন।");
      return;
    }
    if (!finalColorCode) {
      setError("কালার কোড দিন।");
      return;
    }
    if (!setType) {
      setError("সেট নির্বাচন করুন।");
      return;
    }
    if (weight === null || weight < WEIGHT_MIN || weight > WEIGHT_MAX) {
      setError(`পরিমাণ ${WEIGHT_MIN} - ${WEIGHT_MAX} gm এর মধ্যে হতে হবে।`);
      return;
    }
    if (!color) {
      setError("কালার বিশ্লেষণ শেষ হয়নি।");
      return;
    }

    onSave({
      color,
      colorName: finalColorName,
      colorCode: finalColorCode,
      setType,
      weight,
    });
  }

  const availableCodes = getCodesByColorName(colorName);
  const currentHex = showCustomName
    ? "#CCCCCC"
    : getHexByColorName(colorName);

  return (
    <div className="details-fullscreen-overlay">
      <div className="details-fullscreen-card">
        {/* Header */}
        <div className="details-header">
          <h2 className="details-header-title">📝 ছবির বিস্তারিত দিন</h2>
          <button
            className="details-close-btn"
            onClick={onClose}
            aria-label="বন্ধ করুন"
          >
            ✕
          </button>
        </div>

        <div className="details-scroll-body">
          {/* Image Preview */}
          <div className="details-image-block">
            <img src={imagePreview} alt="Preview" />
          </div>

          {/* Auto Detected Color */}
          {analyzing ? (
            <div className="details-loading">
              <span className="pulse" />
              কালার বিশ্লেষণ করা হচ্ছে...
            </div>
          ) : (
            color && (
              <div className="auto-color-box">
                <div
                  className="scan-color-chip"
                  style={{ background: color.hex }}
                />
                <div className="scan-info">
                  <p className="scan-label">
                    🤖 AI অটো-ডিটেক্টেড কালার কোড
                  </p>
                  <p className="scan-hex">{color.hex}</p>
                  <p className="scan-rgb">{color.rgbString}</p>
                </div>
              </div>
            )
          )}

          {/* ============ SET TYPE ============ */}
          <div className="details-field-group">
            <label className="details-label">সেট</label>
            <div className="dropdown-wrap">
              <button
                type="button"
                className="dropdown-trigger"
                onClick={() => {
                  setOpenSetDropdown((s) => !s);
                  setOpenNameDropdown(false);
                  setOpenCodeDropdown(false);
                }}
              >
                <span className="dropdown-value">{setType}</span>
                <span className="dropdown-caret">⌄</span>
              </button>

              {openSetDropdown && (
                <div className="dropdown-menu">
                  {SET_TYPES.map((s) => (
                    <button
                      key={s}
                      className={`dropdown-item ${
                        s === setType ? "active" : ""
                      }`}
                      onClick={() => {
                        setSetType(s);
                        setOpenSetDropdown(false);
                      }}
                    >
                      {s === setType && <span className="check-icon">✓</span>}
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ============ COLOR NAME ============ */}
          <div className="details-field-group">
            <label className="details-label">
              কালার নাম <span className="required-mark">*</span>
            </label>
            <div className="dropdown-wrap">
              <button
                type="button"
                className="dropdown-trigger"
                onClick={() => {
                  setOpenNameDropdown((s) => !s);
                  setOpenSetDropdown(false);
                  setOpenCodeDropdown(false);
                }}
              >
                <span className="color-name-row">
                  <span
                    className="color-dot"
                    style={{ background: currentHex }}
                  />
                  <span className="dropdown-value">
                    {showCustomName ? "অন্যান্য" : colorName}
                  </span>
                </span>
                <span className="dropdown-caret">⌄</span>
              </button>

              {openNameDropdown && (
                <div className="dropdown-menu">
                  {COLOR_MASTER.map((c) => (
                    <button
                      key={c.name}
                      className={`dropdown-item ${
                        c.name === colorName && !showCustomName
                          ? "active"
                          : ""
                      }`}
                      onClick={() => handleColorNameSelect(c.name)}
                    >
                      <span className="item-color-row">
                        <span
                          className="color-dot"
                          style={{ background: c.hex }}
                        />
                        {c.name}
                      </span>
                      {c.name === colorName && !showCustomName && (
                        <span className="check-icon">✓</span>
                      )}
                    </button>
                  ))}
                  <button
                    className={`dropdown-item other-item ${
                      showCustomName ? "active" : ""
                    }`}
                    onClick={() => handleColorNameSelect("__OTHER__")}
                  >
                    ✏️ অন্যান্য (নিজে লিখুন)
                    {showCustomName && <span className="check-icon">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Custom Name Input */}
            {showCustomName && (
              <input
                type="text"
                className="custom-input"
                placeholder="কালারের নাম লিখুন..."
                value={customColorName}
                onChange={(e) => setCustomColorName(e.target.value)}
                style={{ marginTop: "8px" }}
              />
            )}
          </div>

          {/* ============ COLOR CODE ============ */}
          <div className="details-field-group">
            <label className="details-label">
              কোড <span className="required-mark">*</span>
            </label>
            <div className="dropdown-wrap">
              <button
                type="button"
                className="dropdown-trigger"
                onClick={() => {
                  setOpenCodeDropdown((s) => !s);
                  setOpenSetDropdown(false);
                  setOpenNameDropdown(false);
                }}
                disabled={showCustomName && !customColorName}
              >
                <span className="dropdown-value">
                  {showCustomCode ? "অন্যান্য" : colorCode || "নির্বাচন করুন"}
                </span>
                <span className="dropdown-caret">⌄</span>
              </button>

              {openCodeDropdown && !showCustomName && (
                <div className="dropdown-menu">
                  {availableCodes.length > 0 ? (
                    availableCodes.map((code) => (
                      <button
                        key={code}
                        className={`dropdown-item ${
                          code === colorCode && !showCustomCode
                            ? "active"
                            : ""
                        }`}
                        onClick={() => handleColorCodeSelect(code)}
                      >
                        {code}
                        {code === colorCode && !showCustomCode && (
                          <span className="check-icon">✓</span>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="dropdown-empty">
                      এই কালারের জন্য কোনো কোড নেই
                    </div>
                  )}
                  <button
                    className={`dropdown-item other-item ${
                      showCustomCode ? "active" : ""
                    }`}
                    onClick={() => handleColorCodeSelect("__OTHER__")}
                  >
                    ✏️ অন্যান্য (নিজে লিখুন)
                    {showCustomCode && <span className="check-icon">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Custom Code Input */}
            {(showCustomCode || showCustomName) && (
              <input
                type="text"
                className="custom-input"
                placeholder="কোড লিখুন..."
                value={showCustomCode ? customColorCode : colorCode}
                onChange={(e) =>
                  showCustomCode
                    ? setCustomColorCode(e.target.value)
                    : setColorCode(e.target.value)
                }
                style={{ marginTop: "8px" }}
              />
            )}
          </div>

          {/* ============ WEIGHT ============ */}
          <div className="details-field-group">
            <label className="details-label">
              পরিমাণ (gm) <span className="required-mark">*</span>
            </label>
            <div className="weight-input-wrap">
              <button
                type="button"
                className="weight-btn"
                onClick={() => adjustWeight(-WEIGHT_STEP)}
              >
                −
              </button>
              <input
                type="number"
                className="weight-input"
                value={weight}
                min={WEIGHT_MIN}
                max={WEIGHT_MAX}
                step={WEIGHT_STEP}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    if (val < WEIGHT_MIN) setWeight(WEIGHT_MIN);
                    else if (val > WEIGHT_MAX) setWeight(WEIGHT_MAX);
                    else setWeight(val);
                  }
                }}
              />
              <span className="weight-unit">gm</span>
              <button
                type="button"
                className="weight-btn"
                onClick={() => adjustWeight(WEIGHT_STEP)}
              >
                +
              </button>
            </div>
            <p className="weight-hint">
              {WEIGHT_MIN} থেকে {WEIGHT_MAX} gm এর মধ্যে
            </p>
          </div>

          {/* ============ PREVIEW ============ */}
          <div className="details-preview-box">
            <p className="preview-title">📋 সারসংক্ষেপ</p>
            <div className="preview-row">
              <span className="preview-key">কালার:</span>
              <span className="preview-value">
                {showCustomName
                  ? customColorName || "—"
                  : colorName}
              </span>
            </div>
            <div className="preview-row">
              <span className="preview-key">কোড:</span>
              <span className="preview-value">
                {showCustomCode ? customColorCode || "—" : colorCode || "—"}
              </span>
            </div>
            <div className="preview-row">
              <span className="preview-key">সেট:</span>
              <span className="preview-value">{setType}</span>
            </div>
            <div className="preview-row">
              <span className="preview-key">পরিমাণ:</span>
              <span className="preview-value">
                {Number(weight).toFixed(2)} gm
              </span>
            </div>
          </div>

          <div className="watermark-note">
            🔒 আপনার ইউনিক আইডি এবং কালার কোড স্বয়ংক্রিয়ভাবে ছবির সাথে যুক্ত
            হয়ে যাবে — কেউ পরিবর্তন করতে পারবে না।
          </div>

          {error && <div className="error-box">{error}</div>}
        </div>

        {/* Fixed Footer */}
        <div className="details-footer">
          <button
            className="details-footer-btn secondary"
            onClick={onClose}
            disabled={saving}
          >
            বাতিল
          </button>
          <button
            className="details-footer-btn primary"
            onClick={handleSave}
            disabled={saving || !color}
          >
            {saving ? "সেভ হচ্ছে..." : "✅ সেভ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
