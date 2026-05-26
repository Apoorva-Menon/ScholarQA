export default function SourcesPanel({ message }) {
  if (!message) return (
    <div style={{
      width: "280px",
      minWidth: "280px",
      borderLeft: "1px solid #D4C5A9",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#EDE8DC",
    }}>
      <p style={{
        fontSize: "13px",
        color: "#A0906E",
        textAlign: "center",
        padding: "20px",
        fontStyle: "italic",
        fontFamily: "'Source Serif 4', serif",
        lineHeight: "1.6",
      }}>
        Click an assistant message to view its sources & graph context
      </p>
    </div>
  );

  const { vector_chunks = [], graph_results = [] } = message;
  const entities = graph_results.filter(r => r.type === "entity");
  const relationships = graph_results.filter(r => r.type === "relationship");

  return (
    <div style={{
      width: "280px",
      minWidth: "280px",
      borderLeft: "1px solid #D4C5A9",
      display: "flex",
      flexDirection: "column",
      background: "#EDE8DC",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "14px 16px",
        borderBottom: "1px solid #D4C5A9",
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'Lora', serif",
          fontWeight: 600,
          fontSize: "14px",
          color: "#2C1810",
        }}>
          Sources & Graph
        </span>
      </div>

      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}>

        {/* Vector chunks */}
        {vector_chunks.length > 0 && (
          <div>
            <p style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "#8B7355",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "10px",
              fontFamily: "'Source Serif 4', serif",
            }}>
              Retrieved passages
            </p>
            {vector_chunks.map((chunk, i) => (
              <div key={i} style={{
                background: "#F5F0E8",
                border: "1px solid #D4C5A9",
                borderRadius: "8px",
                padding: "10px 12px",
                marginBottom: "8px",
                fontSize: "12px",
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                  alignItems: "baseline",
                }}>
                  <span style={{
                    color: "#2C1810",
                    fontWeight: 600,
                    fontFamily: "'Lora', serif",
                    fontSize: "11px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "160px",
                  }}>
                    {chunk.metadata.source}
                  </span>
                  <span style={{
                    color: "#8B6914",
                    fontSize: "11px",
                    fontStyle: "italic",
                    flexShrink: 0,
                  }}>
                    {(chunk.score * 100).toFixed(0)}% match
                  </span>
                </div>
                <p style={{
                  color: "#5C4A32",
                  lineHeight: "1.6",
                  margin: 0,
                  fontFamily: "'Source Serif 4', serif",
                }}>
                  {chunk.text.slice(0, 200)}{chunk.text.length > 200 ? "…" : ""}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Graph entities */}
        {entities.length > 0 && (
          <div>
            <p style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "#8B7355",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "10px",
              fontFamily: "'Source Serif 4', serif",
            }}>
              Entities
            </p>
            {entities.map((e, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
                fontSize: "12px",
              }}>
                <span style={{
                  background: "#2C1810",
                  color: "#F5F0E8",
                  borderRadius: "4px",
                  padding: "2px 7px",
                  fontSize: "10px",
                  fontFamily: "'Source Serif 4', serif",
                  letterSpacing: "0.04em",
                  flexShrink: 0,
                }}>
                  {e.entity_type}
                </span>
                <span style={{ color: "#2C1810", fontFamily: "'Source Serif 4', serif" }}>
                  {e.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Relationships */}
        {relationships.length > 0 && (
          <div>
            <p style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "#8B7355",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "10px",
              fontFamily: "'Source Serif 4', serif",
            }}>
              Relationships
            </p>
            {relationships.map((r, i) => (
              <div key={i} style={{
                fontSize: "12px",
                color: "#2C1810",
                marginBottom: "8px",
                lineHeight: "1.6",
                fontFamily: "'Source Serif 4', serif",
                padding: "8px 10px",
                background: "#F5F0E8",
                border: "1px solid #D4C5A9",
                borderRadius: "6px",
              }}>
                <span style={{ fontWeight: 600 }}>{r.source}</span>
                <span style={{ color: "#8B6914", margin: "0 6px", fontStyle: "italic" }}>
                  {r.relation}
                </span>
                <span style={{ fontWeight: 600 }}>{r.target}</span>
              </div>
            ))}
          </div>
        )}

        {vector_chunks.length === 0 && entities.length === 0 && (
          <p style={{
            fontSize: "13px",
            color: "#A0906E",
            fontStyle: "italic",
            fontFamily: "'Source Serif 4', serif",
          }}>
            No sources retrieved for this message.
          </p>
        )}
      </div>
    </div>
  );
}