"use client";

const styles = `
  .agent-card {
    background: rgba(13,20,32,0.6);
    border: 1px solid rgba(30,58,95,0.4);
    border-radius: 12px; padding: 16px;
    transition: border-color 0.2s;
  }
  .agent-card:hover { border-color: rgba(78,205,196,0.3); }
  .agent-header {
    display: flex; justify-content: space-between;
    align-items: center; margin-bottom: 10px;
  }
  .agent-name { font-size: 12px; font-weight: 600; color: #7A9BC4; }
  .agent-score { font-family: monospace; font-size: 22px; font-weight: 700; }
  .agent-bar-bg {
    height: 4px; background: rgba(30,58,95,0.5);
    border-radius: 2px; margin: 8px 0;
  }
  .agent-bar-fill { height: 100%; border-radius: 2px; transition: width 0.8s ease; }
  .agent-summary { font-size: 11px; color: #4A6FA5; line-height: 1.5; }
  .agent-confidence { font-family: monospace; font-size: 10px; color: #2A4A6F; margin-top: 6px; }
  .agent-signals { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
  .agent-tag {
    font-size: 10px; padding: 2px 8px; border-radius: 20px; font-weight: 500;
  }
  .agent-tag.pos { background: rgba(0,212,170,0.1); color: #00D4AA; border: 1px solid rgba(0,212,170,0.2); }
  .agent-tag.neg { background: rgba(255,107,107,0.1); color: #FF6B6B; border: 1px solid rgba(255,107,107,0.2); }
`;

export default function AgentCard({ name, icon, data }) {
  if (!data) return null;
  const rawScore = data.signal_score || 300;
  
  // Convert 300-900 range to 0-100 percentage for visualization
  const pct = Math.round(((rawScore - 300) / 600) * 100);
  
  const color =
    pct >= 70 ? "#00D4AA" : pct >= 50 ? "#4ECDC4" : pct >= 35 ? "#FFB347" : "#FF6B6B";

  return (
    <>
      <style>{styles}</style>
      <div className="agent-card">
        <div className="agent-header">
          <div className="agent-name">
            {icon} {name}
          </div>
          <div className="agent-score" style={{ color }}>
            {rawScore}
          </div>
        </div>
        <div className="agent-bar-bg">
          <div
            className="agent-bar-fill"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
        <div className="agent-summary">{data.summary || "Analysis in progress..."}</div>
        <div className="agent-confidence">
          confidence: {Math.round((data.confidence || 0) * 100)}%
        </div>
        <div className="agent-signals">
          {data.positive_signals?.slice(0, 2).map((s, i) => (
            <span key={i} className="agent-tag pos">✓ {s}</span>
          ))}
          {data.risk_signals?.slice(0, 1).map((s, i) => (
            <span key={i} className="agent-tag neg">⚠ {s}</span>
          ))}
        </div>
      </div>
    </>
  );
}
