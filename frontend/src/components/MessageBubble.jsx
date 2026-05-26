import ReactMarkdown from "react-markdown";

export default function MessageBubble({ message, onSelect, selected }) {
  const isUser = message.role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "16px",
    }}>
      <div
        onClick={() => !isUser && onSelect?.(message)}
        style={{
          maxWidth: "72%",
          padding: "12px 16px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser ? "#2C1810" : "#FDFAF4",
          color: isUser ? "#F5F0E8" : "#2C1810",
          border: isUser ? "none" : `1px solid ${selected ? "#8B6914" : "#D4C5A9"}`,
          fontSize: "14px",
          lineHeight: "1.75",
          cursor: isUser ? "default" : "pointer",
          boxShadow: selected ? "0 0 0 2px #8B6914" : "none",
          fontFamily: "'Source Serif 4', Georgia, serif",
          transition: "box-shadow 0.15s, border-color 0.15s",
        }}
      >
        {isUser ? (
          <span>{message.content}</span>
        ) : (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        )}

        {!isUser && message.entities_found?.length > 0 && (
          <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {message.entities_found.map((e, i) => (
              <span key={i} style={{
                fontSize: "11px",
                background: "#EDE8DC",
                color: "#8B6914",
                borderRadius: "4px",
                padding: "2px 8px",
                border: "1px solid #D4C5A9",
                fontStyle: "italic",
              }}>
                {e}
              </span>
            ))}
          </div>
        )}

        {!isUser && (
          <div style={{
            marginTop: "8px",
            fontSize: "11px",
            color: selected ? "#8B6914" : "#A0906E",
            fontStyle: "italic",
            transition: "color 0.15s",
          }}>
            {selected ? "Viewing sources →" : "Click to view sources"}
          </div>
        )}
      </div>
    </div>
  );
}