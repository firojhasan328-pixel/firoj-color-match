import { supabase } from "../lib/supabaseClient";

// ========================================
// ছবির উপর Watermark (Unique ID + Color Code)
// ========================================
export async function addWatermarkToImage(file, userCode, colorHex) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          // Watermark size — ছবির Width-এর ২.৫% (আগের চেয়ে ছোট)
          const fontSize = Math.max(Math.round(canvas.width * 0.025), 12);
          const padding = Math.round(fontSize * 0.55);
          const radius = Math.round(fontSize * 0.5);

          ctx.font = `600 ${fontSize}px "Hind Siliguri", Arial, sans-serif`;
          ctx.textBaseline = "middle";

          // ---------- Unique ID (ডান কোণায়) ----------
          const idText = userCode || "CM000000";
          ctx.textAlign = "right";
          const idWidth = ctx.measureText(idText).width;
          const idBoxW = idWidth + padding * 2;
          const idBoxH = fontSize + padding * 1.4;
          const idBoxX = canvas.width - idBoxW - 8;
          const idBoxY = canvas.height - idBoxH - 8;

          ctx.fillStyle = "rgba(15, 23, 42, 0.5)";
          roundRect(ctx, idBoxX, idBoxY, idBoxW, idBoxH, radius);
          ctx.fill();

          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.fillText(
            idText,
            idBoxX + idBoxW - padding,
            idBoxY + idBoxH / 2 + 1
          );

          // ---------- Color Code (বাম কোণায়) ----------
          if (colorHex) {
            const colorText = colorHex.toUpperCase();
            ctx.textAlign = "left";
            const colorWidth = ctx.measureText(colorText).width;
            const colorBoxW = colorWidth + padding * 2;
            const colorBoxH = fontSize + padding * 1.4;
            const colorBoxX = 8;
            const colorBoxY = canvas.height - colorBoxH - 8;

            ctx.fillStyle = "rgba(15, 23, 42, 0.5)";
            roundRect(ctx, colorBoxX, colorBoxY, colorBoxW, colorBoxH, radius);
            ctx.fill();

            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.fillText(
              colorText,
              colorBoxX + padding,
              colorBoxY + colorBoxH / 2 + 1
            );
          }

          // Canvas → Blob → File
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Watermark তৈরি করা যায়নি"));
                return;
              }
              const watermarkedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, "") + "_wm.jpg",
                { type: "image/jpeg" }
              );
              resolve(watermarkedFile);
            },
            "image/jpeg",
            0.92
          );
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("ছবি লোড করা যায়নি"));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error("ছবি পড়া যায়নি"));
    reader.readAsDataURL(file);
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ========================================
// Storage-এ ছবি আপলোড
// ========================================
export async function uploadColorImage(file, userId) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from("color-images")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("color-images")
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// ========================================
// Database-এ color info সেভ
// ========================================
export async function saveColorRecord({
  userId,
  ownerName,
  userCode,
  imageUrl,
  color,
  details,
}) {
  const { data, error } = await supabase
    .from("colors")
    .insert({
      user_id: userId,
      owner_name: ownerName,
      user_code: userCode,
      image_url: imageUrl,
      color_hex: color.hex,
      color_r: color.r,
      color_g: color.g,
      color_b: color.b,
      details: details || "",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ========================================
// Global Gallery-র সব ছবি আনা
// ========================================
export async function fetchAllColors() {
  const { data, error } = await supabase
    .from("colors")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}
