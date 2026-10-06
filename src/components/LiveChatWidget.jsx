import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getMyProfile } from "../services/profileService";
import {
  getAIResponse,
  getOrCreateThread,
  getMessages,
  saveMessage,
  subscribeToMessages,
  updateThreadLastMessage,
  markThreadRead,
  getUnreadCount,
  formatChatTime,
} from "../services/chatService";
import "../styles/chat.css";

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("User");
  const [userCode, setUserCode] = useState("CM000000");
  const [unread, setUnread] = useState(0);

  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // ========================================
  // Initial Load
  // ========================================
  useEffect(() => {
    async function init() {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!user) return;

        setUserId(user.id);

        const profile = await getMyProfile();
        const name = profile?.full_name || "User";
        const code = profile?.user_code || "CM000000";

        setUserName(name);
        setUserCode(code);

        // Thread তৈরি/আনা
        const thread = await getOrCreateThread(name, code);
        setThreadId(thread.id);

        // Messages আনি
        const msgs = await getMessages(thread.id);

        // যদি কোনো Message না থাকে → Welcome Message
        if (msgs.length === 0) {
          const welcomeMsg = {
            thread_id: thread.id,
            sender_id: user.id,
            sender_type: "ai",
            sender_name: "Color Assistant",
            message:
              "আসসালামু আলাইকুম! 👋\n\nআমি Color Assistant — Color Match-এর AI সহায়ক।\n\nআপনাকে কীভাবে সাহায্য করতে পারি?",
            is_read: true,
          };

          const { data: saved } = await supabase
            .from("chat_messages")
            .insert(welcomeMsg)
            .select()
            .single();

          if (saved) setMessages([saved]);
        } else {
          setMessages(msgs);
        }

        // Unread Count
        const count = await getUnreadCount();
        setUnread(count);
      } catch (err) {
        console.error("Chat init error:", err);
      }
    }
    init();
  }, []);

  // ========================================
  // Auto-scroll Bottom
  // ========================================
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ========================================
  // Real-time Subscription (Chat খোলা থাকলে)
  // ========================================
  useEffect(() => {
    if (!threadId || !isOpen) return;

    // আগের Subscription Cleanup
    if (unsubscribeRef.current) unsubscribeRef.current();

    const unsubscribe = subscribeToMessages(threadId, (newMsg) => {
      setMessages((prev) => {
        // Duplicate Check
        if (prev.find((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [threadId, isOpen]);

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
  }, [isOpen, threadId, userId]);

  // ========================================
  // Message Send
  // ========================================
  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || !threadId || !userId || loading) return;

    const userMsg = input.trim();
    setInput("");
    setLoading(true);

    try {
      // ১। User Message Save
      const { data: saved } = await supabase
        .from("chat_messages")
        .insert({
          thread_id: threadId,
          sender_id: userId,
          sender_type: "user",
          sender_name: userName,
          message: userMsg,
          is_read: false,
        })
        .select()
        .single();

      if (saved) {
        setMessages((prev) => [...prev, saved]);
      }

      // ২। Thread Update
      await updateThreadLastMessage(threadId, userMsg, false);

      // ৩। AI-এর Reply আনছি
      setThinking(true);

      const history = messages.slice(-10).map((m) => ({
        sender_type: m.sender_type,
        message: m.message,
      }));

      const aiResponse = await getAIResponse(userMsg, history);

      // ৪। AI Message Save
      const { data: aiSaved } = await supabase
        .from("chat_messages")
        .insert({
          thread_id: threadId,
          sender_id: userId,
          sender_type: "ai",
          sender_name: "Color Assistant",
          message: aiResponse.message,
          is_read: true,
        })
        .select()
        .single();

      if (aiSaved) {
        setMessages((prev) => [...prev, aiSaved]);
      }
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setLoading(false);
      setThinking(false);
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
            <span className="chat-float-badge">{unread}</span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-header-avatar">🤖</div>
              <div>
                <p className="chat-header-name">Color Assistant</p>
                <p className="chat-header-status">
                  <span className="chat-status-dot" /> Online · AI
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

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg) => {
              const isUser = msg.sender_type === "user";
              return (
                <div
                  key={msg.id}
                  className={`chat-bubble-row ${
                    isUser ? "user" : "ai"
                  }`}
                >
                  {!isUser && (
                    <div className="chat-bubble-avatar">🤖</div>
                  )}
                  <div
                    className={`chat-bubble ${
                      isUser ? "user" : "ai"
                    }`}
                  >
                    <p className="chat-bubble-text">{msg.message}</p>
                    <span className="chat-bubble-time">
                      {formatChatTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Thinking Indicator */}
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

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form className="chat-input-form" onSubmit={handleSend}>
            <textarea
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="এখানে লিখুন..."
              rows={1}
              disabled={loading}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!input.trim() || loading}
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
