import { supabase } from "../lib/supabaseClient";

// ========================================
// নিজের Balance আনা
// ========================================
export async function getMyBalance() {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) return 0;

  const { data, error } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      await supabase
        .from("wallets")
        .insert({ user_id: user.id, balance: 0 });
      return 0;
    }
    console.error("Balance error:", error);
    return 0;
  }

  return data?.balance || 0;
}

// ========================================
// Unlock + টাকা যোগ (RPC Call)
// ========================================
export async function unlockColor(colorId, ownerId) {
  const { data, error } = await supabase.rpc("unlock_color", {
    p_color_id: colorId,
    p_owner_id: ownerId,
  });

  if (error) throw error;
  return data;
}

// ========================================
// E-Wallet Methods
// ========================================
export const WALLET_METHODS = [
  { id: "bkash", label: "বিকাশ", icon: "📱", color: "#E2136E" },
  { id: "nagad", label: "নগদ", icon: "📲", color: "#EE7623" },
  { id: "rocket", label: "রকেট", icon: "🚀", color: "#8C3494" },
  { id: "upay", label: "উপায়", icon: "💳", color: "#FF6B00" },
];

// ========================================
// নিজের E-Wallets আনা
// ========================================
export async function getMyWallets() {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_wallets")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Wallets load error:", error);
    return [];
  }
  return data || [];
}

// ========================================
// নতুন E-Wallet সেভ
// ========================================
export async function saveWallet({ method, number, isDefault = false }) {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) throw new Error("Not authenticated");

  // যদি Default হয় → আগের সব Default Clear করি
  if (isDefault) {
    await supabase
      .from("user_wallets")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }

  // Upsert (Insert or Update)
  const { data, error } = await supabase
    .from("user_wallets")
    .upsert(
      {
        user_id: user.id,
        method: method,
        number: number,
        is_default: isDefault,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,method" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ========================================
// Wallet Delete
// ========================================
export async function deleteWallet(walletId) {
  const { error } = await supabase
    .from("user_wallets")
    .delete()
    .eq("id", walletId);

  if (error) throw error;
  return true;
}

// ========================================
// Default Wallet Set
// ========================================
export async function setDefaultWallet(walletId) {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) throw new Error("Not authenticated");

  // সব Default Clear
  await supabase
    .from("user_wallets")
    .update({ is_default: false })
    .eq("user_id", user.id);

  // শুধু একটি Default
  const { error } = await supabase
    .from("user_wallets")
    .update({ is_default: true })
    .eq("id", walletId);

  if (error) throw error;
  return true;
}
