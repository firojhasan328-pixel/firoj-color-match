import { supabase } from "../lib/supabaseClient";

// ছবি Storage-এ আপলোড
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

// Database-এ color info সেভ
export async function saveColorRecord({
  userId,
  ownerName,
  imageUrl,
  color,
  details,
}) {
  const { data, error } = await supabase
    .from("colors")
    .insert({
      user_id: userId,
      owner_name: ownerName,
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

// Global Gallery-র সব ছবি আনা
export async function fetchAllColors() {
  const { data, error } = await supabase
    .from("colors")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}
