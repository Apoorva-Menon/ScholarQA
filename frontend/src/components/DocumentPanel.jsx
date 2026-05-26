import { useRef, useState } from "react";
import { deleteDocument, uploadDocument } from "../api/client";

export default function DocumentPanel({ docs, onDocsChange, stats, collapsed, onToggle }) {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await uploadDocument(file, (p) => {
        setProgress(p);
        if (p === 100) {
          setUploading(false);
          setProcessing(true);
        }
      });
      onDocsChange();
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
      setProcessing(false);
      setProgress(0);
      fileRef.current.value = "";
    }
  };

  const handleDelete = async (filename) => {
    if (!confirm(`Delete ${filename}?`)) return;
    await deleteDocument(filename);
    onDocsChange();
  };

  return (
    <div style={{
      width: collapsed ? "44px" : "260px",
      minWidth: collapsed ? "44px" : "260px",
      borderRight: "1px solid #D4C5A9",
      display: "flex",
      flexDirection: "column",
      transition: "width 0.25s ease, min-width 0.25s ease",
      overflow: "hidden",
      background: "#EDE8DC",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        padding: collapsed ? "16px 0" : "14px 16px",
        borderBottom: "1px solid #D4C5A9",
        flexShrink: 0,
      }}>
        {!collapsed && (
          <span style={{
            fontFamily: "'Lora', serif",
            fontWeight: 600,
            fontSize: "14px",
            color: "#2C1810",
            letterSpacing: "0.02em",
          }}>
            Documents
          </span>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? "Expand" : "Collapse"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#8B7355",
            fontSize: "14px",
            padding: "2px 4px",
            lineHeight: 1,
            fontFamily: "serif",
          }}
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {!collapsed && (
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}>
          {/* Stats */}
          {stats && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { label: "Papers", value: stats.documents_loaded },
                { label: "Graph nodes", value: stats.graph_nodes },
              ].map(s => (
                <div key={s.label} style={{
                  background: "#F5F0E8",
                  border: "1px solid #D4C5A9",
                  borderRadius: "8px",
                  padding: "10px",
                  textAlign: "center",
                }}>
                  <div style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#2C1810",
                    fontFamily: "'Lora', serif",
                  }}>
                    {s.value}
                  </div>
                  <div style={{
                    fontSize: "11px",
                    color: "#8B7355",
                    marginTop: "2px",
                    fontStyle: "italic",
                  }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload */}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.docx"
              style={{ display: "none" }}
              onChange={handleUpload}
            />
            <button
              onClick={() => fileRef.current.click()}
              disabled={uploading || processing}
              style={{
                width: "100%",
                padding: "9px",
                background: (uploading || processing) ? "#C4B49A" : "#2C1810",
                color: (uploading || processing) ? "#8B7355" : "#F5F0E8",
                border: "none",
                borderRadius: "8px",
                cursor: (uploading || processing) ? "not-allowed" : "pointer",
                fontSize: "13px",
                fontFamily: "'Source Serif 4', serif",
                fontWeight: 600,
              }}
            >
              {uploading
                ? `Uploading ${progress}%`
                : processing
                ? "Ingesting & building graph…"
                : "+ Upload paper"}
            </button>
            {processing && (
              <div style={{
                marginTop: "8px",
                fontSize: "11px",
                color: "#8B7355",
                fontStyle: "italic",
                textAlign: "center",
                lineHeight: "1.6",
              }}>
                Embedding chunks + extracting entities.<br />
                May take a minute for large papers.
              </div>
            )}
            {error && (
              <p style={{ color: "#8B3A2A", fontSize: "12px", marginTop: "6px", fontStyle: "italic" }}>
                {error}
              </p>
            )}
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid #D4C5A9" }} />

          {/* Doc list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {docs.length === 0 ? (
              <p style={{
                fontSize: "13px",
                color: "#A0906E",
                textAlign: "center",
                marginTop: "8px",
                fontStyle: "italic",
                lineHeight: "1.6",
              }}>
                No papers uploaded yet
              </p>
            ) : docs.map(doc => (
              <div key={doc} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#F5F0E8",
                border: "1px solid #D4C5A9",
                borderRadius: "8px",
                padding: "8px 10px",
                gap: "8px",
              }}>
                <span style={{
                  fontSize: "12px",
                  color: "#2C1810",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                  fontFamily: "'Source Serif 4', serif",
                }} title={doc}>
                  📄 {doc}
                </span>
                <button
                  onClick={() => handleDelete(doc)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#A0906E",
                    fontSize: "13px",
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}