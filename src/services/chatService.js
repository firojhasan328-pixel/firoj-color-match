import { supabase } from "../lib/supabaseClient";

// ============================================
// 🔗 Supabase Edge Function URL (সরাসরি)
// এই URL আপনার chat-ai function-এর
// ============================================
const CHAT_AI_URL =
  "https://lksajoepjfzpryurkfwn.supabase.co/functions/v1/chat-ai";

// Supabase Anon Key (Vercel env থেকে আসবে)
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ============================================
// 🤖 AI Response — Supabase Edge Function-কে call করে
// ============================================
export async function getAIResponse(userMessage, conversationHistory = []) {
  console.log("🤖 [chatService] getAIResponse called");
  console.log("📝 Message:", userMessage);
  console.log("📜 History count:", conversationHistory.length);

  // Check: Anon Key আছে কি?
  if (!SUPABASE_ANON_KEY) {
    console.error("❌ VITE_SUPABASE_ANON_KEY missing from env!");
    return {
      success: false,
      message:
        "Configuration Error। Support Team-এর সাথে যোগাযোগ করুন: 01918568313",
    };
  }

  try {
    // History প্রস্তুত করি
    const history = conversationHistory.slice(-10).map((msg) => ({
      sender_type: msg.sender_type,
      message: msg.message,
    }));

    console.log("📤 Fetching:", CHAT_AI_URL);

    // Edge Function-এ POST request
    const response = await fetch(CHAT_AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        message: userMessage,
        history: history,
      }),
    });

    console.log("📥 Response Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Response not OK:", errorText);
      return {
        success: false,
        message:
          "দুঃখিত, এখন AI সেবা কাজ করছে না। WhatsApp-এ যোগাযোগ করুন: 01918568313",
      };
    }

    const data = await response.json();
    console.log("✅ Response Data:", data);

    if (data?.success && data?.message) {
      return {
        success: true,
        message: data.message,
      };
    }

    return {
      success: false,
      message:
        data?.message ||
        "দুঃখিত, এখন AI সেবা কাজ করছে না। WhatsApp-এ যোগাযোগ করুন: 01918568313",
    };
  } catch (err) {
    console.error("❌ [chatService] Fetch Error:", err);
    return {
      success: false,
      message:
        "দুঃখিত, এখন AI সেবা কাজ করছে না। WhatsApp-এ যোগাযোগ করুন: 01918568313",
    };
  }
}

// ============================================
// নিজের Chat Thread আনা অথবা তৈরি করা
// ============================================
export async function getOrCreateThread(userName, userCode) {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // Name/Code update করি যদি বদলে থাকে
    if (
      existing.user_name !== userName ||
      existing.user_code !== userCode
    ) {
      await supabase
        .from("chat_threads")
        .update({ user_name: userName, user_code: userCode })
        .eq("id", existing.id);
    }
    return existing;
  }

  // নতুন thread
  const { data: created, error } = await supabase
    .from("chat_threads")
    .insert({
      user_id: user.id,
      user_name: userName,
      user_code: userCode,
      last_message: "",
      user_unread: 0,
      admin_unread: 0,
      status: "open",
    })
    .select()
    .single();

  if (error) throw error;
  return created;
}

// ============================================
// Thread-এর সব Message আনা
// ============================================
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

// ============================================
// নতুন Message Save
// ============================================
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
      is_read: senderType === "ai" || senderType === "admin",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// Thread-এর Last Message Update
// ============================================
export async function updateThreadLastMessage(
  threadId,
  message,
  incrementUnread = false,
  readerType = "user"
) {
  const updates = {
    last_message: message.slice(0, 100),
    last_message_at: new Date().toISOString(),
  };

  if (incrementUnread) {
    if (readerType === "user") {
      const { data: thread } = await supabase
        .from("chat_threads")
        .select("user_unread")
        .eq("id", threadId)
        .single();

      updates.user_unread = (thread?.user_unread || 0) + 1;
    } else if (readerType === "admin") {
      const { data: thread } = await supabase
        .from("chat_threads")
        .select("admin_unread")
        .eq("id", threadId)
        .single();

      updates.admin_unread = (thread?.admin_unread || 0) + 1;
    }
  }

  await supabase.from("chat_threads").update(updates).eq("id", threadId);
}

// ============================================
// Thread Read Mark (RPC)
// ============================================
export async function markThreadRead(threadId, readerType) {
  const { error } = await supabase.rpc("mark_chat_read", {
    p_thread_id: threadId,
    p_reader_type: readerType,
  });

  if (error) {
    console.error("Mark read error:", error);
    return false;
  }
  return true;
}

// ============================================
// Real-time Subscribe — Messages
// ============================================
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

// ============================================
// Real-time Subscribe — Thread Updates
// ============================================
export function subscribeToThread(threadId, callback) {
  const channel = supabase
    .channel(`thread-${threadId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "chat_threads",
        filter: `id=eq.${threadId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// ============================================
// Unread Count
// ============================================
export async function getUnreadCount() {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) return 0;

  const { data, error } = await supabase
    .from("chat_threads")
    .select("user_unread")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return 0;
  return data.user_unread || 0;
}

// ============================================
// Time Format
// ============================================
export function formatChatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("bn-BD", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================
// Sender Label
// ============================================
export function getSenderLabel(senderType, senderName) {
  const map = {
    user: "আপনি",
    ai: "🤖 Color Assistant",
    admin: `🛡️ ${senderName || "Admin"}`,
    system: "⚙️ System",
  };
  return map[senderType] || senderName || "Unknown";
}

// ============================================
// Sender Class (CSS)
// ============================================
export function getSenderClass(senderType) {
  const map = {
    user: "user",
    ai: "ai",
    admin: "admin",
    system: "system",
  };
  return map[senderType] || "ai";
}
