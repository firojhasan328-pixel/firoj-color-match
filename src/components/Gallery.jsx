import React from "react";

export default function Gallery({ images = [] }) {
  // এই ধাপে Sample Image দিয়ে Design দেখাচ্ছি
  // পরের ধাপে Supabase Storage থেকে আসল Image আসবে
  const sampleImages = [
    {
      id: 1,
      url: "https://images.unsplash.com/photo-1520975954732-35dd22299614?w=600",
      caption: "Sunset Tone",
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600",
      caption: "Forest Green",
    },
    {
      id: 3,
      url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600",
      caption: "Mountain Blue",
    },
    {
      id: 4,
      url: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600",
      caption: "Pink Bloom",
    },
    {
      id: 5,
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600",
      caption: "Ocean Calm",
    },
    {
      id: 6,
      url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600",
      caption: "Deep Woods",
    },
  ];

  const displayImages = images.length > 0 ? images : sampleImages;

  return (
    <div className="gallery-grid">
      {displayImages.length === 0 ? (
        <div className="empty-gallery">
          এখনো কোনো ছবি যুক্ত হয়নি। প্রথম ছবিটি আপনিই যুক্ত করুন!
        </div>
      ) : (
        displayImages.map((img) => (
          <div key={img.id} className="gallery-item">
            <img src={img.url} alt={img.caption || "Color"} loading="lazy" />
            {img.caption && <div className="caption">{img.caption}</div>}
          </div>
        ))
      )}
    </div>
  );
}
