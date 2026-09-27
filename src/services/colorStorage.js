// ========================================
// ছবি থেকে Dominant Color বের করা (উন্নত)
// ========================================
export function extractDominantColor(imageSrc) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const size = 100;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size).data;

        const colorBuckets = {};
        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];
          if (a < 128) continue;

          // Skip খুব সাদা ও খুব কালো Pixel (প্রায়ই Background হয়)
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max > 240 && min > 240) continue;
          if (max < 20) continue;

          const key = `${Math.round(r / 24) * 24},${Math.round(g / 24) * 24},${
            Math.round(b / 24) * 24
          }`;
          if (!colorBuckets[key])
            colorBuckets[key] = { count: 0, r: 0, g: 0, b: 0 };
          colorBuckets[key].count++;
          colorBuckets[key].r += r;
          colorBuckets[key].g += g;
          colorBuckets[key].b += b;
        }

        let topColor = { r: 128, g: 128, b: 128 };
        let topCount = 0;
        for (const key in colorBuckets) {
          const bucket = colorBuckets[key];
          if (bucket.count > topCount) {
            topCount = bucket.count;
            topColor = {
              r: Math.round(bucket.r / bucket.count),
              g: Math.round(bucket.g / bucket.count),
              b: Math.round(bucket.b / bucket.count),
            };
          }
        }

        resolve({
          ...topColor,
          hex: rgbToHex(topColor.r, topColor.g, topColor.b),
          rgbString: `rgb(${topColor.r}, ${topColor.g}, ${topColor.b})`,
        });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => reject(err);
    img.src = imageSrc;
  });
}

// ========================================
// RGB → HEX
// ========================================
export function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
      .toUpperCase()
  );
}

// ========================================
// HSL → Hue বের করা (রঙের পার্থক্য আরও নিখুঁত)
// ========================================
export function rgbToHue(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return h;
}

// ========================================
// Saturation বের করা
// ========================================
export function rgbToSaturation(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

// ========================================
// দুইটি রঙের পার্থক্য (Weighted — Hue বেশি গুরুত্বপূর্ণ)
// ========================================
export function colorDistance(c1, c2) {
  const rmean = (c1.r + c2.r) / 2;
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;

  // "Redmean" Formula — মানুষের চোখের সাথে ভালো মেলে
  const weightR = 2 + rmean / 256;
  const weightG = 4;
  const weightB = 2 + (255 - rmean) / 256;

  const dist = Math.sqrt(
    weightR * dr * dr + weightG * dg * dg + weightB * db * db
  );
  return dist;
}

// ========================================
// Hue Distance (রঙের Family একই কিনা)
// ========================================
export function hueDistance(c1, c2) {
  const h1 = rgbToHue(c1.r, c1.g, c1.b);
  const h2 = rgbToHue(c2.r, c2.g, c2.b);
  let diff = Math.abs(h1 - h2);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

// ========================================
// শক্তিশালী Match Score — Combined Logic
// ========================================
export function computeMatchScore(scanned, candidate) {
  const colorDist = colorDistance(scanned, candidate);
  const hDist = hueDistance(scanned, candidate);
  const s1 = rgbToSaturation(scanned.r, scanned.g, scanned.b);
  const s2 = rgbToSaturation(candidate.r, candidate.g, candidate.b);
  const sDiff = Math.abs(s1 - s2) * 100;

  // Score কতটা কাছাকাছি: কম = ভালো
  // Color Distance + Hue Distance + Saturation Difference
  const score = colorDist * 0.6 + hDist * 1.2 + sDiff * 0.6;
  return score;
}

// ========================================
// শক্তিশালী Image Matching — Top N ম্যাচ বের করা
// ========================================
export function findMatchingImages(scannedColor, images, maxResults = 6) {
  if (!images || images.length === 0) return [];

  // প্রতিটি Image-এর সাথে Score হিসাব
  const scored = images.map((img) => {
    const candidateColor = img.color || hexToRgb(img.hex);
    return {
      ...img,
      score: computeMatchScore(scannedColor, candidateColor),
    };
  });

  // Sort করে কাছাকাছি যেগুলো সেগুলো আগে
  scored.sort((a, b) => a.score - b.score);

  // Best Score থেকে 25% পর্যন্ত Tolerance দিই
  const bestScore = scored[0]?.score || 0;
  const threshold = Math.max(bestScore * 1.25, 30);

  // Threshold-এর মধ্যে যেগুলো আছে সেগুলো নিই
  const matched = scored.filter((img) => img.score <= threshold);

  // Max Results-এ সীমাবদ্ধ
  return matched.slice(0, maxResults);
}

// ========================================
// HEX → RGB
// ========================================
export function hexToRgb(hex) {
  if (!hex) return { r: 128, g: 128, b: 128 };
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}
