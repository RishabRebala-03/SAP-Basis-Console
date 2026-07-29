import { useState, useRef, useMemo, useEffect } from "react";
import {
  Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle,
  RefreshCw, Play, X, Users, Server, History, Clock,
  Search, Filter, ChevronUp, ChevronDown,
} from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { SearchableFilterDropdown } from "./SearchableFilterDropdown";
import type { AuditLog } from "../contexts/AppContext";
import { processBulkCreateApi } from "../../api/sapApi";

interface BulkUser {
  row: number; username: string; lastName: string; firstName: string;
  validFrom: string; validTo: string; roles: string;
  status: "valid" | "invalid" | "processed" | "failed"; errorMessage: string;
}

const MOCK_USERS: BulkUser[] = [];


const F = { primary: "#0070f2", success: "#107e3e", error: "#bb0000", warning: "#e9730c", text: "var(--app-text)", muted: "var(--app-muted)", border: "var(--app-border)", bg: "var(--app-bg)", white: "var(--app-surface)" };

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

function StatusBadge({ status }: { status: string }) {
  const cfg =
    status === "Success" ? { bg: "#f1fdf6", color: F.success, border: "#107e3e40" }
    : status === "Failed" ? { bg: "#fff2f2", color: F.error, border: "#bb000040" }
    : { bg: "#fff8f0", color: F.warning, border: "#e9730c40" };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {status === "Success" ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
      {status}
    </span>
  );
}

// ── Filter logic ─────────────────────────────────────────────────────────────
const inputCls = "px-3 py-1.5 text-xs rounded outline-none w-full";
const inputStyle = { border: `1px solid ${F.border}`, background: F.white, color: F.text };
type SortField = "timestamp" | "targetObject" | "system" | "status" | "performedBy";
type SortDir = "desc" | "asc";
interface HistoryFilters { search: string; status: string; system: string; performedBy: string; dateFrom: string; dateTo: string; sortField: SortField; sortDir: SortDir; }
const DEFAULT_FILTERS: HistoryFilters = { search: "", status: "", system: "", performedBy: "", dateFrom: "", dateTo: "", sortField: "timestamp", sortDir: "desc" };

function useHistoryFilters(entries: AuditLog[]) {
  const [filters, setFilters] = useState<HistoryFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<HistoryFilters | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const set = (k: keyof HistoryFilters) => (v: string) => setFilters((f) => ({ ...f, [k]: v }));
  const clearAll = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
  };
  const submitFilters = () => {
    setAppliedFilters({ ...filters });
    setHasSubmitted(true);
  };

  const systems = useMemo(() => [...new Set(entries.map((e) => e.system).filter(Boolean))].sort(), [entries]);
  const performers = useMemo(() => [...new Set(entries.map((e) => e.performedBy).filter(Boolean))].sort(), [entries]);
  const actions = useMemo(() => [...new Set(entries.map((e) => e.action).filter(Boolean))].sort(), [entries]);
  const targets = useMemo(() => [...new Set(entries.map((e) => e.targetObject).filter(Boolean))].sort(), [entries]);
  const activeCount = Object.entries(filters).filter(([k, v]) => k !== "sortField" && k !== "sortDir" && v !== "").length;

  const currentFilters = appliedFilters || DEFAULT_FILTERS;
  const filtered = useMemo(() => {
    if (!hasSubmitted) return [];
    let r = [...entries];
    if (currentFilters.search) { const q = currentFilters.search.toLowerCase(); r = r.filter((e) => e.targetObject.toLowerCase().includes(q) || e.system.toLowerCase().includes(q) || e.performedBy.toLowerCase().includes(q) || e.action.toLowerCase().includes(q)); }
    if (currentFilters.status) r = r.filter((e) => e.status === currentFilters.status);
    if (currentFilters.system) r = r.filter((e) => e.system === currentFilters.system);
    if (currentFilters.performedBy) r = r.filter((e) => e.performedBy === currentFilters.performedBy);
    if (currentFilters.dateFrom) r = r.filter((e) => e.timestamp >= currentFilters.dateFrom);
    if (currentFilters.dateTo) r = r.filter((e) => e.timestamp <= currentFilters.dateTo + "T23:59:59Z");
    r.sort((a, b) => { const av = (a[currentFilters.sortField as keyof AuditLog] as string) ?? ""; const bv = (b[currentFilters.sortField as keyof AuditLog] as string) ?? ""; return currentFilters.sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av); });
    return r;
  }, [entries, currentFilters, hasSubmitted]);

  return { filters, set, clearAll, submitFilters, hasSubmitted, systems, performers, actions, targets, activeCount, filtered };
}

