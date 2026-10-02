import { supabase } from "../lib/supabaseClient";

// ========================================
// Login
// ========================================
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

// ========================================
// Signup (Extra Info সহ)
// ========================================
export async function signUpWithEmail(name, email, password, extra = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        mobile: extra.mobile || "",
        company: extra.company || "",
        designation: extra.designation || "",
        present_address: extra.present_address || "",
      },
    },
  });
  if (error) throw error;
  return data;
}

// ========================================
// Logout
// ========================================
export async function signOut() {
  await supabase.auth.signOut();
}
