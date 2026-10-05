import { supabase } from "../lib/supabaseClient";

// ========================================
// Premium Plans
// ========================================
export const PREMIUM_PLANS = [
  {
    id: "monthly",
    name: "মাসিক",
    price: 300,
    duration: "৩০ দিন",
    days: 30,
    badge: "জনপ্রিয়",
    features: [
      "অ্যাড ছাড়া Details Unlock",
      "সব ছবির Details দেখুন",
      "প্রায়োরিটি সাপোর্ট",
      "আনলিমিটেড স্ক্যান",
    ],
  },
  {
    id: "yearly",
    name: "বার্ষিক",
    price: 2000,
    duration: "৩৬৫ দিন",
    days: 365,
    badge: "সেরা মূল্য",
    savings: "৳১৬০০ সঞ্চয়",
    features: [
      "সব মাসিক সুবিধা",
      "২ মাস ফ্রি (৳৬০০ সঞ্চয়)",
      "Premium Badge",
      "সব ফিচারে অগ্রাধিকার",
    ],
  },
];

// ========================================
// Payment Methods
// ========================================
export const PAYMENT_METHODS = [
  {
    id: "bkash",
    label: "বিকাশ",
    number: "01918568313",
    icon: "📱",
    color: "#E2136E",
  },
  {
    id: "nagad",
    label: "নগদ",
    number: "01918568313",
    icon: "📲",
    color: "#EE7623",
  },
  {
    id: "rocket",
    label: "রকেট",
    number: "01918568313",
    icon: "🚀",
    color: "#8C3494",
  },
];

// ========================================
// Screenshot Upload
// ========================================
export async function uploadScreenshot(file, userId) {
  if (!file) throw new Error("Screenshot Select করা হয়নি।");

  // File Size Check (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Screenshot ৫MB এর ছোট হতে হবে।");
  }

  // File Type Check
  if (!file.type.startsWith("image/")) {
    throw new Error("শুধু Image File Upload করা যাবে।");
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from("payment-screenshots")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("payment-screenshots")
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// ========================================
// Premium Request Submit
// ========================================
export async function submitPremiumRequest({
  userId,
  userCode,
  ownerName,
  plan,
  amount,
  paymentMethod,
  trxId,
  senderNumber,
  screenshotUrl,
}) {
  const { data, error } = await supabase
    .from("premium_requests")
    .insert({
      user_id: userId,
      user_code: userCode,
      owner_name: ownerName,
      plan: plan,
      amount: amount,
      payment_method: paymentMethod,
      trx_id: trxId,
      sender_number: senderNumber,
      screenshot_url: screenshotUrl,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ========================================
// নিজের Premium Requests আনা
// ========================================
export async function getMyPremiumRequests() {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from("premium_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Premium requests load error:", error);
    return [];
  }
  return data || [];
}

// ========================================
// Premium Status
// ========================================
export async function getMyPremiumStatus() {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) return { isPremium: false, expiresAt: null };

  const { data, error } = await supabase
    .from("profiles")
    .select("is_premium, premium_expires_at")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    return { isPremium: false, expiresAt: null };
  }

  let isPremium = data.is_premium;
  let expiresAt = data.premium_expires_at;

  if (isPremium && expiresAt) {
    if (new Date(expiresAt) < new Date()) {
      isPremium = false;
    }
  }

  return { isPremium, expiresAt };
}

// ========================================
// Format Date
// ========================================
export function formatPremiumDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ========================================
// Days Left
// ========================================
export function getDaysLeft(expiresAt) {
  if (!expiresAt) return 0;
  const now = new Date();
  const exp = new Date(expiresAt);
  const diff = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}
