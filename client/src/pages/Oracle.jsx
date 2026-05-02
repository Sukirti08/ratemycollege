import { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../store/toastStore";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { createOracleEventSource } from "../api/oracle";

const GUEST_LIMIT = 10;
const WARN_AT = 7;

const SUGGESTED_PROMPTS = [
  "Compare IIT Bombay vs IIT Delhi",
  "Best NITs for CSE placement?",
  "BITS Pilani vs IIT Roorkee",
  "NIT Trichy hostel life?",
  "IIIT Hyderabad research culture",
  "Which IIT for ECE branch?",
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-6">
      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-sm flex-shrink-0">
        ✦
      </div>
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-5 py-4">
        <div className="flex gap-1.5 items-center h-5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-amber-400"
              style={{ animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div
          className="max-w-[75%] bg-amber-500 text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-sm"
          style={{ fontFamily: "'Lora', serif" }}
        >
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-3 mb-6">
      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-sm flex-shrink-0 shadow">
        ✦
      </div>
      <div className="max-w-[80%] bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-5 py-4">
        <div className="prose prose-sm prose-gray max-w-none" style={{ fontFamily: "'Source Serif 4', serif" }}>
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
        {msg.isStreaming && (
          <span
            className="inline-block w-0.5 h-4 bg-amber-500 ml-0.5 align-middle"
            style={{ animation: "blink 1s step-end infinite" }}
          />
        )}
      </div>
    </div>
  );
}

export default function Oracle() {
  const { user, signInWithGoogle } = useAuthStore();
  const { addToast } = useToastStore();

  const [sessionId] = useState(() => Date.now().toString(36) + Math.random().toString(36).slice(2));
  const [storedMessages, setStoredMessages] = useLocalStorage(`oracle-chat-${sessionId}`, []);

  const [messages, setMessages] = useState(storedMessages || []);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [messageCount, setMessageCount] = useState((storedMessages || []).filter((m) => m.role === "user").length);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, showTyping, scrollToBottom]);

  const saveMessages = useCallback(
    (msgs) => {
      setStoredMessages(msgs);
    },
    [setStoredMessages]
  );

  const handleSend = useCallback(
    async (text) => {
      const trimmed = (text || inputValue).trim();
      if (!trimmed || isStreaming) return;
      if (!user && messageCount >= GUEST_LIMIT) return;

      setInputValue("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";

      const userMsg = { id: Date.now().toString(), role: "user", content: trimmed };
      const assistantMsg = { id: (Date.now() + 1).toString(), role: "assistant", content: "", isStreaming: true };

      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setMessageCount((c) => c + 1);
      setShowTyping(true);
      setIsStreaming(true);

      try {
        const history = newMessages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
        const response = await createOracleEventSource({ message: trimmed, history, sessionId });
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let firstToken = true;
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter(Boolean);

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            try {
              const parsed = JSON.parse(line.slice(5).trim());
              if (parsed.done) {
                const finalMsgs = [...newMessages, { ...assistantMsg, content: accumulated, isStreaming: false }];
                setMessages(finalMsgs);
                saveMessages(finalMsgs);
                setIsStreaming(false);
                setShowTyping(false);
                return;
              }
              if (parsed.token) {
                if (firstToken) {
                  setShowTyping(false);
                  firstToken = false;
                }
                accumulated += parsed.token;
                setMessages([...newMessages, { ...assistantMsg, content: accumulated, isStreaming: true }]);
              }
            } catch {}
          }
        }
      } catch (err) {
        console.error(err);
        addToast({ type: "error", message: "Oracle is taking a break. Try again." });
        setMessages([
          ...messages,
          userMsg,
          {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: "Sorry, I ran into an issue. Please try again in a moment.",
            isStreaming: false,
          },
        ]);
      } finally {
        setIsStreaming(false);
        setShowTyping(false);
      }
    },
    [inputValue, isStreaming, messages, messageCount, user, sessionId, addToast, saveMessages]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e) => {
    setInputValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
  };

  const clearChat = () => {
    setMessages([]);
    setMessageCount(0);
    setStoredMessages([]);
  };

  const isAtLimit = !user && messageCount >= GUEST_LIMIT;
  const showCounter = !user && messageCount >= WARN_AT;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,400&family=Syne:wght@400;600;700;800&display=swap');

        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .oracle-root { height: 100dvh; display: flex; flex-direction: column; background: #fafaf8; font-family: 'Syne', sans-serif; }
        .oracle-header { 
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 1.5rem; height: 64px; 
          background: white; border-bottom: 1px solid #f0ede6;
          box-shadow: 0 1px 0 #f0ede6;
          flex-shrink: 0;
          z-index: 10;
        }
        .oracle-title { display: flex; align-items: center; gap: 0.625rem; }
        .oracle-title h1 { font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em; color: #1a1a1a; margin: 0; }
        .oracle-title .dot { color: #f59e0b; }
        .oracle-caption { font-size: 0.6875rem; color: #9ca3af; font-weight: 400; letter-spacing: 0.06em; text-transform: uppercase; font-family: 'Syne', sans-serif; }
        .oracle-clear { 
          padding: 0.375rem 0.875rem; border-radius: 20px; border: 1px solid #e5e7eb; 
          background: white; font-size: 0.75rem; font-weight: 600; color: #6b7280;
          cursor: pointer; transition: all 0.15s; font-family: 'Syne', sans-serif;
          letter-spacing: 0.02em;
        }
        .oracle-clear:hover { background: #fef3c7; border-color: #f59e0b; color: #d97706; }

        .messages-area { flex: 1; overflow-y: auto; padding: 2rem 1rem; scroll-behavior: smooth; }
        .messages-inner { max-width: 720px; margin: 0 auto; }

        .empty-state { 
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          min-height: calc(100dvh - 220px); text-align: center; padding: 2rem;
          animation: fadeUp 0.4s ease both;
        }
        .oracle-logo { font-size: 4rem; margin-bottom: 1.5rem; filter: drop-shadow(0 4px 24px rgba(245,158,11,0.3)); }
        .empty-state h2 { font-size: 1.75rem; font-weight: 800; color: #1a1a1a; margin: 0 0 0.5rem; letter-spacing: -0.03em; }
        .empty-state p { font-size: 0.9375rem; color: #9ca3af; margin: 0 0 2.5rem; font-family: 'Source Serif 4', serif; font-style: italic; }

        .prompt-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; max-width: 560px; }
        .prompt-chip {
          padding: 0.5rem 1rem; border-radius: 20px; border: 1.5px solid #e5e7eb;
          background: white; font-size: 0.8125rem; font-weight: 600; color: #374151;
          cursor: pointer; transition: all 0.15s; font-family: 'Syne', sans-serif;
          animation: fadeUp 0.4s ease both;
          white-space: nowrap;
        }
        .prompt-chip:hover { border-color: #f59e0b; background: #fffbeb; color: #92400e; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(245,158,11,0.15); }

        .counter-bar {
          max-width: 720px; margin: 0 auto 0.75rem;
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.75rem; color: #d97706; font-weight: 600; letter-spacing: 0.02em;
        }
        .counter-dots { display: flex; gap: 3px; }
        .counter-dot { width: 8px; height: 8px; border-radius: 50%; background: #fde68a; }
        .counter-dot.used { background: #f59e0b; }

        .limit-banner {
          max-width: 720px; margin: 0 auto 1rem;
          background: #1a1a1a; color: white; border-radius: 16px;
          padding: 1rem 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;
          flex-wrap: wrap;
        }
        .limit-banner p { font-size: 0.875rem; margin: 0; }
        .limit-banner strong { color: #fbbf24; }
        .signin-btn {
          padding: 0.5rem 1.25rem; background: #f59e0b; color: white; border: none;
          border-radius: 10px; font-weight: 700; font-size: 0.8125rem; cursor: pointer;
          font-family: 'Syne', sans-serif; white-space: nowrap; transition: background 0.15s;
        }
        .signin-btn:hover { background: #d97706; }

        .input-area {
          padding: 1rem 1rem 1.25rem; background: white; border-top: 1px solid #f0ede6;
          flex-shrink: 0;
        }
        .input-inner { max-width: 720px; margin: 0 auto; position: relative; }
        .input-box {
          width: 100%; display: flex; align-items: flex-end; gap: 0.75rem;
          background: #f9f8f5; border: 1.5px solid #e5e7eb; border-radius: 16px;
          padding: 0.75rem 1rem; box-sizing: border-box;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input-box:focus-within { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.1); background: white; }
        .input-box textarea {
          flex: 1; border: none; background: transparent; resize: none; outline: none;
          font-size: 0.9375rem; line-height: 1.5; color: #1a1a1a; min-height: 24px; max-height: 96px;
          font-family: 'Source Serif 4', serif;
        }
        .input-box textarea::placeholder { color: #9ca3af; font-style: italic; }
        .send-btn {
          width: 36px; height: 36px; border-radius: 10px; background: #f59e0b; border: none;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: all 0.15s; flex-shrink: 0; color: white;
        }
        .send-btn:disabled { background: #e5e7eb; color: #9ca3af; cursor: not-allowed; }
        .send-btn:not(:disabled):hover { background: #d97706; transform: scale(1.05); }
      `}</style>

      <div className="oracle-root">
        {/* Header */}
        <header className="oracle-header">
          <div className="oracle-title">
            <span style={{ fontSize: "1.25rem" }}>✦</span>
            <div>
              <h1>Oracle<span className="dot">.</span></h1>
              <div className="oracle-caption">Powered by Claude</div>
            </div>
          </div>
          {messages.length > 0 && (
            <button className="oracle-clear" onClick={clearChat}>
              Clear chat
            </button>
          )}
        </header>

        {/* Messages */}
        <div className="messages-area">
          <div className="messages-inner">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="oracle-logo">✦</div>
                <h2>Ask anything about Indian colleges</h2>
                <p>Powered by real student reviews + AI</p>
                <div className="prompt-chips">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={prompt}
                      className="prompt-chip"
                      style={{ animationDelay: `${i * 0.07}s` }}
                      onClick={() => handleSend(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}
                {showTyping && <TypingIndicator />}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom */}
        <div className="input-area">
          {showCounter && !isAtLimit && (
            <div className="counter-bar">
              <div className="counter-dots">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className={`counter-dot ${i < messageCount ? "used" : ""}`} />
                ))}
              </div>
              {messageCount} / 10 messages used
            </div>
          )}

          {isAtLimit && (
            <div className="limit-banner">
              <p>
                You've used all <strong>10 free messages</strong>. Sign in for 50 messages per day.
              </p>
              <button className="signin-btn" onClick={signInWithGoogle}>
                Sign in with Google
              </button>
            </div>
          )}

          <div className="input-inner">
            <div className="input-box">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask about colleges, placements, professors..."
                disabled={isAtLimit}
                rows={1}
              />
              <button
                className="send-btn"
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isStreaming || isAtLimit}
                aria-label="Send"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

