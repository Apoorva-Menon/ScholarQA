import { useEffect, useRef, useState } from "react";
import { sendChat } from "../api/client";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ hasDocs, onSelectMessage, selectedMessage }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const getHistory = (msgs) =>
    msgs.map(m => ({ role: m.role === "assistant" ? "model" : "user", content: m.content }));

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const query = input.trim();
    setInput("");
    setError(null);

    const userMsg = { role: "user", content: query, id: Date.now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await sendChat(query, getHistory(messages));
      const { answer, vector_chunks, graph_results, entities_found } = res.data;
      setMessages([...updated, {
          role: "assistant",
          content: answer,
          vector_chunks,
          graph_results,
          entities_found,
          id: Date.now() + 1,
        }]);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      background: "#F5F0E8",
    }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", marginTop: "80px", color: "#A0906E" }}>
            <p style={{ fontSize: "36px", marginBottom: "16px" }}>📜</p>
            <p style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#2C1810",
              fontFamily: "'Lora', Georgia, serif",
              marginBottom: "8px",
            }}>
              {hasDocs ? "What would you like to know?" : "Begin by uploading a paper"}
            </p>
            <p style={{
              fontSize: "14px",
              color: "#8B7355",
              fontStyle: "italic",
              lineHeight: "1.6",
            }}>
              {hasDocs
                ? "Ask questions across your uploaded research papers."
                : "Upload a PDF, TXT, or DOCX file using the panel on the left."}
            </p>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            selected={selectedMessage?.id === msg.id}
            onSelect={onSelectMessage}
          />
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "16px" }}>
            <div style={{
              padding: "12px 18px",
              background: "#FDFAF4",
              border: "1px solid #D4C5A9",
              borderRadius: "16px 16px 16px 4px",
              fontSize: "14px",
              color: "#A0906E",
              fontStyle: "italic",
              fontFamily: "'Source Serif 4', serif",
            }}>
              Searching the literature…
            </div>
          </div>
        )}

        {error && (
          <p style={{
            color: "#8B3A2A",
            fontSize: "13px",
            textAlign: "center",
            fontStyle: "italic",
            padding: "8px",
          }}>
            {error}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "16px 24px",
        borderTop: "1px solid #D4C5A9",
        display: "flex",
        gap: "10px",
        background: "#EDE8DC",
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={hasDocs ? "Ask a question about your papers…" : "Upload a paper to begin…"}
          disabled={!hasDocs || loading}
          style={{
            flex: 1,
            padding: "11px 16px",
            border: "1px solid #C4B49A",
            borderRadius: "8px",
            fontSize: "14px",
            outline: "none",
            background: "#F5F0E8",
            color: "#2C1810",
            fontFamily: "'Source Serif 4', Georgia, serif",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!hasDocs || loading || !input.trim()}
          style={{
            padding: "11px 22px",
            background: (!hasDocs || loading || !input.trim()) ? "#C4B49A" : "#2C1810",
            color: (!hasDocs || loading || !input.trim()) ? "#8B7355" : "#F5F0E8",
            border: "none",
            borderRadius: "8px",
            cursor: (!hasDocs || loading || !input.trim()) ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: "13px",
            fontFamily: "'Source Serif 4', serif",
            letterSpacing: "0.03em",
            transition: "background 0.15s",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}