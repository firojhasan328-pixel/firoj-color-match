import { supabase } from "../lib/supabaseClient";

// ========================================
// নিজের প্রোফাইল আনা
// ========================================
export async function getMyProfile() {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    // যদি Profile না থাকে (পুরনো User) → তৈরি করি
    if (error.code === "PGRST116") {
      const newCode = await generateUserCode();
      const meta = user.user_metadata || {};

      const { data: created, error: createErr } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          user_code: newCode,
          full_name:
            meta.full_name || user.email?.split("@")[0] || "User",
          email: user.email,
          mobile: meta.mobile || "",
          company: meta.company || "",
          designation: meta.designation || "",
          present_address: meta.present_address || "",
        })
        .select()
        .single();

      if (createErr) throw createErr;
      return created;
    }
    throw error;
  }

  return data;
}

// Fallback: User Code তৈরি
async function generateUserCode() {
  const random = Math.floor(Math.random() * 900000) + 100000;
  return "CM" + random;
}
