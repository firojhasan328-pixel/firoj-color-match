import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getMyProfile } from "../services/profileService";
import {
  getAIResponse,
  getOrCreateThread,
  getMessages,
  saveMessage,
  subscribeToMessages,
  subscribeToThread,
  updateThreadLastMessage,
  markThreadRead,
  getUnreadCount,
  formatChatTime,
  getSenderClass,
} from "../services/chatService";
import "../styles/chat.css";

const MODE_AI = "ai";
const MODE_ADMIN = "admin";

export default function LiveChatWidget() {
  // ---------- States ----------
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState(MODE_AI);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("User");
  const [userCode, setUserCode] = useState("CM000000");
  const [unread, setUnread] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [initError, setInitError] = useState("");

  // ---------- Refs ----------
  const messagesEndRef = useRef(null);
  const unsubscribeMsgsRef = useRef(null);
  const unsubscribeThreadRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // ========================================
  // Initial Load
  // ========================================
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!user) {
          if (mounted) setInitError("Login করা নেই");
          return;
        }

        if (!mounted) return;
        setUserId(user.id);

        const profile = await getMyProfile();
        const name = profile?.full_name || "User";
        const code = profile?.user_code || "CM000000";

        if (!mounted) return;
        setUserName(name);
        setUserCode(code);

        // Thread তৈরি/আনা
        const thread = await getOrCreateThread(name, code);
        if (!mounted) return;
        setThreadId(thread.id);

        // Messages আনি
        const msgs = await getMessages(thread.id);

        // যদি কোনো Message না থাকে → Welcome Message
        if (msgs.length === 0) {
          const welcomeMsg = await saveMessage({
            threadId: thread.id,
            senderId: user.id,
            senderType: "ai",
            senderName: "Color Assistant",
            message:
              "আসসালামু আলাইকুম! 👋\n\nআমি Color Assistant — Color Match-এর AI সহায়ক।\n\nআপনাকে কীভাবে সাহায্য করতে পারি?",
          });

          if (!mounted) return;
          if (welcomeMsg) setMessages([welcomeMsg]);
        } else {
          if (!mounted) return;
          setMessages(msgs);
        }

        // Unread Count
        const count = await getUnreadCount();
        if (!mounted) return;
        setUnread(count);
      } catch (err) {
        console.error("Chat init error:", err);
        if (mounted) {
          setInitError(err?.message || "Chat load করা যায়নি");
        }
      }
    }
    init();

    return () => {
      mounted = false;
    };
  }, []);

  // ========================================
  // Auto-scroll Bottom
  // ========================================
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, thinking, adminTyping]);

  // ========================================
  // Real-time Message Subscription
  // ========================================
  useEffect(() => {
    if (!threadId) return;

    if (unsubscribeMsgsRef.current) unsubscribeMsgsRef.current();

    const unsubscribe = subscribeToMessages(threadId, (newMsg) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      if (newMsg.sender_type === "admin" && isOpen && mode === MODE_ADMIN) {
        markThreadRead(threadId, "user");
      }
    });

    unsubscribeMsgsRef.current = unsubscribe;

    return () => {
      if (unsubscribeMsgsRef.current) unsubscribeMsgsRef.current();
    };
  }, [threadId, isOpen, mode]);

  // ========================================
  // Real-time Thread Subscription
  // ========================================
  useEffect(() => {
    if (!threadId) return;

    if (unsubscribeThreadRef.current) unsubscribeThreadRef.current();

    const unsubscribe = subscribeToThread(threadId, (updatedThread) => {
      setAdminTyping(!!updatedThread.admin_typing);
    });

    unsubscribeThreadRef.current = unsubscribe;

    return () => {
      if (unsubscribeThreadRef.current) unsubscribeThreadRef.current();
    };
  }, [threadId]);

  // ========================================
  // Chat খোলা হলে Read Mark
  // ========================================
  useEffect(() => {
    async function markRead() {
      if (isOpen && threadId && userId) {
        await markThreadRead(threadId, "user");
        setUnread(0);
      }
    }
    markRead();
  }, [isOpen, threadId, userId, messages.length]);

  // ========================================
  // Image Select
  // ========================================
  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("ছবি ৫MB এর ছোট হতে হবে।");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("শুধু Image File পাঠানো যাবে।");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
  }

  // ========================================
  // Image Upload to Supabase Storage
  // ========================================
  async function uploadChatImage(file, uid) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${uid}/chat_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("chat-images")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("chat-images")
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }

  // ========================================
  // Message Send (Text + Image)
  // ========================================
  async function handleSend(e) {
    if (e) e.preventDefault();

    if ((!input.trim() && !imageFile) || !threadId || !userId || loading) {
      return;
    }

    const userMsg = input.trim();
    const isAdminMode = mode === MODE_ADMIN;

    setInput("");
    setLoading(true);

    try {
      let imageUrl = "";

      // ---------- Image Upload ----------
      if (imageFile) {
        setUploadingImage(true);
        try {
          imageUrl = await uploadChatImage(imageFile, userId);
        } catch (err) {
          console.error("Image upload error:", err);
          alert("❌ ছবি পাঠানো যায়নি:\n\n" + (err?.message || err));
          setLoading(false);
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
        removeImage();
      }

      // ---------- User Message Save ----------
      let saved = null;
      try {
        saved = await saveMessage({
          threadId,
          senderId: userId,
          senderType: "user",
          senderName: userName,
          message: userMsg || "📷 ছবি",
          imageUrl,
        });
      } catch (saveErr) {
        console.error("❌ saveMessage FAILED:", saveErr);
        alert(
          "❌ মেসেজ Save হয়নি\n\n" +
            "Error: " +
            (saveErr?.message || JSON.stringify(saveErr))
        );
        setInput(userMsg);
        setLoading(false);
        return;
      }

      if (saved) {
        setMessages((prev) => [...prev, saved]);
      }

      // ---------- Update Thread ----------
      try {
        await updateThreadLastMessage(threadId, userMsg || "📷 ছবি", false);
      } catch (updateErr) {
        console.error("⚠️ updateThreadLastMessage FAILED:", updateErr);
      }

      // ---------- AI Mode ----------
      if (!isAdminMode) {
        setThinking(true);

        const history = messages.slice(-10).map((m) => ({
          sender_type: m.sender_type,
          message: m.message,
        }));

        let aiResponse = {
          success: false,
          message:
            "দুঃখিত, এখন AI সেবা কাজ করছে না। WhatsApp-এ যোগাযোগ করুন: 01918568313",
        };

        try {
          aiResponse = await getAIResponse(
            userMsg || "ছবি পাঠিয়েছি",
            history
          );
        } catch (aiErr) {
          console.error("❌ getAIResponse FAILED:", aiErr);
        }

        // AI message save
        try {
          const aiSaved = await saveMessage({
            threadId,
            senderId: userId,
            senderType: "ai",
            senderName: "Color Assistant",
            message: aiResponse.message,
          });

          if (aiSaved) {
            setMessages((prev) => [...prev, aiSaved]);
          }
        } catch (aiSaveErr) {
          console.error("❌ AI saveMessage FAILED:", aiSaveErr);
          // Fallback: local-এ দেখাই
          setMessages((prev) => [
            ...prev,
            {
              id: "temp-ai-" + Date.now(),
              sender_type: "ai",
              sender_name: "Color Assistant",
              message: aiResponse.message,
              created_at: new Date().toISOString(),
              is_read: true,
            },
          ]);
        }

        setThinking(false);
      }
    } catch (err) {
      console.error("❌ Send error (outer):", err);
      alert(
        "❌ মেসেজ পাঠানো যায়নি\n\n" +
          "Error: " +
          (err?.message || JSON.stringify(err))
      );
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // Enter Key Send
  // ========================================
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  // ========================================
  // Mode Switch
  // ========================================
  function handleModeSwitch(newMode) {
    setMode(newMode);

    if (newMode === MODE_ADMIN && threadId) {
      markThreadRead(threadId, "user");
      setUnread(0);
    }
  }

  // ========================================
  // Header Info
  // ========================================
  const headerAvatar = mode === MODE_ADMIN ? "🛡️" : "🤖";
  const headerName =
    mode === MODE_ADMIN ? "Live Support" : "Color Assistant";
  const headerStatus =
    mode === MODE_ADMIN
      ? adminTyping
        ? "টাইপ করছেন..."
        : "Admin Online"
      : "AI · 24/7 Available";

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          className="chat-float-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
        >
          <span className="chat-float-icon">💬</span>
          {unread > 0 && (
            <span className="chat-float-badge">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-top">
              <div className="chat-header-info">
                <div
                  className={`chat-header-avatar ${
                    mode === MODE_ADMIN ? "admin-mode" : ""
                  }`}
                >
                  {headerAvatar}
                </div>
                <div>
                  <p className="chat-header-name">{headerName}</p>
                  <p className="chat-header-status">
                    <span
                      className={`chat-status-dot ${
                        mode === MODE_ADMIN ? "admin" : ""
                      }`}
                    />
                    {headerStatus}
                  </p>
                </div>
              </div>
              <button
                className="chat-header-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="chat-mode-toggle">
              <button
                type="button"
                className={`chat-mode-btn ${
                  mode === MODE_AI ? "active" : ""
                }`}
                onClick={() => handleModeSwitch(MODE_AI)}
              >
                🤖 AI Assistant
              </button>
              <button
                type="button"
                className={`chat-mode-btn ${
                  mode === MODE_ADMIN ? "admin-active" : ""
                }`}
                onClick={() => handleModeSwitch(MODE_ADMIN)}
              >
                🛡️ Live Support
                {unread > 0 && ` (${unread})`}
              </button>
            </div>
          </div>

          {/* Init Error Notice */}
          {initError && (
            <div
              style={{
                padding: "10px 14px",
                background: "#fee2e2",
                color: "#991b1b",
                fontSize: "12px",
                fontWeight: 600,
                textAlign: "center",
                borderBottom: "1px solid #fecaca",
              }}
            >
              ⚠️ {initError}
            </div>
          )}

          {/* Messages */}
          <div className="chat-messages" ref={messagesContainerRef}>
            {messages.map((msg) => {
              const isUser = msg.sender_type === "user";
              const isSystem = msg.sender_type === "system";
              const senderClass = getSenderClass(msg.sender_type);

              if (isSystem) {
                return (
                  <div key={msg.id} className="chat-bubble-row system">
                    <div className="chat-system-msg">{msg.message}</div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`chat-bubble-row ${senderClass}`}
                >
                  {!isUser && (
                    <div
                      className={`chat-bubble-avatar ${
                        senderClass === "admin" ? "admin" : ""
                      }`}
                    >
                      {senderClass === "admin" ? "🛡️" : "🤖"}
                    </div>
                  )}

                  <div className={`chat-bubble-wrap ${senderClass}`}>
                    {!isUser && senderClass === "admin" && (
                      <p className="chat-bubble-sender admin">
                        {msg.sender_name || "Admin"}
                      </p>
                    )}

                    <div className={`chat-bubble ${senderClass}`}>
                      {msg.image_url && (
                        <img
                          src={msg.image_url}
                          alt="Attachment"
                          className="chat-bubble-image"
                          onClick={() =>
                            window.open(msg.image_url, "_blank")
                          }
                        />
                      )}

                      {msg.message && msg.message !== "📷 ছবি" && (
                        <p className="chat-bubble-text">{msg.message}</p>
                      )}

                      <div className="chat-bubble-meta">
                        <span className="chat-bubble-time">
                          {formatChatTime(msg.created_at)}
                        </span>
                        {isUser && (
                          <span
                            className={`chat-read-receipt ${
                              msg.is_read ? "read" : "unread"
                            }`}
                          >
                            {msg.is_read ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* AI Thinking */}
            {thinking && (
              <div className="chat-bubble-row ai">
                <div className="chat-bubble-avatar">🤖</div>
                <div className="chat-bubble ai">
                  <div className="chat-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}

            {/* Admin Typing */}
            {adminTyping && mode === MODE_ADMIN && !thinking && (
              <div className="chat-bubble-row admin">
                <div className="chat-bubble-avatar admin">🛡️</div>
                <div className="chat-bubble admin">
                  <div className="chat-typing admin">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Admin Mode Notice */}
          {mode === MODE_ADMIN && (
            <div className="chat-admin-notice">
              🛡️ Admin-এর সাথে সরাসরি কথা বলছেন — সাধারণত কয়েক মিনিটে
              উত্তর পাবেন
            </div>
          )}

          {/* Image Preview */}
          {imagePreview && (
            <div className="chat-image-preview">
              <img
                src={imagePreview}
                alt="Preview"
                className="chat-image-preview-img"
              />
              <button
                type="button"
                className="chat-image-preview-remove"
                onClick={removeImage}
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          )}

          {/* Input Form */}
          <form className="chat-input-form" onSubmit={handleSend}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: "none" }}
            />

            <button
              type="button"
              className="chat-attach-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || uploadingImage || !threadId}
              aria-label="Attach image"
            >
              📎
            </button>

            <textarea
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                !threadId
                  ? "Chat লোড হচ্ছে..."
                  : mode === MODE_ADMIN
                  ? "Admin-কে মেসেজ লিখুন..."
                  : "AI-কে প্রশ্ন লিখুন..."
              }
              rows={1}
              disabled={loading || !threadId}
            />

            <button
              type="submit"
              className="chat-send-btn"
              disabled={
                (!input.trim() && !imageFile) || loading || !threadId
              }
              aria-label="Send"
            >
              {loading ? "⏳" : "📤"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
