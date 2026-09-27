// ========================================
// Solid Color Image Validation
// ছবিটা একরঙা কিনা পরীক্ষা করে
// Threshold: 12% (আপনার চাহিদা অনুযায়ী)
// ========================================

export function isSolidColorImage(imageSrc, threshold = 12) {
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

        // ১। Average Color বের করি
        let sumR = 0,
          sumG = 0,
          sumB = 0,
          count = 0;
        for (let i = 0; i < imageData.length; i += 4) {
          const a = imageData[i + 3];
          if (a < 128) continue;
          sumR += imageData[i];
          sumG += imageData[i + 1];
          sumB += imageData[i + 2];
          count++;
        }

        if (count === 0) {
          resolve({
            isSolid: false,
            score: 100,
            reason: "ছবিতে কোনো Pixel পাওয়া যায়নি",
          });
          return;
        }

        const avgR = sumR / count;
        const avgG = sumG / count;
        const avgB = sumB / count;

        // ২। প্রতিটি Pixel-এর Distance বের করি
        let totalDistance = 0;
        let maxDistance = 0;
        let distanceCount = 0;

        for (let i = 0; i < imageData.length; i += 4) {
          const a = imageData[i + 3];
          if (a < 128) continue;

          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];

          const dr = r - avgR;
          const dg = g - avgG;
          const db = b - avgB;

          const dist = Math.sqrt(dr * dr + dg * dg + db * db);
          totalDistance += dist;
          if (dist > maxDistance) maxDistance = dist;
          distanceCount++;
        }

        const avgDistance = totalDistance / distanceCount;

        // ৩। Score হিসাব (%)
        // Distance 0 = Perfect Solid
        // Distance 100+ = Complex
        const score = (avgDistance / 255) * 100;
        const maxScore = (maxDistance / 255) * 100;

        // ৪। সিদ্ধান্ত — 12% Threshold
        const isSolid = score <= threshold;

        resolve({
          isSolid,
          score: parseFloat(score.toFixed(2)),
          maxScore: parseFloat(maxScore.toFixed(2)),
          reason: isSolid
            ? "একরঙা ছবি শনাক্ত হয়েছে"
            : `ছবিতে অনেক রঙ আছে (${score.toFixed(1)}%)`,
        });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("ছবি লোড করা যায়নি"));
    img.src = imageSrc;
  });
}

// ========================================
// Base64 থেকে File বানানো (প্রয়োজন হলে)
// ========================================
export function dataURLtoFile(dataUrl, filename) {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}
