// একটি ছবি থেকে Dominant Color (প্রধান রঙ) বের করার ফাংশন
export function extractDominantColor(imageSrc) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // ছোট সাইজে রিসাইজ করে নিলে দ্রুত হয়
        const size = 80;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size).data;

        // রঙগুলো গ্রুপ করে সবচেয়ে বেশি ব্যবহৃত রঙ বের করি
        const colorCount = {};
        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];
          if (a < 128) continue; // Transparent pixel বাদ

          // প্রতিটি রঙকে ৮-ভাগে Round করি (Grouping)
          const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${
            Math.round(b / 32) * 32
          }`;
          if (!colorCount[key]) colorCount[key] = { count: 0, r, g, b };
          colorCount[key].count++;
        }

        // সবচেয়ে বেশি ব্যবহৃত রঙ বের করি
        let topColor = { r: 0, g: 0, b: 0 };
        let topCount = 0;
        for (const key in colorCount) {
          if (colorCount[key].count > topCount) {
            topCount = colorCount[key].count;
            const c = colorCount[key];
            topColor = { r: c.r, g: c.g, b: c.b };
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

// RGB → HEX
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

// দুইটি রঙের মধ্যে পার্থক্য (0 = একদম একই, বড় সংখ্যা = বেশি পার্থক্য)
export function colorDistance(c1, c2) {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// একটি রঙের সাথে মিলে যায় এমন ছবি খোঁজা
// threshold = কতটা কাছাকাছি হতে হবে (0-441, ছোট হলে কঠিন ম্যাচ)
export function findMatchingImages(scannedColor, images, threshold = 90) {
  return images
    .map((img) => ({
      ...img,
      distance: colorDistance(scannedColor, img.color),
    }))
    .filter((img) => img.distance <= threshold)
    .sort((a, b) => a.distance - b.distance);
}
