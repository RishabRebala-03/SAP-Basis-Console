import { useState, useRef } from "react";
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, Play, X, Users, Server } from "lucide-react";
import { useAppContext } from "../contexts/AppContext";

interface BulkUser {
  row: number; username: string; lastName: string; firstName: string;
  validFrom: string; validTo: string; roles: string;
  status: "valid" | "invalid" | "processed" | "failed"; errorMessage: string;
}

const MOCK_USERS: BulkUser[] = [
  { row: 1, username: "ALICE.SMITH", lastName: "Smith", firstName: "Alice", validFrom: "2026-01-01", validTo: "2026-12-31", roles: "Z_FI_ACCOUNTANT", status: "valid", errorMessage: "" },
  { row: 2, username: "", lastName: "Brown", firstName: "Bob", validFrom: "2026-01-01", validTo: "2026-12-31", roles: "Z_MM_PURCHASER", status: "invalid", errorMessage: "Username is required" },
  { row: 3, username: "CAROL.WHITE", lastName: "White", firstName: "Carol", validFrom: "2026-06-01", validTo: "2026-01-01", roles: "Z_SD_SALES", status: "invalid", errorMessage: "Valid To must be after Valid From" },
  { row: 4, username: "DAVID.JONES", lastName: "Jones", firstName: "David", validFrom: "2026-02-01", validTo: "2027-01-31", roles: "Z_HR_MANAGER", status: "valid", errorMessage: "" },
  { row: 5, username: "EVE.TAYLOR", lastName: "Taylor", firstName: "Eve", validFrom: "2026-03-01", validTo: "2026-11-30", roles: "Z_BASIS_ADMIN", status: "valid", errorMessage: "" },
  { row: 6, username: "FRANK", lastName: "", firstName: "Frank", validFrom: "2026-01-01", validTo: "2026-12-31", roles: "", status: "invalid", errorMessage: "Last name and roles are required" },
];

const F = { primary: "#0070f2", success: "#107e3e", error: "#bb0000", warning: "#e9730c", text: "#32363a", muted: "#74777a", border: "#d9d9d9", bg: "#f5f6f7", white: "#ffffff" };

function SystemSelector({ systems, selectedId, onChange }: { systems: ReturnType<typeof useAppContext>["systems"]; selectedId: string; onChange: (id: string) => void }) {
  const active = systems.filter((s) => s.status === "Active");
  return (
    <div className="mb-5 flex items-center gap-3 p-3 rounded" style={{ background: "#e8f2ff", border: `1px solid #0070f230` }}>
      <Server size={15} style={{ color: F.primary, flexShrink: 0 }} />
      <label className="text-sm flex-shrink-0" style={{ color: F.primary }}>Target System:</label>
      <select value={selectedId} onChange={(e) => onChange(e.target.value)} className="flex-1 px-3 py-1.5 text-sm rounded outline-none" style={{ border: `1px solid #0070f240`, background: F.white, color: F.text }}>
        <option value="">— Select SAP System —</option>
        {active.map((s) => <option key={s.id} value={s.id}>{s.systemId} – {s.systemName} (Client {s.client})</option>)}
      </select>
      {selectedId && (() => {
        const s = systems.find((x) => x.id === selectedId);
        return s ? <span className="text-xs px-2 py-0.5 rounded flex-shrink-0" style={{ background: s.environment === "Production" ? "#fff2f2" : s.environment === "Quality" ? "#fff8f0" : "#e8f2ff", color: s.environment === "Production" ? F.error : s.environment === "Quality" ? F.warning : F.primary }}>{s.environment}</span> : null;
      })()}
    </div>
  );
}

