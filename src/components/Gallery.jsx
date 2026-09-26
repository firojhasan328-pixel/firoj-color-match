import React, { useEffect, useState } from "react";
import { fetchAllColors } from "../services/colorStorage";

export default function Gallery({ refreshKey = 0 }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchAllColors();
        const mapped = data.map((row) => ({
          id: row.id,
          url: row.image_url,
          caption: row.details?.slice(0, 30) || row.owner_name,
          hex: row.color_hex,
          owner: row.owner_name,
          color: { r: row.color_r, g: row.color_g, b: row.color_b },
          details: row.details,
        }));
        setImages(mapped);
      } catch (err) {
        console.error("Gallery load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="empty-gallery">
        <span className="pulse" /> লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div className="gallery-grid">
      {images.length === 0 ? (
        <div className="empty-gallery">
          এখনো কোনো ছবি যুক্ত হয়নি। প্রথম ছবিটি আপনিই যুক্ত করুন!
        </div>
      ) : (
        images.map((img) => (
          <div key={img.id} className="gallery-item">
            <img src={img.url} alt={img.caption} loading="lazy" />
            {img.caption && <div className="caption">{img.caption}</div>}
          </div>
        ))
      )}
    </div>
  );
}
