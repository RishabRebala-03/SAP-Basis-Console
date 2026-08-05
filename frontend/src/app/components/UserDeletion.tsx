import { useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Server, Trash2, Upload, RotateCcw, Save, Download, FileSpreadsheet, RefreshCw, Play, X, Filter, Clock, ChevronUp, ChevronDown, Search, History } from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import type { AuditLog } from "../contexts/AppContext";
import { deleteSingleUserApi, bulkDeletePreviewApi, processBulkDeleteSheetApi } from "../../api/sapApi";

type SortField = "timestamp" | "targetObject" | "system" | "status" | "performedBy";
type SortDir = "desc" | "asc";
type DeleteResult = { username: string; status: "Success" | "Failed"; message: string };

const F = { primary: "#0070f2", success: "#107e3e", error: "#bb0000", warning: "#e9730c", text: "var(--app-text)", muted: "var(--app-muted)", border: "var(--app-border)", bg: "var(--app-bg)", white: "var(--app-surface)" };
const inputCls = "px-3 py-1.5 text-xs rounded outline-none w-full";
const inputStyle = { border: `1px solid ${F.border}`, background: F.white, color: F.text };

function SystemSelector({ systems, selectedId, onChange }: { systems: ReturnType<typeof useAppContext>["systems"]; selectedId: string; onChange: (id: string) => void; }) {
  const active = systems.filter((s) => s.status === "Active");
  return (
    <div className="mb-5 flex items-center gap-3 p-3 rounded" style={{ background: "#e8f2ff", border: `1px solid #0070f230` }}>
      <Server size={15} style={{ color: F.primary, flexShrink: 0 }} />
      <label className="text-sm flex-shrink-0" style={{ color: F.primary }}>Target System:</label>
      <select value={selectedId} onChange={(e) => onChange(e.target.value)} className="flex-1 px-3 py-1.5 text-sm rounded outline-none" style={{ border: `1px solid #0070f240`, background: F.white, color: F.text }}>
        <option value="">— Select SAP System —</option>
        {active.map((s) => <option key={s.id} value={s.id}>{s.systemId} – {s.systemName} (Client {s.client})</option>)}
      </select>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = status === "Success" ? { bg: "#f1fdf6", color: F.success, border: "#107e3e40" } : status === "Failed" ? { bg: "#fff2f2", color: F.error, border: "#bb000040" } : { bg: "#fff8f0", color: F.warning, border: "#e9730c40" };
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{status === "Success" ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}{status}</span>;
}

function useHistoryFilters(entries: AuditLog[]) {
  const [filters, setFilters] = useState({ search: "", status: "", system: "", performedBy: "", dateFrom: "", dateTo: "", sortField: "timestamp" as SortField, sortDir: "desc" as SortDir });
  const [appliedFilters, setAppliedFilters] = useState<typeof filters | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const set = (k: keyof typeof filters) => (v: string) => setFilters((f) => ({ ...f, [k]: v }));
  const clearAll = () => { setFilters({ search: "", status: "", system: "", performedBy: "", dateFrom: "", dateTo: "", sortField: "timestamp", sortDir: "desc" }); setAppliedFilters(null); setHasSubmitted(false); };
  const submitFilters = () => { setAppliedFilters({ ...filters }); setHasSubmitted(true); };
  const currentFilters = appliedFilters || filters;
  const filtered = useMemo(() => {
    if (!hasSubmitted) return [];
    let r = [...entries];
    if (currentFilters.search) { const q = currentFilters.search.toLowerCase(); r = r.filter((e) => e.targetObject.toLowerCase().includes(q) || e.system.toLowerCase().includes(q) || e.performedBy.toLowerCase().includes(q) || e.action.toLowerCase().includes(q)); }
    if (currentFilters.status) r = r.filter((e) => e.status === currentFilters.status);
    if (currentFilters.system) r = r.filter((e) => e.system === currentFilters.system);
    if (currentFilters.performedBy) r = r.filter((e) => e.performedBy === currentFilters.performedBy);
    if (currentFilters.dateFrom) r = r.filter((e) => e.timestamp >= currentFilters.dateFrom);
    if (currentFilters.dateTo) r = r.filter((e) => e.timestamp <= currentFilters.dateTo + "T23:59:59Z");
    r.sort((a, b) => {
      const av = (a[currentFilters.sortField as keyof AuditLog] as string) ?? "";
      const bv = (b[currentFilters.sortField as keyof AuditLog] as string) ?? "";
      return currentFilters.sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return r;
  }, [entries, currentFilters, hasSubmitted]);
  return { filters, set, clearAll, submitFilters, hasSubmitted, filtered, activeCount: Object.values(filters).filter(Boolean).length - 2 };
}

export function UserDeletion({ variant }: { variant: "single" | "bulk" }) {
  const { systems, logAction, auditLogs } = useAppContext();
  const [selectedSystem, setSelectedSystem] = useState("");
  const [singleUsername, setSingleUsername] = useState("");
  const [singleStatus, setSingleStatus] = useState<"idle" | "success" | "error">("idle");
  const [singleMessage, setSingleMessage] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);
  const [bulkUsernames, setBulkUsernames] = useState("");
  const [bulkResults, setBulkResults] = useState<DeleteResult[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "parsing" | "preview" | "processing" | "done">("idle");
  const [users, setUsers] = useState<Array<{ row: number; username: string; status: "valid" | "invalid" | "processed" | "failed"; errorMessage: string; is_valid?: boolean; errors?: string[] }>>([]);
  const [parseError, setParseError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [historyActive, setHistoryActive] = useState(false);

  const targetSystemId = systems.find((s) => s.id === selectedSystem)?.systemId || selectedSystem || "SHD";
  const client = systems.find((s) => s.id === selectedSystem)?.client ?? "100";
  const deletionLogs = auditLogs.filter((l) => l.module === "Single User" && (l.action === "Delete User" || l.action === "Bulk Delete Users"));
  const singleLogs = deletionLogs.filter((l) => l.action === "Delete User");
  const bulkLogs = deletionLogs.filter((l) => l.action === "Bulk Delete Users");
  const hf = useHistoryFilters(deletionLogs);
  const bulkHf = useHistoryFilters(bulkLogs);

  const handleSingleDelete = async () => {
    const username = singleUsername.trim().toUpperCase();
    if (!selectedSystem || !username) {
      setSingleStatus("error");
      setSingleMessage(!selectedSystem ? "Please select a target SAP system" : "Username is required");
      return;
    }
    setSingleLoading(true);
    try {
      const res = await deleteSingleUserApi({ system_id: targetSystemId, username });
      setSingleStatus("success");
      setSingleMessage(res.Message || `User ${username} deleted successfully.`);
      logAction({ module: "Single User", action: "Delete User", targetObject: username, system: targetSystemId, client, status: "Success", durationMs: 700, details: res.Message || `User ${username} deleted from SAP.` });
    } catch (err: any) {
      setSingleStatus("error");
      setSingleMessage(err.message || "User deletion failed.");
      logAction({ module: "Single User", action: "Delete User", targetObject: username, system: targetSystemId, client, status: "Failed", durationMs: 700, details: err.message || "User deletion failed in SAP system.", errorCode: "DELETE_FAILED" });
    } finally {
      setSingleLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    const usernames = bulkUsernames.split(/\r?\n|,/).map((u) => u.trim().toUpperCase()).filter(Boolean);
    if (!selectedSystem || usernames.length === 0) {
      setBulkResults([{ username: "", status: "Failed", message: !selectedSystem ? "Please select a target SAP system" : "Enter at least one username" }]);
      return;
    }
    setBulkLoading(true);
    try {
      const res = await processBulkDeleteApi({ system_id: targetSystemId, usernames });
      const results = Array.isArray(res.results) ? res.results : [];
      setBulkResults(results);
      const successCount = results.filter((r: DeleteResult) => r.status === "Success").length;
      logAction({ module: "Single User", action: "Bulk Delete Users", targetObject: usernames.join(", "), system: targetSystemId, client, status: successCount === usernames.length ? "Success" : successCount > 0 ? "Warning" : "Failed", durationMs: 1200, details: res.message || "Bulk user deletion completed." });
    } catch (err: any) {
      setBulkResults(usernames.map((u) => ({ username: u, status: "Failed", message: err.message || "Bulk deletion failed." })));
      logAction({ module: "Single User", action: "Bulk Delete Users", targetObject: usernames.join(", "), system: targetSystemId, client, status: "Failed", durationMs: 1200, details: err.message || "Bulk user deletion failed in SAP system.", errorCode: "BULK_DELETE_FAILED" });
    } finally {
      setBulkLoading(false);
    }
  };

  const parseFile = async (file: File) => {
    setFileName(file.name);
    setParseError("");
    setUploadState("parsing");
    try {
      const records = await bulkDeletePreviewApi(file);
      setUsers(records.map((r: any) => ({
        row: r.row_num ?? r.row ?? 0,
        username: r.username ?? "",
        status: r.is_valid ? "valid" : "invalid",
        errorMessage: Array.isArray(r.errors) ? r.errors.join("; ") : (r.errors ?? ""),
        is_valid: r.is_valid,
        errors: r.errors,
      })));
      setUploadState("preview");
    } catch (err: any) {
      setParseError(err.message || "Failed to parse Excel file.");
      setUploadState("idle");
    }
  };

  const handleFileDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) parseFile(f); };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) parseFile(f); };

  const handleProcessSheet = async () => {
    if (!selectedSystem) return;
    setUploadState("processing");
    setProcessingProgress(50);
    const sys = systems.find((s) => s.id === selectedSystem);
    const targetSystemId = sys?.systemId || selectedSystem || "SHD";
    const validRows = users.filter((u) => u.status === "valid");
    try {
      const res = await processBulkDeleteSheetApi({
        system_id: targetSystemId,
        users: validRows.map((u) => ({ username: u.username, is_valid: true, errors: [] })),
      });
      setProcessingProgress(100);
      const apiResults = res.results || [];
      let idx = 0;
      setUsers((prev) => prev.map((u) => {
        if (u.status !== "valid") return u;
        const result = apiResults[idx++] || { status: "Success", message: "User deleted" };
        return { ...u, status: result.status === "Success" ? "processed" : "failed", errorMessage: result.message || "" };
      }));
      setUploadState("done");
    } catch (err: any) {
      setProcessingProgress(100);
      setUsers((prev) => prev.map((u) => u.status === "valid" ? { ...u, status: "failed", errorMessage: err.message || "Bulk deletion error" } : u));
      setUploadState("done");
    }
  };

  const handleResetSheet = () => {
    setUploadState("idle");
    setUsers([]);
    setFileName("");
    setParseError("");
    setProcessingProgress(0);
    setSelectedSystem("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const downloadTemplate = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/sap/delete-template", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SAP_Bulk_User_Delete_Template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1"><Trash2 size={20} style={{ color: F.primary }} /><h1 className="text-xl" style={{ color: F.text }}>User Deletion</h1></div>
          <p className="text-sm" style={{ color: F.muted }}>{variant === "single" ? "Remove one SAP user at a time." : "Remove multiple SAP users in one batch."}</p>
        </div>
      </div>

      <SystemSelector systems={systems} selectedId={selectedSystem} onChange={setSelectedSystem} />

      {variant === "single" && (
        <>
          <div className="flex gap-0 mb-6" style={{ borderBottom: `2px solid ${F.border}` }}>
            <button onClick={() => setHistoryActive(false)} className="flex items-center gap-2 px-5 py-2.5 text-sm transition-all" style={{ color: !historyActive ? F.primary : F.muted, fontWeight: !historyActive ? "600" : "400", borderBottom: !historyActive ? `2px solid ${F.primary}` : "2px solid transparent", marginBottom: "-2px", background: "transparent" }}><Trash2 size={15} /> User Deletion</button>
            <button onClick={() => setHistoryActive(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm transition-all" style={{ color: historyActive ? F.primary : F.muted, fontWeight: historyActive ? "600" : "400", borderBottom: historyActive ? `2px solid ${F.primary}` : "2px solid transparent", marginBottom: "-2px", background: "transparent" }}><History size={15} /> History</button>
          </div>

          {!historyActive && (
        <div className="rounded" style={{ background: F.white, border: `1px solid ${F.border}` }}>
          <div className="px-5 py-3" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
            <h3 className="text-sm" style={{ color: F.text }}>Single User Deletion</h3>
          </div>
          {singleStatus === "success" && (
            <div className="m-5 mb-0 flex items-start gap-3 px-4 py-3.5 rounded" style={{ background: "#f1fdf6", border: `1px solid ${F.success}` }}>
              <CheckCircle2 size={18} style={{ color: F.success, flexShrink: 0, marginTop: "2px" }} />
              <div>
                <p className="text-sm" style={{ color: F.success }}>User <strong>{singleUsername}</strong> deleted successfully from <strong>{targetSystemId}</strong>.</p>
                <p className="text-xs mt-0.5" style={{ color: F.muted }}>Deletion completed and recorded in the security audit log.</p>
              </div>
            </div>
          )}
          {singleStatus === "error" && (
            <div className="m-5 mb-0 flex items-start gap-3 px-4 py-3 rounded" style={{ background: "#fff2f2", border: `1px solid ${F.error}` }}>
              <AlertCircle size={18} style={{ color: F.error, flexShrink: 0, marginTop: "2px" }} />
              <div>
                <p className="text-sm" style={{ color: F.error }}>{singleMessage || "Failed to delete user."}</p>
                <p className="text-xs mt-0.5" style={{ color: F.muted }}>Check the audit log for error details.</p>
              </div>
            </div>
          )}
          <div className="p-5">
            <div className="px-5 py-3 mb-5" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
              <h3 className="text-sm" style={{ color: F.text }}>User Details</h3>
            </div>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-sm mb-1" style={{ color: F.muted }}>Username <span style={{ color: F.error }}>*</span></label>
                <input
                  value={singleUsername}
                  onChange={(e) => setSingleUsername(e.target.value.toUpperCase())}
                  placeholder="e.g. JOHN.DOE"
                  className="w-full px-3 py-2 text-sm outline-none"
                  style={{ border: `1px solid ${F.border}`, borderRadius: 4, background: F.white, color: F.text }}
                />
              </div>
            </div>
            <div className="px-5 py-4 mt-5 flex items-center justify-between gap-3" style={{ background: "#fafafa" }}>
              <button
                onClick={() => { setSingleUsername(""); setSingleStatus("idle"); setSingleMessage(""); }}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded transition-colors"
                style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}
              >
                <RotateCcw size={14} /> Reset
              </button>
              <button
                onClick={handleSingleDelete}
                disabled={singleLoading}
                className="flex items-center gap-2 px-5 py-2 text-sm rounded text-white"
                style={{ background: singleLoading ? "#74a8f5" : F.error }}
              >
                {singleLoading ? (
                  "Deleting..."
                ) : (
                  <>
                    <Save size={14} /> Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
          )}

          {historyActive && (
            <div>
              {deletionLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 rounded" style={{ background: F.white, border: `1px solid ${F.border}`, color: F.muted }}>
                  <History size={40} strokeWidth={1.2} />
                  <p className="text-sm">No deletion history yet.</p>
                  <p className="text-xs">Actions performed on this page will appear here.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 rounded" style={{ background: F.white, border: `1px solid ${F.border}` }}>
                    <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end" style={{ borderBottom: `1px solid ${F.border}` }}>
                      <div className="lg:col-span-2">
                        <p className="text-xs mb-1" style={{ color: F.muted }}>Search</p>
                        <input value={hf.filters.search} onChange={(e) => hf.set("search")(e.target.value)} placeholder="Username, system, action…" className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: F.muted }}>Status</p>
                        <select value={hf.filters.status} onChange={(e) => hf.set("status")(e.target.value)} className={inputCls} style={inputStyle}>
                          <option value="">All Statuses</option>
                          <option value="Success">Success</option>
                          <option value="Failed">Failed</option>
                          <option value="Warning">Warning</option>
                        </select>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: F.muted }}>System</p>
                        <select value={hf.filters.system} onChange={(e) => hf.set("system")(e.target.value)} className={inputCls} style={inputStyle}>
                          <option value="">All Systems</option>
                          {[...new Set(deletionLogs.map((e) => e.system))].map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: F.muted }}>Performed By</p>
                        <select value={hf.filters.performedBy} onChange={(e) => hf.set("performedBy")(e.target.value)} className={inputCls} style={inputStyle}>
                          <option value="">All Users</option>
                          {[...new Set(deletionLogs.map((e) => e.performedBy))].map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: F.muted }}>Date From</p>
                        <input type="date" value={hf.filters.dateFrom} onChange={(e) => hf.set("dateFrom")(e.target.value)} className={inputCls} style={inputStyle} />
                      </div>
                    </div>
                    <div className="px-4 py-2.5 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2"><p className="text-xs" style={{ color: F.muted }}>To:</p><input type="date" value={hf.filters.dateTo} onChange={(e) => hf.set("dateTo")(e.target.value)} className="px-2 py-1 text-xs rounded outline-none" style={inputStyle} /></div>
                      <div className="flex items-center gap-1.5">
                        <Filter size={12} style={{ color: F.muted }} />
                        <p className="text-xs" style={{ color: F.muted }}>Sort by:</p>
                        {(["timestamp", "targetObject", "system", "status", "performedBy"] as SortField[]).map((f) => {
                          const labels: Record<SortField, string> = { timestamp: "Date", targetObject: "Username", system: "System", status: "Status", performedBy: "User" };
                          const isActive = hf.filters.sortField === f;
                          return <button key={f} onClick={() => hf.set("sortField")(f)} className="flex items-center gap-0.5 px-2.5 py-1 rounded text-xs transition-all" style={{ background: isActive ? F.primary : F.bg, color: isActive ? "#fff" : F.text, border: `1px solid ${isActive ? F.primary : F.border}` }}>{labels[f]} {isActive ? <ChevronDown size={12} /> : null}</button>;
                        })}
                      </div>
                      <div className="ml-auto flex items-center gap-3">
                        <button onClick={hf.submitFilters} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded text-white shadow-sm transition-all" style={{ background: F.primary }}><Play size={12} fill="currentColor" /> Go</button>
                        <p className="text-xs" style={{ color: F.muted }}>Showing <strong style={{ color: F.text }}>{hf.filtered.length}</strong> of <strong style={{ color: F.text }}>{deletionLogs.length}</strong> entries</p>
                        <button onClick={hf.clearAll} className="flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors" style={{ background: F.white, color: F.muted, border: `1px solid ${F.border}` }}><X size={11} /> Clear All Filters</button>
                      </div>
                    </div>
                  </div>
                  {(!hf.hasSubmitted) ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 rounded" style={{ background: F.white, border: `1px solid ${F.border}`, color: F.muted }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#e8f2ff", color: F.primary }}>
                        <Filter size={24} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: F.text }}>No Data Displayed Yet</p>
                      <p className="text-xs">Apply your search and filter criteria above, then click <strong>Go</strong> to view history.</p>
                    </div>
                  ) : hf.filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 rounded" style={{ background: F.white, border: `1px solid ${F.border}`, color: F.muted }}>
                      <Search size={32} strokeWidth={1.2} />
                      <p className="text-sm">No entries match the submitted filters.</p>
                      <button onClick={hf.clearAll} className="text-xs mt-1" style={{ color: F.primary }}>Clear all filters</button>
                    </div>
                  ) : (
                    <div className="rounded" style={{ background: F.white, border: `1px solid ${F.border}` }}>
                      <div className="px-5 py-3 grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-4 text-xs font-medium" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa", color: F.muted }}>
                        <span>Username</span><span>System / Client</span><span>Action</span><span>Performed By</span><span>Timestamp</span><span>Status</span>
                      </div>
                      {hf.filtered.map((log, idx) => {
                        const ts = new Date(log.timestamp);
                        return (
                          <div key={log.id} className="px-5 py-4 grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-4 items-start" style={{ borderBottom: idx < hf.filtered.length - 1 ? `1px solid ${F.border}` : "none" }}>
                            <div><p className="text-sm font-medium" style={{ color: F.text }}>{log.targetObject}</p></div>
                            <div><p className="text-sm" style={{ color: F.text }}>{log.system}</p><p className="text-xs mt-0.5" style={{ color: F.muted }}>Client {log.client}</p></div>
                            <div><p className="text-sm" style={{ color: F.text }}>{log.action}</p></div>
                            <div><p className="text-sm" style={{ color: F.text }}>{log.performedBy}</p><p className="text-xs mt-0.5" style={{ color: F.muted }}>{log.ipAddress}</p></div>
                            <div className="flex items-start gap-1.5">
                              <Clock size={12} style={{ color: F.muted, marginTop: "3px", flexShrink: 0 }} />
                              <div>
                                <p className="text-sm" style={{ color: F.text }}>{ts.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                                <p className="text-xs mt-0.5" style={{ color: F.muted }}>{ts.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
                              </div>
                            </div>
                            <StatusBadge status={log.status} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      {variant === "bulk" && (
        <>
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Upload size={20} style={{ color: F.primary }} />
                <h1 className="text-xl" style={{ color: F.text }}>Bulk User Deletion</h1>
              </div>
              <p className="text-sm" style={{ color: F.muted }}>Remove multiple SAP users in one batch.</p>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded"
              style={{ border: `1px solid ${F.primary}`, color: F.primary, background: F.white }}
            >
              <Download size={14} /> Download Template
            </button>
          </div>

          <div className="flex gap-0 mb-6" style={{ borderBottom: `2px solid ${F.border}` }}>
            <button
              onClick={() => setHistoryActive(false)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm transition-all"
              style={{ color: !historyActive ? F.primary : F.muted, fontWeight: !historyActive ? "600" : "400", borderBottom: !historyActive ? `2px solid ${F.primary}` : "2px solid transparent", marginBottom: "-2px", background: "transparent" }}
            >
              <Upload size={15} /> Bulk User Deletion
            </button>
            <button
              onClick={() => setHistoryActive(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm transition-all"
              style={{ color: historyActive ? F.primary : F.muted, fontWeight: historyActive ? "600" : "400", borderBottom: historyActive ? `2px solid ${F.primary}` : "2px solid transparent", marginBottom: "-2px", background: "transparent" }}
            >
              <History size={15} /> History
            </button>
          </div>

          {!historyActive && (
            <>
              <div className="rounded" style={{ background: F.white, border: `1px solid ${F.border}` }}>
                <div className="p-5">
                  {bulkResults.some((r) => r.status === "Failed") && (
                    <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded" style={{ background: "#fff2f2", border: `1px solid ${F.error}` }}>
                      <AlertCircle size={18} style={{ color: F.error, flexShrink: 0, marginTop: "2px" }} />
                      <div>
                        <p className="text-sm" style={{ color: F.error }}>One or more users could not be deleted.</p>
                        <p className="text-xs mt-0.5" style={{ color: F.muted }}>Review the results list below for per-user status.</p>
                      </div>
                    </div>
                  )}

                  {bulkResults.some((r) => r.status === "Success") && (
                    <div className="mb-4 flex items-start gap-3 px-4 py-3.5 rounded" style={{ background: "#f1fdf6", border: `1px solid ${F.success}` }}>
                      <CheckCircle2 size={18} style={{ color: F.success, flexShrink: 0, marginTop: "2px" }} />
                      <div>
                        <p className="text-sm" style={{ color: F.success }}>Bulk deletion completed successfully for at least one user.</p>
                        <p className="text-xs mt-0.5" style={{ color: F.muted }}>All results are shown below with audit logging.</p>
                      </div>
                    </div>
                  )}

                  {parseError && (
                    <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded" style={{ background: "#fff2f2", border: `1px solid ${F.error}` }}>
                      <AlertCircle size={16} style={{ color: F.error, flexShrink: 0, marginTop: "2px" }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: F.error }}>Failed to parse file</p>
                        <p className="text-xs mt-0.5" style={{ color: F.muted }}>{parseError}</p>
                      </div>
                    </div>
                  )}

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
                        <p className="text-xs mt-1" style={{ color: F.muted }}>or click to browse - .xlsx format only</p>
                      </div>
                      <button
                        className="flex items-center gap-2 px-5 py-2 text-sm text-white rounded"
                        style={{ background: F.primary }}
                        onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                      >
                        <Upload size={14} /> Select File
                      </button>
                      <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={handleFileSelect} />
                    </div>
                  )}

                  {(uploadState === "parsing" || uploadState === "preview" || uploadState === "processing" || uploadState === "done") && (
                    <div>
                      <div className="rounded mb-4 flex items-center gap-3 px-4 py-3" style={{ background: F.white, border: `1px solid ${F.border}` }}>
                        <FileSpreadsheet size={18} style={{ color: F.primary }} />
                        <span className="text-sm flex-1" style={{ color: F.text }}>{fileName}</span>
                        <span className="text-xs" style={{ color: F.muted }}>{users.length} record{users.length !== 1 ? "s" : ""} found ({users.filter((u) => u.status === "valid").length} valid)</span>
                        <button onClick={handleResetSheet} className="p-1 rounded hover:bg-gray-100" style={{ color: F.muted }}><X size={15} /></button>
                      </div>

                      {uploadState === "processing" && (
                        <div className="mb-4 rounded px-4 py-4" style={{ background: F.white, border: `1px solid ${F.border}` }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm" style={{ color: F.text }}>Processing deletions...</span>
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
                          <p className="text-sm" style={{ color: F.success }}>Processing complete. Deletion results are ready for review.</p>
                        </div>
                      )}

                      <div className="rounded overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}` }}>
                        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
                          <h3 className="text-sm" style={{ color: F.text }}>User Preview</h3>
                          {uploadState === "done" && (
                            <button onClick={() => {}} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded" style={{ border: `1px solid ${F.primary}`, color: F.primary, background: F.white }}>
                              <Download size={12} /> Download Report
                            </button>
                          )}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr style={{ background: "#f5f6f7", borderBottom: `1px solid ${F.border}` }}>
                                <th className="px-4 py-2.5 text-left text-xs" style={{ color: F.muted, fontWeight: 600 }}>Row</th>
                                <th className="px-4 py-2.5 text-left text-xs" style={{ color: F.muted, fontWeight: 600 }}>Username</th>
                                <th className="px-4 py-2.5 text-left text-xs" style={{ color: F.muted, fontWeight: 600 }}>Status</th>
                                <th className="px-4 py-2.5 text-left text-xs" style={{ color: F.muted, fontWeight: 600 }}>Error</th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.map((user, i) => (
                                <tr key={user.row} style={{ borderBottom: `1px solid ${F.border}`, background: user.status === "invalid" || user.status === "failed" ? "#fff9f9" : i % 2 === 0 ? F.white : "#fafafa" }}>
                                  <td className="px-4 py-2.5 text-xs" style={{ color: F.muted }}>{user.row}</td>
                                  <td className="px-4 py-2.5 text-xs" style={{ color: F.text }}>{user.username || <span style={{ color: F.error }}>—</span>}</td>
                                  <td className="px-4 py-2.5">
                                    {user.status === "valid"
                                      ? <span className="px-2 py-0.5 text-xs rounded" style={{ background: "#f1fdf6", color: F.success }}>Valid</span>
                                      : user.status === "processed"
                                        ? <span className="px-2 py-0.5 text-xs rounded" style={{ background: "#f1fdf6", color: F.success }}>Success</span>
                                        : <span className="px-2 py-0.5 text-xs rounded" style={{ background: "#fff2f2", color: F.error }}>Failed</span>}
                                  </td>
                                  <td className="px-4 py-2.5 text-xs" style={{ color: user.errorMessage ? F.error : F.muted }}>{user.errorMessage || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {uploadState !== "done" && (
                        <div className="mt-4 flex items-center justify-between">
                          <button onClick={handleResetSheet} className="flex items-center gap-2 px-4 py-2 text-sm rounded" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>
                            <RefreshCw size={14} /> Upload Different File
                          </button>
                          {uploadState === "preview" && users.some((u) => u.status === "valid") && (
                            <button onClick={handleProcessSheet} className="flex items-center gap-2 px-5 py-2 text-sm rounded text-white" style={{ background: F.primary }}>
                              <Play size={14} /> Process {users.filter((u) => u.status === "valid").length} Valid Records
                            </button>
                          )}
                        </div>
                      )}

                      {uploadState === "done" && (
                        <div className="mt-4">
                          <button onClick={handleResetSheet} className="flex items-center gap-2 px-4 py-2 text-sm rounded" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>
                            <RefreshCw size={14} /> Start New Upload
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {historyActive && (
            <div>
              {bulkLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 rounded" style={{ background: F.white, border: `1px solid ${F.border}`, color: F.muted }}>
                  <History size={40} strokeWidth={1.2} />
                  <p className="text-sm">No bulk deletion history yet.</p>
                  <p className="text-xs">Actions performed on this page will appear here.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 rounded" style={{ background: F.white, border: `1px solid ${F.border}` }}>
                    <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end" style={{ borderBottom: `1px solid ${F.border}` }}>
                      <div className="lg:col-span-2">
                        <p className="text-xs mb-1" style={{ color: F.muted }}>Search</p>
                        <input value={bulkHf.filters.search} onChange={(e) => bulkHf.set("search")(e.target.value)} placeholder="Records, system, action…" className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: F.muted }}>Status</p>
                        <select value={bulkHf.filters.status} onChange={(e) => bulkHf.set("status")(e.target.value)} className={inputCls} style={inputStyle}>
                          <option value="">All Statuses</option>
                          <option value="Success">Success</option>
                          <option value="Failed">Failed</option>
                          <option value="Warning">Warning</option>
                        </select>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: F.muted }}>System</p>
                        <select value={bulkHf.filters.system} onChange={(e) => bulkHf.set("system")(e.target.value)} className={inputCls} style={inputStyle}>
                          <option value="">All Systems</option>
                          {[...new Set(bulkLogs.map((e) => e.system))].map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: F.muted }}>Performed By</p>
                        <select value={bulkHf.filters.performedBy} onChange={(e) => bulkHf.set("performedBy")(e.target.value)} className={inputCls} style={inputStyle}>
                          <option value="">All Users</option>
                          {[...new Set(bulkLogs.map((e) => e.performedBy))].map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: F.muted }}>Date From</p>
                        <input type="date" value={bulkHf.filters.dateFrom} onChange={(e) => bulkHf.set("dateFrom")(e.target.value)} className={inputCls} style={inputStyle} />
                      </div>
                    </div>
                    <div className="px-4 py-2.5 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2"><p className="text-xs" style={{ color: F.muted }}>To:</p><input type="date" value={bulkHf.filters.dateTo} onChange={(e) => bulkHf.set("dateTo")(e.target.value)} className="px-2 py-1 text-xs rounded outline-none" style={inputStyle} /></div>
                      <div className="flex items-center gap-1.5">
                        <Filter size={12} style={{ color: F.muted }} />
                        <p className="text-xs" style={{ color: F.muted }}>Sort by:</p>
                        {(["timestamp", "targetObject", "system", "status", "performedBy"] as SortField[]).map((f) => {
                          const labels: Record<SortField, string> = { timestamp: "Date", targetObject: "Username", system: "System", status: "Status", performedBy: "User" };
                          const isActive = bulkHf.filters.sortField === f;
                          return <button key={f} onClick={() => bulkHf.set("sortField")(f)} className="flex items-center gap-0.5 px-2.5 py-1 rounded text-xs transition-all" style={{ background: isActive ? F.primary : F.bg, color: isActive ? "#fff" : F.text, border: `1px solid ${isActive ? F.primary : F.border}` }}>{labels[f]} {isActive ? <ChevronDown size={12} /> : null}</button>;
                        })}
                      </div>
                      <div className="ml-auto flex items-center gap-3">
                        <button onClick={bulkHf.submitFilters} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded text-white shadow-sm transition-all" style={{ background: F.primary }}><Play size={12} fill="currentColor" /> Go</button>
                        <p className="text-xs" style={{ color: F.muted }}>Showing <strong style={{ color: F.text }}>{bulkHf.filtered.length}</strong> of <strong style={{ color: F.text }}>{bulkLogs.length}</strong> entries</p>
                        <button onClick={bulkHf.clearAll} className="flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors" style={{ background: F.white, color: F.muted, border: `1px solid ${F.border}` }}><X size={11} /> Clear All Filters</button>
                      </div>
                    </div>
                  </div>
                  {!bulkHf.hasSubmitted ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 rounded" style={{ background: F.white, border: `1px solid ${F.border}`, color: F.muted }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#e8f2ff", color: F.primary }}>
                        <Filter size={24} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: F.text }}>No Data Displayed Yet</p>
                      <p className="text-xs">Apply your search and filter criteria above, then click <strong>Go</strong> to view history.</p>
                    </div>
                  ) : bulkHf.filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 rounded" style={{ background: F.white, border: `1px solid ${F.border}`, color: F.muted }}>
                      <Search size={32} strokeWidth={1.2} />
                      <p className="text-sm">No entries match the submitted filters.</p>
                      <button onClick={bulkHf.clearAll} className="text-xs mt-1" style={{ color: F.primary }}>Clear all filters</button>
                    </div>
                  ) : (
                    <div className="rounded" style={{ background: F.white, border: `1px solid ${F.border}` }}>
                      <div className="px-5 py-3 grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-4 text-xs font-medium" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa", color: F.muted }}>
                        <span>Username</span><span>System / Client</span><span>Action</span><span>Performed By</span><span>Timestamp</span><span>Status</span>
                      </div>
                      {bulkHf.filtered.map((log, idx) => {
                        const ts = new Date(log.timestamp);
                        return (
                          <div key={log.id} className="px-5 py-4 grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-4 items-start" style={{ borderBottom: idx < bulkHf.filtered.length - 1 ? `1px solid ${F.border}` : "none" }}>
                            <div><p className="text-sm font-medium" style={{ color: F.text }}>{log.targetObject}</p></div>
                            <div><p className="text-sm" style={{ color: F.text }}>{log.system}</p><p className="text-xs mt-0.5" style={{ color: F.muted }}>Client {log.client}</p></div>
                            <div><p className="text-sm" style={{ color: F.text }}>{log.action}</p></div>
                            <div><p className="text-sm" style={{ color: F.text }}>{log.performedBy}</p><p className="text-xs mt-0.5" style={{ color: F.muted }}>{log.ipAddress}</p></div>
                            <div className="flex items-start gap-1.5">
                              <Clock size={12} style={{ color: F.muted, marginTop: "3px", flexShrink: 0 }} />
                              <div>
                                <p className="text-sm" style={{ color: F.text }}>{ts.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                                <p className="text-xs mt-0.5" style={{ color: F.muted }}>{ts.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
                              </div>
                            </div>
                            <StatusBadge status={log.status} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

    </div>
  );
}