export function BulkUserCreation() {
  const { systems, logAction } = useAppContext();
  const [selectedSystem, setSelectedSystem] = useState("");
  const [uploadState, setUploadState] = useState<"idle" | "preview" | "processing" | "done">("idle");
  const [users, setUsers] = useState<BulkUser[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadMockPreview = (name: string) => { setFileName(name); setUsers(MOCK_USERS); setUploadState("preview"); };
  const handleFileDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) loadMockPreview(f.name); };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) loadMockPreview(f.name); };

  const handleProcess = async () => {
    if (!selectedSystem) { alert("Please select a target SAP system before processing."); return; }
    setUploadState("processing");
    setProcessingProgress(0);
    const validRows = users.filter((u) => u.status === "valid");
    for (let i = 0; i <= validRows.length; i++) {
      await new Promise((r) => setTimeout(r, 400));
      setProcessingProgress(Math.round((i / validRows.length) * 100));
    }
    let processed = 0, failed = 0;
    setUsers((prev) => prev.map((u) => {
      if (u.status !== "valid") return u;
      const ok = Math.random() > 0.15;
      if (ok) processed++; else failed++;
      return { ...u, status: ok ? "processed" : "failed", errorMessage: ok ? "" : "Duplicate username in system" };
    }));
    setUploadState("done");
    const sys = systems.find((s) => s.id === selectedSystem);
    logAction({
      module: "Bulk User",
      action: "Bulk Import",
      targetObject: `${MOCK_USERS.length} records`,
      system: sys?.systemId ?? "—",
      client: sys?.client ?? "—",
      status: failed > 0 ? "Warning" : "Success",
      durationMs: Math.floor(3000 + Math.random() * 3000),
      details: `${processed} users created, ${failed} failed, ${MOCK_USERS.filter((u) => u.status === "invalid").length} skipped (validation errors). File: ${fileName}`,
      changesAfter: processed > 0 ? `${processed} users provisioned in ${sys?.systemId}/${sys?.client}` : undefined,
    });
  };

  const handleReset = () => { setUploadState("idle"); setUsers([]); setFileName(""); setProcessingProgress(0); setSelectedSystem(""); if (fileRef.current) fileRef.current.value = ""; };

  const downloadTemplate = () => {
    const csv = "Username,Last Name,First Name,Valid From,Valid To,Roles / Profiles\nJOHN.DOE,Doe,John,2026-01-01,2026-12-31,Z_FI_ACCOUNTANT";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "sap_user_template.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const downloadReport = () => {
    const rows = users.map((u) => `${u.row},${u.username},${u.lastName},${u.validFrom},${u.validTo},${u.roles},${u.status},${u.errorMessage}`);
    const csv = ["Row,Username,Last Name,Valid From,Valid To,Roles,Status,Error", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "sap_provisioning_report.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const validCount = users.filter((u) => u.status === "valid").length;
  const invalidCount = users.filter((u) => u.status === "invalid").length;
  const processedCount = users.filter((u) => u.status === "processed").length;
  const failedCount = users.filter((u) => u.status === "failed").length;

  const statusBadge = (status: BulkUser["status"]) => {
    const map = { valid: { label: "Valid", bg: "#f1fdf6", color: F.success }, invalid: { label: "Invalid", bg: "#fff2f2", color: F.error }, processed: { label: "Success", bg: "#f1fdf6", color: F.success }, failed: { label: "Failed", bg: "#fff2f2", color: F.error } };
    const s = map[status];
    return <span className="px-2 py-0.5 text-xs rounded" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1"><Users size={20} style={{ color: F.primary }} /><h1 className="text-xl" style={{ color: F.text }}>Bulk User Creation</h1></div>
          <p className="text-sm" style={{ color: F.muted }}>Upload an Excel file to provision multiple SAP users at once.</p>
        </div>
        <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 text-sm rounded" style={{ border: `1px solid ${F.primary}`, color: F.primary, background: F.white }}>
          <Download size={14} /> Download Template
        </button>
      </div>

      <SystemSelector systems={systems} selectedId={selectedSystem} onChange={setSelectedSystem} />

      {uploadState === "idle" && (
        <div
          className="rounded flex flex-col items-center justify-center gap-4 py-14 cursor-pointer transition-all"
          style={{ background: dragOver ? "#e8f2ff" : F.white, border: `2px dashed ${dragOver ? F.primary : F.border}` }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          onClick={() => fileRef.current?.click()}
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#e8f2ff" }}>
            <FileSpreadsheet size={28} style={{ color: F.primary }} />
          </div>
          <div className="text-center">
            <p className="text-sm" style={{ color: F.text }}>Drag and drop your Excel file here</p>
            <p className="text-xs mt-1" style={{ color: F.muted }}>or click to browse — .xlsx format only</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2 text-sm text-white rounded" style={{ background: F.primary }} onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}>
            <Upload size={14} /> Select File
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={handleFileSelect} />
        </div>
      )}

      {(uploadState === "preview" || uploadState === "processing" || uploadState === "done") && (
        <div>
          <div className="rounded mb-4 flex items-center gap-3 px-4 py-3" style={{ background: F.white, border: `1px solid ${F.border}` }}>
            <FileSpreadsheet size={18} style={{ color: F.primary }} />
            <span className="text-sm flex-1" style={{ color: F.text }}>{fileName}</span>
            <span className="text-xs" style={{ color: F.muted }}>{users.length} records found</span>
            <button onClick={handleReset} className="p-1 rounded hover:bg-gray-100" style={{ color: F.muted }}><X size={15} /></button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Total Records", value: users.length, color: F.primary, bg: "#e8f2ff" },
              { label: uploadState === "done" ? "Processed" : "Valid", value: uploadState === "done" ? processedCount : validCount, color: F.success, bg: "#f1fdf6" },
              { label: uploadState === "done" ? "Failed" : "Invalid", value: uploadState === "done" ? failedCount : invalidCount, color: F.error, bg: "#fff2f2" },
              { label: "Skipped", value: uploadState === "done" ? invalidCount : 0, color: F.warning, bg: "#fff8f0" },
            ].map((card) => (
              <div key={card.label} className="rounded px-4 py-3" style={{ background: card.bg, border: `1px solid ${card.color}30` }}>
                <p className="text-xs mb-1" style={{ color: F.muted }}>{card.label}</p>
                <p className="text-2xl" style={{ color: card.color }}>{card.value}</p>
              </div>
            ))}
          </div>

          {uploadState === "processing" && (
            <div className="mb-4 rounded px-4 py-4" style={{ background: F.white, border: `1px solid ${F.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: F.text }}>Processing users...</span>
                <span className="text-sm" style={{ color: F.primary }}>{processingProgress}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "#e4e4e4" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${processingProgress}%`, background: F.primary }} />
              </div>
            </div>
          )}

          {uploadState === "done" && (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded" style={{ background: "#f1fdf6", border: `1px solid ${F.success}` }}>
              <CheckCircle2 size={16} style={{ color: F.success }} />
              <p className="text-sm" style={{ color: F.success }}>
                Processing complete. <strong>{processedCount}</strong> users created, <strong>{failedCount}</strong> failed. Action recorded in audit log.
              </p>
            </div>
          )}

          <div className="rounded overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}` }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
              <h3 className="text-sm" style={{ color: F.text }}>User Preview</h3>
              {uploadState === "done" && (
                <button onClick={downloadReport} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded" style={{ border: `1px solid ${F.primary}`, color: F.primary, background: F.white }}>
                  <Download size={12} /> Download Report
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#f5f6f7", borderBottom: `1px solid ${F.border}` }}>
                    {["Row","Username","Last Name","Valid From","Valid To","Roles / Profiles","Status","Error Message"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs" style={{ color: F.muted, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <tr key={user.row} style={{ borderBottom: `1px solid ${F.border}`, background: (user.status === "invalid" || user.status === "failed") ? "#fff9f9" : i % 2 === 0 ? F.white : "#fafafa" }}>
                      <td className="px-4 py-2.5" style={{ color: F.muted }}>{user.row}</td>
                      <td className="px-4 py-2.5" style={{ color: F.text }}>{user.username || <span style={{ color: F.error }}>—</span>}</td>
                      <td className="px-4 py-2.5" style={{ color: F.text }}>{user.lastName || <span style={{ color: F.error }}>—</span>}</td>
                      <td className="px-4 py-2.5" style={{ color: F.text }}>{user.validFrom}</td>
                      <td className="px-4 py-2.5" style={{ color: F.text }}>{user.validTo}</td>
                      <td className="px-4 py-2.5" style={{ color: F.text }}>{user.roles || "—"}</td>
                      <td className="px-4 py-2.5">{statusBadge(user.status)}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: user.errorMessage ? F.error : F.muted }}>{user.errorMessage || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {uploadState !== "done" && (
            <div className="mt-4 flex items-center justify-between">
              <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 text-sm rounded" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>
                <RefreshCw size={14} /> Upload Different File
              </button>
              {uploadState === "preview" && validCount > 0 && (
                <button onClick={handleProcess} className="flex items-center gap-2 px-5 py-2 text-sm rounded text-white" style={{ background: F.primary }}>
                  <Play size={14} /> Process {validCount} Valid Records
                </button>
              )}
            </div>
          )}
          {uploadState === "done" && (
            <div className="mt-4">
              <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 text-sm rounded" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>
                <RefreshCw size={14} /> Start New Upload
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