// ── Search Autocomplete ──────────────────────────────────────────────────────
function SearchAutocomplete({ value, onChange, targets, systems, performers, actions, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  targets: string[]; systems: string[]; performers: string[]; actions: string[];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open]);

  const groups = [
    { label: "Records",      tag: "REC", color: "#0070f2", values: targets },
    { label: "System",       tag: "SYS", color: "#107e3e", values: systems },
    { label: "Performed By", tag: "ADM", color: "#e9730c", values: performers },
    { label: "Action",       tag: "ACT", color: "#74777a", values: actions },
  ].map((g) => ({
    ...g,
    visible: value
      ? g.values.filter((v) => v.toLowerCase().includes(value.toLowerCase()))
      : g.values.slice(0, 5),
  })).filter((g) => g.visible.length > 0);

  const hasAny = groups.some((g) => g.visible.length > 0);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: F.muted, pointerEvents: "none" }} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? "Search records, system, user…"}
          className={inputCls}
          style={{ ...inputStyle, paddingLeft: "28px" }}
        />
        {value && (
          <button onClick={() => { onChange(""); setOpen(true); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100" style={{ color: F.muted }}>
            <X size={11} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded shadow-xl z-40 overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}`, minWidth: "280px" }}>
          {/* hint */}
          <div className="px-3 py-2 flex items-center gap-1.5" style={{ borderBottom: `1px solid ${F.border}`, background: "#f8fbff" }}>
            <Search size={11} style={{ color: F.primary }} />
            <p className="text-xs" style={{ color: F.muted }}>{value ? `Suggestions for "${value}"` : "Suggestions — click to apply"}</p>
          </div>

          <div style={{ maxHeight: "280px", overflowY: "auto" }}>
            {!hasAny ? (
              <div className="px-3 py-6 text-center" style={{ color: F.muted }}>
                <p className="text-xs">No matching suggestions for "{value}"</p>
              </div>
            ) : (
              groups.map((g) => (
                <div key={g.label}>
                  <div className="px-3 py-1.5 flex items-center gap-2" style={{ background: "#fafafa", borderBottom: `1px solid ${F.border}` }}>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: g.color + "18", color: g.color }}>{g.tag}</span>
                    <span className="text-xs" style={{ color: F.muted }}>{g.label}</span>
                  </div>
                  {g.visible.map((v) => (
                    <button
                      key={v}
                      onMouseDown={(e) => { e.preventDefault(); onChange(v); setOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm transition-all"
                      style={{ color: F.text, borderBottom: `1px solid ${F.border}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f6ff")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {value ? (
                        <>
                          {v.substring(0, v.toLowerCase().indexOf(value.toLowerCase()))}
                          <strong style={{ color: F.primary }}>{v.substring(v.toLowerCase().indexOf(value.toLowerCase()), v.toLowerCase().indexOf(value.toLowerCase()) + value.length)}</strong>
                          {v.substring(v.toLowerCase().indexOf(value.toLowerCase()) + value.length)}
                        </>
                      ) : v}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryFilterBar({ filters, set, clearAll, submitFilters, systems, performers, actions, targets, activeCount, total, shown }: ReturnType<typeof useHistoryFilters> & { total: number; shown: number }) {
  const toggleSort = (field: SortField) => { if (filters.sortField === field) set("sortDir")(filters.sortDir === "desc" ? "asc" : "desc"); else { set("sortField")(field); set("sortDir")("desc"); } };
  const SortIcon = ({ field }: { field: SortField }) => filters.sortField === field ? (filters.sortDir === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />) : null;
  return (
    <div className="mb-4 rounded" style={{ background: F.white, border: `1px solid ${F.border}` }}>
      <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end" style={{ borderBottom: `1px solid ${F.border}` }}>
        <div className="lg:col-span-2">
          <p className="text-xs mb-1" style={{ color: F.muted }}>Search</p>
          <SearchAutocomplete value={filters.search} onChange={set("search")} targets={targets} systems={systems} performers={performers} actions={actions} placeholder="Records, system, action…" />
        </div>
        <div>
          <SearchableFilterDropdown
            label="Status"
            value={filters.status}
            onChange={set("status")}
            options={["", "Success", "Failed", "Warning"]}
            allLabel="All Statuses"
            placeholder="Search status…"
          />
        </div>
        <div>
          <SearchableFilterDropdown
            label="System"
            value={filters.system}
            onChange={set("system")}
            options={["", ...systems]}
            allLabel="All Systems"
            placeholder="Search system…"
          />
        </div>
        <div>
          <SearchableFilterDropdown
            label="Performed By"
            value={filters.performedBy}
            onChange={set("performedBy")}
            options={["", ...performers]}
            allLabel="All Users"
            placeholder="Search user…"
          />
        </div>
        <div><p className="text-xs mb-1" style={{ color: F.muted }}>Date From</p><input type="date" value={filters.dateFrom} onChange={(e) => set("dateFrom")(e.target.value)} className={inputCls} style={inputStyle} /></div>
      </div>
      <div className="px-4 py-2.5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2"><p className="text-xs" style={{ color: F.muted }}>To:</p><input type="date" value={filters.dateTo} onChange={(e) => set("dateTo")(e.target.value)} className="px-2 py-1 text-xs rounded outline-none" style={inputStyle} /></div>
        <div className="flex items-center gap-1.5">
          <Filter size={12} style={{ color: F.muted }} /><p className="text-xs" style={{ color: F.muted }}>Sort by:</p>
          {(["timestamp", "targetObject", "system", "status", "performedBy"] as SortField[]).map((f) => {
            const labels: Record<SortField, string> = { timestamp: "Date", targetObject: "Records", system: "System", status: "Status", performedBy: "User" };
            const isActive = filters.sortField === f;
            return <button key={f} onClick={() => toggleSort(f)} className="flex items-center gap-0.5 px-2.5 py-1 rounded text-xs transition-all" style={{ background: isActive ? F.primary : F.bg, color: isActive ? "#fff" : F.text, border: `1px solid ${isActive ? F.primary : F.border}` }}>{labels[f]} <SortIcon field={f} /></button>;
          })}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={submitFilters}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded text-white shadow-sm transition-all"
            style={{ background: F.primary }}
          >
            <Play size={12} fill="currentColor" /> Go
          </button>
          <p className="text-xs" style={{ color: F.muted }}>Showing <strong style={{ color: F.text }}>{shown}</strong> of <strong style={{ color: F.text }}>{total}</strong> entries</p>
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors"
            style={{
              background: activeCount > 0 ? "#fff2f2" : F.white,
              color: activeCount > 0 ? F.error : F.muted,
              border: `1px solid ${activeCount > 0 ? "#bb000030" : F.border}`,
            }}
          >
            <X size={11} /> Clear All Filters
          </button>
        </div>
      </div>
    </div>
  );
}

function HistoryTab() {
  const { auditLogs } = useAppContext();
  const allEntries = auditLogs.filter((l) => l.module === "Bulk User");
  const fh = useHistoryFilters(allEntries);
  const { filtered } = fh;

  if (allEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: F.muted }}>
        <History size={40} strokeWidth={1.2} />
        <p className="text-sm">No bulk import history yet.</p>
        <p className="text-xs">Actions performed on this page will appear here.</p>
      </div>
    );
  }

  return (
    <div>
      <HistoryFilterBar {...fh} total={allEntries.length} shown={filtered.length} />
      {!fh.hasSubmitted ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded" style={{ background: F.white, border: `1px solid ${F.border}`, color: F.muted }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#e8f2ff", color: F.primary }}>
            <Filter size={24} />
          </div>
          <p className="text-sm font-medium" style={{ color: F.text }}>No Data Displayed Yet</p>
          <p className="text-xs">Apply your search and filter criteria above, then click <strong>Go</strong> to view history.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 rounded" style={{ background: F.white, border: `1px solid ${F.border}`, color: F.muted }}>
          <Search size={32} strokeWidth={1.2} />
          <p className="text-sm">No entries match the submitted filters.</p>
          <button onClick={fh.clearAll} className="text-xs mt-1" style={{ color: F.primary }}>Clear all filters</button>
        </div>
      ) : (
        <div className="rounded" style={{ background: F.white, border: `1px solid ${F.border}` }}>
          <div className="px-5 py-3 grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-4 text-xs font-medium" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa", color: F.muted }}>
            <span>Records</span><span>System / Client</span><span>Action</span><span>Performed By</span><span>Timestamp</span><span>Status</span>
          </div>
          {filtered.map((log, idx) => {
            const ts = new Date(log.timestamp);
            return (
              <div key={log.id} className="px-5 py-4 grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-4 items-start" style={{ borderBottom: idx < filtered.length - 1 ? `1px solid ${F.border}` : "none" }}>
                <div><p className="text-sm font-medium" style={{ color: F.text }}>{log.targetObject}</p>{log.details && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: F.muted }}>{log.details}</p>}</div>
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
    </div>
  );
}

export function BulkUserCreation() {
  const { systems, logAction } = useAppContext();
  const [activeTab, setActiveTab] = useState<"creation" | "history">("creation");
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
    setUploadState("processing"); setProcessingProgress(20);
    const validRows = users.filter((u) => u.status === "valid");
    const sys = systems.find((s) => s.id === selectedSystem);
    const targetSystemId = sys?.systemId || selectedSystem || "SHD";

    try {
      setProcessingProgress(50);
      const res = await processBulkCreateApi({
        system_id: targetSystemId,
        users: validRows.map((u) => ({
          username: u.username,
          first_name: u.firstName,
          last_name: u.lastName,
          valid_from: u.validFrom,
          valid_to: u.validTo,
          roles: u.roles ? u.roles.split(",").map((r) => r.trim()) : [],
        })),
      });

      setProcessingProgress(100);
      const apiResults = res.results || [];
      let processed = 0, failed = 0;

      let validIdx = 0;
      setUsers((prev) => prev.map((u) => {
        if (u.status !== "valid") return u;
        const result = apiResults[validIdx++] || { status: "Success", message: "User created" };
        const ok = result.status === "Success";
        if (ok) processed++; else failed++;
        return { ...u, status: ok ? "processed" : "failed", errorMessage: ok ? "" : (result.message || "Bulk creation error") };
      }));

      setUploadState("done");
      logAction({
        module: "Bulk User", action: "Bulk Import", targetObject: `${users.length} records`,
        system: targetSystemId, client: sys?.client ?? "100",
        status: failed > 0 ? "Warning" : "Success",
        durationMs: 2500,
        details: `${processed} users created in SAP, ${failed} failed. System: ${targetSystemId}`,
        changesAfter: processed > 0 ? `${processed} users provisioned in ${targetSystemId}/${sys?.client || "100"}` : undefined
      });
    } catch (err: any) {
      setProcessingProgress(100);
      setUsers((prev) => prev.map((u) => u.status === "valid" ? { ...u, status: "failed", errorMessage: err.message || "Bulk creation error" } : u));
      setUploadState("done");
      logAction({
        module: "Bulk User", action: "Bulk Import", targetObject: `${users.length} records`,
        system: targetSystemId, client: sys?.client ?? "100",
        status: "Failed",
        durationMs: 1500,
        details: err.message || "Bulk creation API request failed.",
        errorCode: "BULK_PROCESS_ERROR"
      });
    }
  };

  const handleReset = () => { setUploadState("idle"); setUsers([]); setFileName(""); setProcessingProgress(0); setSelectedSystem(""); if (fileRef.current) fileRef.current.value = ""; };
  const downloadTemplate = () => { const csv = "Username,Last Name,First Name,Valid From,Valid To,Roles / Profiles\nJOHN.DOE,Doe,John,2026-01-01,2026-12-31,Z_FI_ACCOUNTANT"; const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "sap_user_template.csv"; a.click(); URL.revokeObjectURL(url); };
  const downloadReport = () => { const rows = users.map((u) => `${u.row},${u.username},${u.lastName},${u.validFrom},${u.validTo},${u.roles},${u.status},${u.errorMessage}`); const csv = ["Row,Username,Last Name,Valid From,Valid To,Roles,Status,Error", ...rows].join("\n"); const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "sap_provisioning_report.csv"; a.click(); URL.revokeObjectURL(url); };

  const validCount = users.filter((u) => u.status === "valid").length;
  const invalidCount = users.filter((u) => u.status === "invalid").length;
  const processedCount = users.filter((u) => u.status === "processed").length;
  const failedCount = users.filter((u) => u.status === "failed").length;

  const statusBadge = (status: BulkUser["status"]) => {
    const map = { valid: { label: "Valid", bg: "#f1fdf6", color: F.success }, invalid: { label: "Invalid", bg: "#fff2f2", color: F.error }, processed: { label: "Success", bg: "#f1fdf6", color: F.success }, failed: { label: "Failed", bg: "#fff2f2", color: F.error } };
    const s = map[status]; return <span className="px-2 py-0.5 text-xs rounded" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
  };

  const tabBtn = (active: boolean) => ({ color: active ? F.primary : F.muted, fontWeight: active ? "600" : "400", borderBottom: active ? `2px solid ${F.primary}` : "2px solid transparent", marginBottom: "-2px", background: "transparent", outline: "none" } as React.CSSProperties);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1"><Users size={20} style={{ color: F.primary }} /><h1 className="text-xl" style={{ color: F.text }}>Bulk User Creation</h1></div>
          <p className="text-sm" style={{ color: F.muted }}>Upload an Excel file to provision multiple SAP users at once.</p>
        </div>
        <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 text-sm rounded" style={{ border: `1px solid ${F.primary}`, color: F.primary, background: F.white }}><Download size={14} /> Download Template</button>
      </div>

      <div className="flex gap-0 mb-6" style={{ borderBottom: `2px solid ${F.border}` }}>
        <button id="tab-bulk-creation" onClick={() => setActiveTab("creation")} className="flex items-center gap-2 px-5 py-2.5 text-sm transition-all" style={tabBtn(activeTab === "creation")}><Users size={15} /> Bulk Creation</button>
        <button id="tab-bulk-history" onClick={() => setActiveTab("history")} className="flex items-center gap-2 px-5 py-2.5 text-sm transition-all" style={tabBtn(activeTab === "history")}><History size={15} /> History</button>
      </div>

      {activeTab === "creation" && (
        <>
          <SystemSelector systems={systems} selectedId={selectedSystem} onChange={setSelectedSystem} />
          {uploadState === "idle" && (
            <div className="rounded flex flex-col items-center justify-center gap-4 py-14 cursor-pointer transition-all" style={{ background: dragOver ? "#e8f2ff" : F.white, border: `2px dashed ${dragOver ? F.primary : F.border}` }} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleFileDrop} onClick={() => fileRef.current?.click()}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#e8f2ff" }}><FileSpreadsheet size={28} style={{ color: F.primary }} /></div>
              <div className="text-center"><p className="text-sm" style={{ color: F.text }}>Drag and drop your Excel file here</p><p className="text-xs mt-1" style={{ color: F.muted }}>or click to browse — .xlsx format only</p></div>
              <button className="flex items-center gap-2 px-5 py-2 text-sm text-white rounded" style={{ background: F.primary }} onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}><Upload size={14} /> Select File</button>
              <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={handleFileSelect} />
            </div>
          )}
          {(uploadState === "preview" || uploadState === "processing" || uploadState === "done") && (
            <div>
              <div className="rounded mb-4 flex items-center gap-3 px-4 py-3" style={{ background: F.white, border: `1px solid ${F.border}` }}>
                <FileSpreadsheet size={18} style={{ color: F.primary }} /><span className="text-sm flex-1" style={{ color: F.text }}>{fileName}</span><span className="text-xs" style={{ color: F.muted }}>{users.length} records found</span><button onClick={handleReset} className="p-1 rounded hover:bg-gray-100" style={{ color: F.muted }}><X size={15} /></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[{ label: "Total Records", value: users.length, color: F.primary, bg: "#e8f2ff" }, { label: uploadState === "done" ? "Processed" : "Valid", value: uploadState === "done" ? processedCount : validCount, color: F.success, bg: "#f1fdf6" }, { label: uploadState === "done" ? "Failed" : "Invalid", value: uploadState === "done" ? failedCount : invalidCount, color: F.error, bg: "#fff2f2" }, { label: "Skipped", value: uploadState === "done" ? invalidCount : 0, color: F.warning, bg: "#fff8f0" }].map((card) => (
                  <div key={card.label} className="rounded px-4 py-3" style={{ background: card.bg, border: `1px solid ${card.color}30` }}><p className="text-xs mb-1" style={{ color: F.muted }}>{card.label}</p><p className="text-2xl" style={{ color: card.color }}>{card.value}</p></div>
                ))}
              </div>
              {uploadState === "processing" && (
                <div className="mb-4 rounded px-4 py-4" style={{ background: F.white, border: `1px solid ${F.border}` }}>
                  <div className="flex items-center justify-between mb-2"><span className="text-sm" style={{ color: F.text }}>Processing users...</span><span className="text-sm" style={{ color: F.primary }}>{processingProgress}%</span></div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#e4e4e4" }}><div className="h-full rounded-full transition-all" style={{ width: `${processingProgress}%`, background: F.primary }} /></div>
                </div>
              )}
              {uploadState === "done" && (
                <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded" style={{ background: "#f1fdf6", border: `1px solid ${F.success}` }}>
                  <CheckCircle2 size={16} style={{ color: F.success }} /><p className="text-sm" style={{ color: F.success }}>Processing complete. <strong>{processedCount}</strong> users created, <strong>{failedCount}</strong> failed. Action recorded in audit log.</p>
                </div>
              )}
              <div className="rounded overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}` }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
                  <h3 className="text-sm" style={{ color: F.text }}>User Preview</h3>
                  {uploadState === "done" && <button onClick={downloadReport} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded" style={{ border: `1px solid ${F.primary}`, color: F.primary, background: F.white }}><Download size={12} /> Download Report</button>}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr style={{ background: "#f5f6f7", borderBottom: `1px solid ${F.border}` }}>{["Row", "Username", "Last Name", "Valid From", "Valid To", "Roles / Profiles", "Status", "Error Message"].map((h) => <th key={h} className="px-4 py-2.5 text-left text-xs" style={{ color: F.muted, fontWeight: 600 }}>{h}</th>)}</tr></thead>
                    <tbody>{users.map((user, i) => (<tr key={user.row} style={{ borderBottom: `1px solid ${F.border}`, background: (user.status === "invalid" || user.status === "failed") ? "#fff9f9" : i % 2 === 0 ? F.white : "#fafafa" }}><td className="px-4 py-2.5" style={{ color: F.muted }}>{user.row}</td><td className="px-4 py-2.5" style={{ color: F.text }}>{user.username || <span style={{ color: F.error }}>—</span>}</td><td className="px-4 py-2.5" style={{ color: F.text }}>{user.lastName || <span style={{ color: F.error }}>—</span>}</td><td className="px-4 py-2.5" style={{ color: F.text }}>{user.validFrom}</td><td className="px-4 py-2.5" style={{ color: F.text }}>{user.validTo}</td><td className="px-4 py-2.5" style={{ color: F.text }}>{user.roles || "—"}</td><td className="px-4 py-2.5">{statusBadge(user.status)}</td><td className="px-4 py-2.5 text-xs" style={{ color: user.errorMessage ? F.error : F.muted }}>{user.errorMessage || "—"}</td></tr>))}</tbody>
                  </table>
                </div>
              </div>
              {uploadState !== "done" && (<div className="mt-4 flex items-center justify-between"><button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 text-sm rounded" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}><RefreshCw size={14} /> Upload Different File</button>{uploadState === "preview" && validCount > 0 && <button onClick={handleProcess} className="flex items-center gap-2 px-5 py-2 text-sm rounded text-white" style={{ background: F.primary }}><Play size={14} /> Process {validCount} Valid Records</button>}</div>)}
              {uploadState === "done" && (<div className="mt-4"><button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 text-sm rounded" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}><RefreshCw size={14} /> Start New Upload</button></div>)}
            </div>
          )}
        </>
      )}
      {activeTab === "history" && <HistoryTab />}
    </div>
  );
}
