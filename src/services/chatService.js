import { supabase } from "../lib/supabaseClient";

// ========================================
// Gemini API Config
// ========================================
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// ========================================
// System Prompt — AI-কে বলা হবে সে কে
// ========================================
const SYSTEM_PROMPT = `তুমি "Color Match" ওয়েবসাইটের AI সহায়ক। তোমার নাম "Color Assistant"।

তোমার কাজ:
1. ব্যবহারকারীদের বাংলায় সাহায্য করা
2. ওয়েবসাইট সম্পর্কিত প্রশ্নের উত্তর দেওয়া
3. বিনয়ী, সহায়ক ও সংক্ষিপ্ত উত্তর দেওয়া
4. কখনো রুক্ষ বা অসম্মানজনক ভাষা ব্যবহার করবে না

ওয়েবসাইট সম্পর্কে তথ্য:
- নাম: Color Match
- কাজ: ব্যবহারকারীরা ছবি আপলোড করে রঙ বিশ্লেষণ করতে পারেন
- গ্লোবাল গ্যালারি: সব ইউজারের শেয়ার করা ছবি
- AI স্ক্যানার: ক্যামেরা বা গ্যালারি দিয়ে কালার স্ক্যান করা যায়
- Details Unlock: Ad দেখলে Details পাওয়া যায়
- Premium: মাসিক ৳৩০০, বার্ষিক ৳২০০০
- Premium সুবিধা: Ad ছাড়াই Details Unlock
- Withdraw: Balance ৳৩০০ হলে Withdraw করা যায়
- Payment Method: বিকাশ, নগদ, রকেট, উপায়
- Support WhatsApp: 01918568313

নিয়ম:
- সংক্ষিপ্ত উত্তর দেবে (সর্বোচ্চ ২-৩ বাক্য)
- যদি প্রশ্নের উত্তর না জানো, তাহলে বলবে "আমি নিশ্চিত নই, Support Team-এর সাথে যোগাযোগ করুন: WhatsApp 01918568313"
- ইমোজি ব্যবহার করবে কিন্তু মাত্রা বজায় রাখবে
- ব্যবহারকারীকে কখনো টাকা পাঠাতে বলবে না
- কখনো পাসওয়ার্ড বা গোপন তথ্য চাইবে না`;

// ========================================
// Gemini API-তে Message পাঠানো
// ========================================
export async function getAIResponse(userMessage, conversationHistory = []) {
  if (!GEMINI_API_KEY) {
    return {
      success: false,
      message:
        "AI Service Configuration Missing। Support Team-এর সাথে যোগাযোগ করুন।",
    };
  }

  try {
    // Conversation History প্রস্তুত করি
    const contents = [];

    // System Prompt প্রথমে
    contents.push({
      role: "user",
      parts: [{ text: SYSTEM_PROMPT }],
    });
    contents.push({
      role: "model",
      parts: [
        {
          text: "বুঝেছি! আমি Color Match-এর AI সহায়ক। ব্যবহারকারীদের বাংলায় সাহায্য করব।",
        },
      ],
    });

    // পূর্বের Messages
    conversationHistory.slice(-10).forEach((msg) => {
      contents.push({
        role: msg.sender_type === "user" ? "user" : "model",
        parts: [{ text: msg.message }],
      });
    });

    // বর্তমান Message
    contents.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    // API Call
    const response = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 250,
            topP: 0.9,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      throw new Error("API request failed");
    }

    const data = await response.json();

    const aiText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "দুঃখিত, এইমাত্র উত্তর দিতে পারছি না। Support Team-এর সাথে যোগাযোগ করুন।";

    return {
      success: true,
      message: aiText.trim(),
    };
  } catch (err) {
    console.error("AI Response Error:", err);
    return {
      success: false,
      message:
        "দুঃখিত, এখন AI সেবা কাজ করছে না। WhatsApp-এ যোগাযোগ করুন: 01918568313",
    };
  }
}

// ========================================
// নিজের Chat Thread আনা অথবা তৈরি করা
// ========================================
export async function getOrCreateThread(userName, userCode) {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) throw new Error("Not authenticated");

  // প্রথমে চেক করি Thread আছে কিনা
  const { data: existing } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (existing) return existing;

  // না থাকলে নতুন তৈরি করি
  const { data: created, error } = await supabase
    .from("chat_threads")
    .insert({
      user_id: user.id,
      user_name: userName,
      user_code: userCode,
      last_message: "",
      user_unread: 0,
      admin_unread: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return created;
}

// ========================================
// Thread-এর সব Message আনা
// ========================================
export async function getMessages(threadId) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Messages load error:", error);
    return [];
  }
  return data || [];
}

// ========================================
// নতুন Message Save করা
// ========================================
export async function saveMessage({
  threadId,
  senderId,
  senderType,
  senderName,
  message,
  imageUrl = "",
}) {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      thread_id: threadId,
      sender_id: senderId,
      sender_type: senderType,
      sender_name: senderName,
      message: message,
      image_url: imageUrl,
      is_read: false,
    })
    .select()
    .single();

  if (error) throw error;

  // Thread-এর Last Message Update করি
  await supabase
    .from("chat_threads")
    .update({
      last_message: message.slice(0, 100),
      last_message_at: new Date().toISOString(),
      admin_unread:
        senderType === "user" ? supabase.rpc ? undefined : undefined : undefined,
    })
    .eq("id", threadId);

  return data;
}

// ========================================
// Thread-এর Last Message Update (সহজ)
// ========================================
export async function updateThreadLastMessage(
  threadId,
  message,
  incrementUserUnread = false
) {
  const updates = {
    last_message: message.slice(0, 100),
    last_message_at: new Date().toISOString(),
  };

  if (incrementUserUnread) {
    const { data: thread } = await supabase
      .from("chat_threads")
      .select("user_unread")
      .eq("id", threadId)
      .single();

    updates.user_unread = (thread?.user_unread || 0) + 1;
  }

  await supabase.from("chat_threads").update(updates).eq("id", threadId);
}

// ========================================
// User-এর সব Message Read Mark
// ========================================
export async function markThreadRead(threadId, readerType) {
  // Messages Read Mark
  const { data: thread } = await supabase
    .from("chat_threads")
    .select("user_id")
    .eq("id", threadId)
    .single();

  if (!thread) return;

  // Thread-এর Unread Reset করি
  if (readerType === "user") {
    await supabase
      .from("chat_threads")
      .update({ user_unread: 0 })
      .eq("id", threadId);
  } else if (readerType === "admin") {
    await supabase
      .from("chat_threads")
      .update({ admin_unread: 0 })
      .eq("id", threadId);
  }
}

// ========================================
// Real-time Subscribe (নতুন Message এলে)
// ========================================
export function subscribeToMessages(threadId, callback) {
  const channel = supabase
    .channel(`chat-${threadId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// ========================================
// User-এর Unread Count
// ========================================
export async function getUnreadCount() {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) return 0;

  const { data, error } = await supabase
    .from("chat_threads")
    .select("user_unread")
    .eq("user_id", user.id)
    .single();

  if (error || !data) return 0;
  return data.user_unread || 0;
}

// ========================================
// Time Format
// ========================================
export function formatChatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("bn-BD", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
