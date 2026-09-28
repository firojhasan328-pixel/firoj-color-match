import React, { useEffect, useState } from "react";
import { extractDominantColor } from "../services/colorService";
import {
  COLOR_MASTER,
  SET_TYPES,
  getCodesByColorName,
  getHexByColorName,
  WEIGHT_MIN,
  WEIGHT_MAX,
} from "../data/colorMaster";

const MAX_ROWS = 7;

// নতুন খালি Row বানানো
function makeEmptyRow() {
  return {
    id: Date.now() + Math.random(),
    colorName: "Yellow",
    colorCode: "",
    setType: "1 kg",
    weight: 20,
    showCustomName: false,
    showCustomCode: false,
    customColorName: "",
    customColorCode: "",
  };
}

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

  // ৭টি Row
  const [rows, setRows] = useState([makeEmptyRow()]);

  // কোন Row-এর ড্রপডাউন খোলা আছে
  const [openDropdown, setOpenDropdown] = useState({
    rowId: null,
    type: null,
  });

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

  function updateRow(rowId, updates) {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, ...updates } : r))
    );
  }

  function addRow() {
    if (rows.length >= MAX_ROWS) {
      alert(`সর্বোচ্চ ${MAX_ROWS}টি কালার যোগ করা যাবে।`);
      return;
    }
    setRows((prev) => [...prev, makeEmptyRow()]);
  }

  function removeRow(rowId) {
    if (rows.length === 1) {
      alert("কমপক্ষে ১টি কালার থাকতে হবে।");
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  }

  function handleColorNameSelect(rowId, name) {
    if (name === "__OTHER__") {
      updateRow(rowId, {
        showCustomName: true,
        customColorName: "",
        colorCode: "",
        showCustomCode: true,
      });
    } else {
      const codes = getCodesByColorName(name);
      updateRow(rowId, {
        colorName: name,
        showCustomName: false,
        colorCode: codes[0] || "",
        showCustomCode: false,
      });
    }
    setOpenDropdown({ rowId: null, type: null });
  }

  function handleColorCodeSelect(rowId, code) {
    if (code === "__OTHER__") {
      updateRow(rowId, { showCustomCode: true, customColorCode: "" });
    } else {
      updateRow(rowId, { colorCode: code, showCustomCode: false });
    }
    setOpenDropdown({ rowId: null, type: null });
  }

  // ========================================
  // Weight Control Functions
  // ========================================

  // গ্রাম Adjust (±1 gm)
  function adjustGram(rowId, delta) {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    let newW = parseFloat(row.weight) + delta;
    if (newW < WEIGHT_MIN) newW = WEIGHT_MIN;
    if (newW > WEIGHT_MAX) newW = WEIGHT_MAX;
    newW = parseFloat(newW.toFixed(2));
    updateRow(rowId, { weight: newW });
  }

  // মিলিগ্রাম Adjust (±0.01 gm = 10 mg)
  function adjustMilligram(rowId, delta) {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    let newW = parseFloat(row.weight) + delta;
    if (newW < WEIGHT_MIN) newW = WEIGHT_MIN;
    if (newW > WEIGHT_MAX) newW = WEIGHT_MAX;
    newW = parseFloat(newW.toFixed(2));
    updateRow(rowId, { weight: newW });
  }

  // Manual Weight Input
  function handleWeightInput(rowId, value) {
    const val = parseFloat(value);
    if (isNaN(val)) {
      updateRow(rowId, { weight: 0 });
      return;
    }
    if (val < WEIGHT_MIN) {
      updateRow(rowId, { weight: WEIGHT_MIN });
    } else if (val > WEIGHT_MAX) {
      updateRow(rowId, { weight: WEIGHT_MAX });
    } else {
      updateRow(rowId, { weight: parseFloat(val.toFixed(2)) });
    }
  }

  // Total Weight
  const totalWeight = rows.reduce((sum, r) => {
    const w = parseFloat(r.weight) || 0;
    return sum + w;
  }, 0);

  function handleSave() {
    setError("");

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const finalName = r.showCustomName
        ? r.customColorName.trim()
        : r.colorName;
      const finalCode = r.showCustomCode
        ? r.customColorCode.trim()
        : r.colorCode;

      if (!finalName) {
        setError(`কালার ${i + 1}: কালারের নাম দিন।`);
        return;
      }
      if (!finalCode) {
        setError(`কালার ${i + 1}: কোড দিন।`);
        return;
      }
      if (
        r.weight === null ||
        r.weight < WEIGHT_MIN ||
        r.weight > WEIGHT_MAX
      ) {
        setError(
          `কালার ${i + 1}: পরিমাণ ${WEIGHT_MIN} - ${WEIGHT_MAX} gm এর মধ্যে হতে হবে।`
        );
        return;
      }
    }

    if (!color) {
      setError("কালার বিশ্লেষণ শেষ হয়নি।");
      return;
    }

    const mixData = rows.map((r) => ({
      name: r.showCustomName ? r.customColorName.trim() : r.colorName,
      code: r.showCustomCode ? r.customColorCode.trim() : r.colorCode,
      setType: r.setType,
      weight: parseFloat(r.weight) || 0,
    }));

    const detailsText = mixData
      .map(
        (m) =>
          `${m.name} (${m.code}) · ${m.weight.toFixed(2)}gm · ${m.setType}`
      )
      .join(" + ");

    onSave({
      color,
      colorMix: mixData,
      details: detailsText,
      totalWeight,
    });
  }

  return (
    <div className="details-fullscreen-overlay">
      <div className="details-fullscreen-card">
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
          <div className="details-image-block">
            <img src={imagePreview} alt="Preview" />
          </div>

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

          <div className="mix-info-box">
            🎨 <strong>কালার মিক্স</strong> — একটি কালার তৈরি করতে একাধিক
            রঙের মিশ্রণ লাগে। সর্বোচ্চ {MAX_ROWS}টি রঙ যোগ করুন।
          </div>

          <div className="mix-rows-container">
            {rows.map((row, index) => {
              const availableCodes = getCodesByColorName(row.colorName);
              const currentHex = row.showCustomName
                ? "#CCCCCC"
                : getHexByColorName(row.colorName);
              const isNameOpen =
                openDropdown.rowId === row.id &&
                openDropdown.type === "name";
              const isCodeOpen =
                openDropdown.rowId === row.id &&
                openDropdown.type === "code";
              const isSetOpen =
                openDropdown.rowId === row.id &&
                openDropdown.type === "set";

              return (
                <div key={row.id} className="mix-row-card">
                  <div className="mix-row-header">
                    <span className="mix-row-num">কালার {index + 1}</span>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        className="mix-row-remove"
                        onClick={() => removeRow(row.id)}
                        aria-label="মুছে ফেলুন"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="mix-row-body">
                    {/* Set Type */}
                    <div className="mix-field">
                      <label className="mix-label">সেট</label>
                      <div className="dropdown-wrap">
                        <button
                          type="button"
                          className="dropdown-trigger compact"
                          onClick={() =>
                            setOpenDropdown({
                              rowId: row.id,
                              type: isSetOpen ? null : "set",
                            })
                          }
                        >
                          <span className="dropdown-value">
                            {row.setType}
                          </span>
                          <span className="dropdown-caret">⌄</span>
                        </button>
                        {isSetOpen && (
                          <div className="dropdown-menu">
                            {SET_TYPES.map((s) => (
                              <button
                                key={s}
                                className={`dropdown-item ${
                                  s === row.setType ? "active" : ""
                                }`}
                                onClick={() => {
                                  updateRow(row.id, { setType: s });
                                  setOpenDropdown({
                                    rowId: null,
                                    type: null,
                                  });
                                }}
                              >
                                {s}
                                {s === row.setType && (
                                  <span className="check-icon">✓</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Color Name */}
                    <div className="mix-field">
                      <label className="mix-label">
                        কালার নাম <span className="required-mark">*</span>
                      </label>
                      <div className="dropdown-wrap">
                        <button
                          type="button"
                          className="dropdown-trigger compact"
                          onClick={() =>
                            setOpenDropdown({
                              rowId: row.id,
                              type: isNameOpen ? null : "name",
                            })
                          }
                        >
                          <span className="color-name-row">
                            <span
                              className="color-dot small"
                              style={{ background: currentHex }}
                            />
                            <span className="dropdown-value">
                              {row.showCustomName
                                ? row.customColorName || "অন্যান্য"
                                : row.colorName}
                            </span>
                          </span>
                          <span className="dropdown-caret">⌄</span>
                        </button>
                        {isNameOpen && (
                          <div className="dropdown-menu">
                            {COLOR_MASTER.map((c) => (
                              <button
                                key={c.name}
                                className={`dropdown-item ${
                                  c.name === row.colorName &&
                                  !row.showCustomName
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleColorNameSelect(row.id, c.name)
                                }
                              >
                                <span className="item-color-row">
                                  <span
                                    className="color-dot small"
                                    style={{ background: c.hex }}
                                  />
                                  {c.name}
                                </span>
                                {c.name === row.colorName &&
                                  !row.showCustomName && (
                                    <span className="check-icon">✓</span>
                                  )}
                              </button>
                            ))}
                            <button
                              className={`dropdown-item other-item ${
                                row.showCustomName ? "active" : ""
                              }`}
                              onClick={() =>
                                handleColorNameSelect(row.id, "__OTHER__")
                              }
                            >
                              ✏️ অন্যান্য
                              {row.showCustomName && (
                                <span className="check-icon">✓</span>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                      {row.showCustomName && (
                        <input
                          type="text"
                          className="custom-input small"
                          placeholder="কালারের নাম..."
                          value={row.customColorName}
                          onChange={(e) =>
                            updateRow(row.id, {
                              customColorName: e.target.value,
                            })
                          }
                        />
                      )}
                    </div>

                    {/* Color Code */}
                    <div className="mix-field">
                      <label className="mix-label">
                        কোড <span className="required-mark">*</span>
                      </label>
                      <div className="dropdown-wrap">
                        <button
                          type="button"
                          className="dropdown-trigger compact"
                          onClick={() =>
                            setOpenDropdown({
                              rowId: row.id,
                              type: isCodeOpen ? null : "code",
                            })
                          }
                          disabled={row.showCustomName}
                        >
                          <span className="dropdown-value">
                            {row.showCustomCode
                              ? row.customColorCode || "অন্যান্য"
                              : row.colorCode || "নির্বাচন"}
                          </span>
                          <span className="dropdown-caret">⌄</span>
                        </button>
                        {isCodeOpen && !row.showCustomName && (
                          <div className="dropdown-menu">
                            {availableCodes.length > 0 ? (
                              availableCodes.map((code) => (
                                <button
                                  key={code}
                                  className={`dropdown-item ${
                                    code === row.colorCode &&
                                    !row.showCustomCode
                                      ? "active"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    handleColorCodeSelect(row.id, code)
                                  }
                                >
                                  {code}
                                  {code === row.colorCode &&
                                    !row.showCustomCode && (
                                      <span className="check-icon">✓</span>
                                    )}
                                </button>
                              ))
                            ) : (
                              <div className="dropdown-empty">
                                কোনো কোড নেই
                              </div>
                            )}
                            <button
                              className={`dropdown-item other-item ${
                                row.showCustomCode ? "active" : ""
                              }`}
                              onClick={() =>
                                handleColorCodeSelect(row.id, "__OTHER__")
                              }
                            >
                              ✏️ অন্যান্য
                              {row.showCustomCode && (
                                <span className="check-icon">✓</span>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                      {(row.showCustomCode || row.showCustomName) && (
                        <input
                          type="text"
                          className="custom-input small"
                          placeholder="কোড..."
                          value={
                            row.showCustomCode
                              ? row.customColorCode
                              : row.colorCode
                          }
                          onChange={(e) =>
                            updateRow(
                              row.id,
                              row.showCustomCode
                                ? { customColorCode: e.target.value }
                                : { colorCode: e.target.value }
                            )
                          }
                        />
                      )}
                    </div>

                    {/* ============ WEIGHT (NEW) ============ */}
                    <div className="mix-field">
                      <label className="mix-label">
                        পরিমাণ (gm) <span className="required-mark">*</span>
                      </label>

                      <div className="weight-advanced-wrap">
                        {/* গ্রাম Control (বাম) */}
                        <div className="weight-ctrl-group">
                          <button
                            type="button"
                            className="weight-ctrl-btn gram"
                            onClick={() => adjustGram(row.id, -1)}
                            title="১ গ্রাম কম"
                          >
                            −
                          </button>
                          <span className="weight-ctrl-label">গ্রাম</span>
                          <button
                            type="button"
                            className="weight-ctrl-btn gram"
                            onClick={() => adjustGram(row.id, 1)}
                            title="১ গ্রাম বাড়"
                          >
                            +
                          </button>
                        </div>

                        {/* Manual Input (মাঝে) */}
                        <div className="weight-manual-wrap">
                          <input
                            type="number"
                            className="weight-manual-input"
                            value={row.weight}
                            min={WEIGHT_MIN}
                            max={WEIGHT_MAX}
                            step="0.01"
                            onChange={(e) =>
                              handleWeightInput(row.id, e.target.value)
                            }
                          />
                          <span className="weight-manual-unit">gm</span>
                        </div>

                        {/* মিলিগ্রাম Control (ডান) */}
                        <div className="weight-ctrl-group">
                          <button
                            type="button"
                            className="weight-ctrl-btn mg"
                            onClick={() => adjustMilligram(row.id, -0.01)}
                            title="১০ মি.গ্রা. কম"
                          >
                            −
                          </button>
                          <span className="weight-ctrl-label">mg</span>
                          <button
                            type="button"
                            className="weight-ctrl-btn mg"
                            onClick={() => adjustMilligram(row.id, 0.01)}
                            title="১০ মি.গ্রা. বাড়"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {rows.length < MAX_ROWS && (
            <button
              type="button"
              className="add-row-btn"
              onClick={addRow}
            >
              ➕ আরেকটি কালার যোগ করুন ({rows.length}/{MAX_ROWS})
            </button>
          )}

          <div className="total-weight-box">
            <span className="total-weight-label">📊 মোট পরিমাণ</span>
            <span className="total-weight-value">
              {totalWeight.toFixed(2)} gm
            </span>
          </div>

          <div className="watermark-note">
            🔒 আপনার ইউনিক আইডি এবং কালার কোড স্বয়ংক্রিয়ভাবে ছবির সাথে যুক্ত
            হয়ে যাবে — কেউ পরিবর্তন করতে পারবে না।
          </div>

          {error && <div className="error-box">{error}</div>}
        </div>

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
