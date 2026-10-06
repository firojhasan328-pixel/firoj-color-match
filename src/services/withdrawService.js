import { supabase } from "../lib/supabaseClient";

// ========================================
// নিজের Withdraw History আনা
// ========================================
export async function getMyWithdrawals() {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from("withdrawals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Withdraw load error:", error);
    return [];
  }
  return data || [];
}

// ========================================
// ⭐ নতুন Withdraw Request (RPC — Auto Balance Deduct)
// ========================================
export async function createWithdrawRequest({
  amount,
  paymentMethod,
  accountNumber,
}) {
  const { data, error } = await supabase.rpc(
    "create_withdraw_request",
    {
      p_amount: parseInt(amount),
      p_payment_method: paymentMethod,
      p_account_number: accountNumber,
    }
  );

  if (error) throw error;

  if (!data?.success) {
    throw new Error(data?.message || "Request পাঠানো যায়নি");
  }

  return data;
}

// ========================================
// Pending Withdraw-এর Total হিসাব
// ========================================
export function calculateWithdrawStats(withdrawals) {
  let totalWithdrawn = 0;
  let pendingAmount = 0;

  withdrawals.forEach((w) => {
    if (w.status === "approved") totalWithdrawn += w.amount;
    if (w.status === "pending") pendingAmount += w.amount;
  });

  return { totalWithdrawn, pendingAmount };
}

// ========================================
// Payment Method List
// ========================================
export const PAYMENT_METHODS = [
  { id: "bkash", label: "বিকাশ", icon: "📱", color: "#E2136E" },
  { id: "nagad", label: "নগদ", icon: "📲", color: "#EE7623" },
  { id: "rocket", label: "রকেট", icon: "🚀", color: "#8C3494" },
  { id: "upay", label: "উপায়", icon: "💳", color: "#FF6B00" },
];
