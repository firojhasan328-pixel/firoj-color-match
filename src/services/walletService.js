import { supabase } from "../lib/supabaseClient";

// নিজের Balance আনা
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

// Unlock + টাকা যোগ (RPC Call)
// ⚠️ গুরুত্বপূর্ণ: Param-এর নাম p_color_id এবং p_owner_id — SQL Function-এর সাথে মিল রাখতে হবে
export async function unlockColor(colorId, ownerId) {
  const { data, error } = await supabase.rpc("unlock_color", {
    p_color_id: colorId,
    p_owner_id: ownerId,
  });

  if (error) throw error;
  return data;
}
