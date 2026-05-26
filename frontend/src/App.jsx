import { useEffect, useState } from "react";
import { getHealth, listDocuments } from "./api/client";
import ChatWindow from "./components/ChatWindow";
import DocumentPanel from "./components/DocumentPanel";
import SourcesPanel from "./components/SourcesPanel";

export default function App() {
  const [docs, setDocs] = useState([]);
  const [stats, setStats] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const refresh = async () => {
    const [docsRes, healthRes] = await Promise.all([listDocuments(), getHealth()]);
    setDocs(docsRes.data.documents);
    setStats(healthRes.data);
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      fontFamily: "'Source Serif 4', Georgia, serif",
      background: "#F5F0E8",
    }}>
      {/* Topbar */}
      <div style={{
        height: "56px",
        borderBottom: "1px solid #D4C5A9",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        justifyContent: "space-between",
        background: "#EDE8DC",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "20px" }}>📜</span>
          <span style={{
            fontFamily: "'Lora', Georgia, serif",
            fontWeight: 700,
            fontSize: "18px",
            color: "#2C1810",
            letterSpacing: "0.01em",
          }}>
            ScholarQA
          </span>
          <span style={{
            fontSize: "11px",
            background: "#2C1810",
            color: "#F5F0E8",
            borderRadius: "4px",
            padding: "2px 8px",
            fontFamily: "'Source Serif 4', serif",
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}>
            Graph RAG
          </span>
        </div>
        {stats && (
          <span style={{
            fontSize: "12px",
            color: "#8B7355",
            fontStyle: "italic",
            fontFamily: "'Lora', serif",
          }}>
            {stats.documents_loaded} doc{stats.documents_loaded !== 1 ? "s" : ""} · {stats.graph_nodes} graph nodes
          </span>
        )}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <DocumentPanel
          docs={docs}
          onDocsChange={refresh}
          stats={stats}
          collapsed={collapsed}
          onToggle={() => setCollapsed(v => !v)}
        />
        <ChatWindow
          hasDocs={docs.length > 0}
          onSelectMessage={setSelectedMessage}
          selectedMessage={selectedMessage}
        />
        <SourcesPanel message={selectedMessage} />
      </div>
    </div>
  );
}