"use client";

import { useRef, useState } from "react";

const styles = `
  .bulk-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .upload-section {
    background: rgba(13, 20, 32, 0.6);
    border: 2px dashed rgba(0, 212, 170, 0.3);
    border-radius: 12px;
    padding: 32px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .upload-section:hover {
    border-color: rgba(0, 212, 170, 0.6);
    background: rgba(0, 212, 170, 0.03);
  }

  .upload-section.dragover {
    border-color: rgba(0, 212, 170, 0.8);
    background: rgba(0, 212, 170, 0.08);
  }

  .upload-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  .upload-title {
    font-size: 16px;
    font-weight: 600;
    color: #E8EDF5;
    margin-bottom: 4px;
  }

  .upload-desc {
    font-size: 13px;
    color: #7A9BC4;
    margin-bottom: 16px;
  }

  .upload-hint {
    font-size: 12px;
    color: #4A6FA5;
    margin: 12px 0;
  }

  .file-input {
    display: none;
  }

  .upload-btn {
    background: linear-gradient(135deg, #00d4aa, #0066ff);
    border: none;
    color: white;
    padding: 10px 24px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .upload-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(0, 212, 170, 0.25);
  }

  .upload-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .file-selected {
    font-size: 13px;
    color: #00D4AA;
    margin-top: 12px;
    padding: 10px;
    background: rgba(0, 212, 170, 0.08);
    border-radius: 6px;
    border: 1px solid rgba(0, 212, 170, 0.3);
  }

  .results-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .results-title {
    font-size: 16px;
    font-weight: 600;
    color: #E8EDF5;
  }

  .results-stats {
    display: flex;
    gap: 16px;
  }

  .stat-badge {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    background: rgba(30, 58, 95, 0.4);
    color: #7A9BC4;
  }

  .stat-badge.processed {
    background: rgba(0, 212, 170, 0.1);
    color: #00D4AA;
  }

  .results-table {
    width: 100%;
    border-collapse: collapse;
    background: rgba(13, 20, 32, 0.6);
    border: 1px solid rgba(30, 58, 95, 0.4);
    border-radius: 8px;
    overflow: hidden;
    font-family: monospace;
    font-size: 12px;
  }

  .results-table thead {
    background: rgba(30, 58, 95, 0.3);
    border-bottom: 1px solid rgba(30, 58, 95, 0.4);
  }

  .results-table th {
    padding: 12px;
    text-align: left;
    color: #7A9BC4;
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .results-table td {
    padding: 12px;
    border-bottom: 1px solid rgba(30, 58, 95, 0.2);
    color: #E8EDF5;
  }

  .results-table tbody tr:hover {
    background: rgba(0, 212, 170, 0.04);
  }

  .score-cell {
    font-weight: 600;
    letter-spacing: 0.3px;
  }

  .tier-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .tier-a {
    background: rgba(0, 212, 170, 0.15);
    color: #00d4aa;
    border: 1px solid rgba(0, 212, 170, 0.3);
  }

  .tier-b {
    background: rgba(78, 205, 196, 0.15);
    color: #4ecdc4;
    border: 1px solid rgba(78, 205, 196, 0.3);
  }

  .tier-c {
    background: rgba(255, 179, 71, 0.15);
    color: #ffb347;
    border: 1px solid rgba(255, 179, 71, 0.3);
  }

  .tier-d {
    background: rgba(255, 107, 107, 0.15);
    color: #ff6b6b;
    border: 1px solid rgba(255, 107, 107, 0.3);
  }

  .download-btn {
    background: linear-gradient(135deg, #0066ff, #00d4aa);
    border: none;
    color: white;
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 12px;
  }

  .download-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(0, 212, 170, 0.2);
  }

  .error-box {
    padding: 12px;
    background: rgba(255, 107, 107, 0.1);
    border: 1px solid rgba(255, 107, 107, 0.3);
    border-radius: 8px;
    color: #ff6b6b;
    font-size: 12px;
  }

  .loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(0, 212, 170, 0.3);
    border-top-color: #00d4aa;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .empty-state {
    text-align: center;
    padding: 48px 24px;
    color: #4A6FA5;
  }

  .empty-icon {
    font-size: 40px;
    margin-bottom: 12px;
  }

  .empty-text {
    font-size: 14px;
  }

  .score-breakdown {
    display: flex;
    gap: 12px;
    font-size: 11px;
    color: #7A9BC4;
  }

  .score-item {
    padding: 4px 8px;
    background: rgba(30, 58, 95, 0.2);
    border-radius: 4px;
    border: 1px solid rgba(30, 58, 95, 0.3);
  }

  .ml-score {
    color: #00d4aa;
  }

  .agent-score {
    color: #4ecdc4;
  }

  .hybrid-score {
    color: #0066ff;
    font-weight: 600;
  }
`;

