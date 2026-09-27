import React, { useRef, useState } from "react";
import { isSolidColorImage } from "../services/imageValidator";

export default function UploadBox({ onLocalUpload, onInvalidImage }) {
  const fileInputRef = useRef(null);
  const [checking, setChecking] = useState(false);

  function handleLocalClick() {
    if (checking) return;
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset Input
    if (fileInputRef.current) fileInputRef.current.value = "";

    // File Reader দিয়ে Preview
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;

      setChecking(true);
      try {
        // Solid Color Check
        const result = await isSolidColorImage(dataUrl, 12);

        if (result.isSolid) {
          // ✅ Solid — Details Modal খুলবে
          if (onLocalUpload) onLocalUpload(file, dataUrl);
        } else {
          // ❌ Complex — Invalid Modal
          if (onInvalidImage) {
            onInvalidImage({
              preview: dataUrl,
              score: result.score,
              reason: result.reason,
            });
          }
        }
      } catch (err) {
        console.error("Validation error:", err);
        if (onInvalidImage) {
          onInvalidImage({
            preview: dataUrl,
            score: 0,
            reason: "ছবি পরীক্ষা করা যায়নি",
          });
        }
      } finally {
        setChecking(false);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="upload-card" onClick={handleLocalClick}>
      <div className="upload-icon">
        {checking ? <span className="pulse" /> : "📁"}
      </div>
      <h3>{checking ? "পরীক্ষা করা হচ্ছে..." : "ডিভাইস থেকে আপলোড"}</h3>
      <p>
        {checking
          ? "ছবিটি একরঙা কিনা যাচাই করা হচ্ছে..."
          : "শুধু একরঙা (Solid Color) ছবি নির্বাচন করুন"}
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}
