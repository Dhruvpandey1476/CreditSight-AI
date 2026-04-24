"use client";

import { useRef, useState } from "react";
import { UploadCloud, CheckCircle2, AlertTriangle, BarChart2, Download, ChevronLeft, Zap, Loader2 } from "lucide-react";

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
    const base = "inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wide border";
    if (tierLower === "a") return `${base} bg-primary/10 text-primary border-primary/30`;
    if (tierLower === "b") return `${base} bg-[#4ecdc4]/10 text-[#4ecdc4] border-[#4ecdc4]/30`;
    if (tierLower === "c") return `${base} bg-[#ffb347]/10 text-[#ffb347] border-[#ffb347]/30`;
    return `${base} bg-red/10 text-red border-red/30`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Upload Section */}
      <div
        className={`bg-surface border border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${
          dragover ? "border-primary bg-primary/5" : "border-border hover:border-text-muted hover:bg-surface2"
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragover(true);
        }}
        onDragLeave={() => setDragover(false)}
      >
        <UploadCloud size={32} className="mx-auto mb-4 text-text-muted" />
        <div className="text-sm font-semibold text-text mb-1">Click to upload or drag and drop</div>
        <div className="text-[11px] text-text-subtle">CSV files only (Max 50MB)</div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
        />
        {selectedFile && (
          <div className="text-sm text-text mt-6 p-3 bg-surface2 rounded-lg border border-border inline-flex items-center gap-2">
            <CheckCircle2 size={16} /> {selectedFile.name}
          </div>
        )}
      </div>

      {selectedFile && !results && (
        <button
          className="max-w-[240px] bg-primary text-primary-foreground border-none p-3 rounded-lg text-sm font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-95 hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Scoring in progress...</>
          ) : (
            <><Zap size={16} /> Start Batch Inference</>
          )}
        </button>
      )}

      {error && (
        <div className="p-4 bg-red/10 border border-red/30 rounded-lg text-sm text-red flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {/* Results Section */}
      {results && !loading && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold text-text">Bulk Scoring Results</div>
            <div className="flex gap-4">
              <div className="px-4 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary flex items-center gap-2">
                <CheckCircle2 size={16} /> {results.count} profiles scored
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-surface2 border-b border-border">
                <tr>
                  <th className="p-4 text-text-muted font-semibold text-xs uppercase tracking-wide">Borrower Name</th>
                  <th className="p-4 text-text-muted font-semibold text-xs uppercase tracking-wide">ML Score</th>
                  <th className="p-4 text-text-muted font-semibold text-xs uppercase tracking-wide">Agent Score</th>
                  <th className="p-4 text-text-muted font-semibold text-xs uppercase tracking-wide">Hybrid Score</th>
                  <th className="p-4 text-text-muted font-semibold text-xs uppercase tracking-wide">Tier</th>
                </tr>
              </thead>
              <tbody>
                {results.data.map((row, idx) => (
                  <tr key={idx} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
                    <td className="p-4 text-text">{row.borrower_name || `Profile ${idx + 1}`}</td>
                    <td className="p-4 font-mono font-semibold text-primary">
                      {row.ml_score || "-"}
                    </td>
                    <td className="p-4 font-mono font-semibold text-[#4ecdc4]">
                      {row.agent_composite_score || "-"}
                    </td>
                    <td className="p-4 font-mono font-bold text-text">
                      {row.final_score || "-"}
                    </td>
                    <td className="p-4">
                      <span className={getTierClass(row.credit_tier)}>
                        {row.credit_tier || "N/A"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="bg-surface2 text-text border border-border px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-surface2/80 flex items-center justify-center gap-2" onClick={downloadCsv}>
            <Download size={16} /> Download Results as CSV
          </button>

          <button
            className="w-full bg-surface2 text-text border border-border p-4 rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-surface2/80 flex items-center justify-center gap-2 mt-2"
            onClick={() => {
              setResults(null);
              setSelectedFile(null);
            }}
          >
            <ChevronLeft size={16} /> Upload Another File
          </button>
        </div>
      )}

      {!selectedFile && !results && (
        <div className="text-center p-16 text-text-muted flex flex-col items-center gap-4">
          <BarChart2 size={48} className="text-primary/50" />
          <div className="text-base">
            Select a CSV file to score multiple borrowers at once
          </div>
        </div>
      )}
    </div>
  );
}