export default function BulkPanel() {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [dragover, setDragover] = useState(false);

  const handleFileSelect = (file) => {
    if (file && file.name.endsWith(".csv")) {
      setSelectedFile(file);
      setError(null);
    } else {
      setError("Please select a valid CSV file");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a CSV file");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/score/csv-upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(await res.text());

      const csvText = await res.text();
      const data = parse_csv(csvText);
      setResults({
        count: data.length,
        data,
        csvText,
      });
    } catch (e) {
      setError(`Upload failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const parse_csv = (csvText) => {
    const lines = csvText.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",");
    return lines.slice(1).map((line) => {
      const values = line.split(",");
      const obj = {};
      headers.forEach((header, i) => {
        obj[header.trim()] = values[i]?.trim() || "";
      });
      return obj;
    });
  };

  const downloadCsv = () => {
    if (!results?.csvText) return;
    const blob = new Blob([results.csvText], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "credit-scores.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTierClass = (tier) => {
    const tierLower = tier?.toLowerCase() || "d";
    return `tier-${tierLower}`;
  };

  return (
    <>
      <style>{styles}</style>
      <div className="bulk-container">
        {/* Upload Section */}
        <div
          className={`upload-section ${dragover ? "dragover" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragover(true);
          }}
          onDragLeave={() => setDragover(false)}
        >
          <div className="upload-icon">📁</div>
          <div className="upload-title">Upload CSV for Bulk Scoring</div>
          <div className="upload-desc">Drag & drop or click to select a file</div>
          <div className="upload-hint">
            CSV format: 20 people max • Columns: borrower_name, employment_type,
            monthly_income_est, upi_avg_monthly_inflow, etc.
          </div>
          <button className="upload-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="loading-spinner" /> Processing...
              </>
            ) : (
              "📤 Select CSV File"
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="file-input"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />
          {selectedFile && (
            <div className="file-selected">✓ {selectedFile.name}</div>
          )}
        </div>

        {selectedFile && !results && (
          <button
            className="upload-btn"
            onClick={handleUpload}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "14px",
              fontWeight: "700",
            }}
          >
            {loading ? (
              <>
                <span className="loading-spinner" /> Scoring in progress...
              </>
            ) : (
              "⚡ Start Bulk Scoring"
            )}
          </button>
        )}

        {error && <div className="error-box">⚠ {error}</div>}

        {/* Results Section */}
        {results && !loading && (
          <div className="results-section">
            <div className="results-header">
              <div className="results-title">Bulk Scoring Results</div>
              <div className="results-stats">
                <div className="stat-badge processed">
                  ✓ {results.count} profiles scored
                </div>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Borrower Name</th>
                    <th>ML Score</th>
                    <th>Agent Score</th>
                    <th>Hybrid Score</th>
                    <th>Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {results.data.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.borrower_name || `Profile ${idx + 1}`}</td>
                      <td className="score-cell ml-score">
                        {row.ml_score || "-"}
                      </td>
                      <td className="score-cell agent-score">
                        {row.agent_composite_score || "-"}
                      </td>
                      <td className="score-cell hybrid-score">
                        {row.final_score || "-"}
                      </td>
                      <td>
                        <span className={`tier-badge ${getTierClass(row.credit_tier)}`}>
                          {row.credit_tier || "N/A"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button className="download-btn" onClick={downloadCsv}>
              ⬇ Download Results as CSV
            </button>

            <button
              className="upload-btn"
              onClick={() => {
                setResults(null);
                setSelectedFile(null);
              }}
              style={{ width: "100%" }}
            >
              ◀ Upload Another File
            </button>
          </div>
        )}

        {!selectedFile && !results && (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <div className="empty-text">
              Select a CSV file to score multiple borrowers at once
            </div>
          </div>
        )}
      </div>
    </>
  );
}
