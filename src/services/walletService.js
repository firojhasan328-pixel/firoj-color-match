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
    // যদি Wallet না থাকে, তৈরি করি
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
export async function unlockColor(colorId, ownerId) {
  const { data, error } = await supabase.rpc("unlock_color", {
    color_id: colorId,
    owner_id: ownerId,
  });

  if (error) throw error;
  return data;
}
