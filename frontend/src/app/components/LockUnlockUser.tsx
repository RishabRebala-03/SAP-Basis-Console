import { useState, useMemo, useEffect, useRef } from "react";
import {
  Lock, Unlock, AlertCircle, CheckCircle2, ShieldAlert, X,
  Server, History, Clock, Search, Filter, ChevronUp, ChevronDown, Play,
} from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { ValueHelpInput, MOCK_SAP_USERS } from "./ValueHelpInput";
import { SearchableFilterDropdown } from "./SearchableFilterDropdown";
import type { AuditLog } from "../contexts/AppContext";

const F = { primary: "#0070f2", success: "#107e3e", error: "#bb0000", warning: "#e9730c", text: "#32363a", muted: "#74777a", border: "#d9d9d9", bg: "#f5f6f7", white: "#ffffff" };
type Action = "lock" | "unlock";

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

function ConfirmDialog({ username, action, system, onConfirm, onCancel }: { username: string; action: Action; system: string; onConfirm: () => void; onCancel: () => void }) {
  const isLock = action === "lock";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="rounded shadow-xl w-full max-w-md mx-4" style={{ background: F.white }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${F.border}` }}>
          <div className="flex items-center gap-2"><ShieldAlert size={18} style={{ color: isLock ? F.error : F.warning }} /><h3 className="text-base" style={{ color: F.text }}>Confirm {isLock ? "Lock" : "Unlock"} User</h3></div>
          <button onClick={onCancel} className="p-1 rounded hover:bg-gray-100" style={{ color: F.muted }}><X size={16} /></button>
        </div>
        <div className="px-5 py-5">
          <div className="flex items-start gap-3 p-3 rounded mb-4" style={{ background: isLock ? "#fff2f2" : "#fff8f0", border: `1px solid ${isLock ? "#bb000030" : "#e9730c30"}` }}>
            {isLock ? <Lock size={16} style={{ color: F.error, flexShrink: 0, marginTop: "2px" }} /> : <Unlock size={16} style={{ color: F.warning, flexShrink: 0, marginTop: "2px" }} />}
            <p className="text-sm" style={{ color: F.text }}>You are about to <strong>{action}</strong> user <strong>{username}</strong> in <strong>{system}</strong>.{isLock ? " The user will immediately lose system access." : " The user will regain system access."}</p>
          </div>
          <p className="text-sm" style={{ color: F.muted }}>This action will be recorded in the security audit log.</p>
        </div>
        <div className="flex justify-end gap-3 px-5 py-4" style={{ borderTop: `1px solid ${F.border}`, background: "#fafafa" }}>
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded text-white" style={{ background: isLock ? F.error : F.success }}>{isLock ? "Lock User" : "Unlock User"}</button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = status === "Success" ? { bg: "#f1fdf6", color: F.success, border: "#107e3e40" } : status === "Failed" ? { bg: "#fff2f2", color: F.error, border: "#bb000040" } : { bg: "#fff8f0", color: F.warning, border: "#e9730c40" };
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{status === "Success" ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}{status}</span>;
}

// ── Filter logic ─────────────────────────────────────────────────────────────
const inputCls = "px-3 py-1.5 text-xs rounded outline-none w-full";
const inputStyle = { border: `1px solid ${F.border}`, background: F.white, color: F.text };
type SortField = "timestamp" | "targetObject" | "system" | "status" | "performedBy" | "action";
type SortDir = "desc" | "asc";
interface HistoryFilters { search: string; status: string; system: string; performedBy: string; action: string; dateFrom: string; dateTo: string; sortField: SortField; sortDir: SortDir; }
const DEFAULT_FILTERS: HistoryFilters = { search: "", status: "", system: "", performedBy: "", action: "", dateFrom: "", dateTo: "", sortField: "timestamp", sortDir: "desc" };

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
    if (currentFilters.action) r = r.filter((e) => e.action === currentFilters.action);
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

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open]);

  const groups = [
    { label: "Username",      tag: "USR", color: "#0070f2", values: targets },
    { label: "System",        tag: "SYS", color: "#107e3e", values: systems },
    { label: "Performed By",  tag: "ADM", color: "#e9730c", values: performers },
    { label: "Action",        tag: "ACT", color: "#74777a", values: actions },
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
          placeholder={placeholder ?? "Search username, system, action…"}
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
        {/* Search */}
        <div className="lg:col-span-2">
          <p className="text-xs mb-1" style={{ color: F.muted }}>Search</p>
          <SearchAutocomplete value={filters.search} onChange={set("search")} targets={targets} systems={systems} performers={performers} actions={actions} placeholder="Username, system…" />
        </div>
        {/* Action type */}
        <div>
          <SearchableFilterDropdown
            label="Action Type"
            value={filters.action}
            onChange={set("action")}
            options={["", ...actions]}
            allLabel="Lock & Unlock"
            placeholder="Search action…"
          />
        </div>
        {/* Status */}
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
        {/* System */}
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
        {/* Performed By */}
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
      </div>
      {/* Second row */}
      <div className="px-4 py-2.5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <p className="text-xs" style={{ color: F.muted }}>Date:</p>
          <input type="date" value={filters.dateFrom} onChange={(e) => set("dateFrom")(e.target.value)} className="px-2 py-1 text-xs rounded outline-none" style={inputStyle} />
          <span className="text-xs" style={{ color: F.muted }}>→</span>
          <input type="date" value={filters.dateTo} onChange={(e) => set("dateTo")(e.target.value)} className="px-2 py-1 text-xs rounded outline-none" style={inputStyle} />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={12} style={{ color: F.muted }} /><p className="text-xs" style={{ color: F.muted }}>Sort by:</p>
          {(["timestamp", "targetObject", "action", "system", "status", "performedBy"] as SortField[]).map((f) => {
            const labels: Record<string, string> = { timestamp: "Date", targetObject: "Username", action: "Action", system: "System", status: "Status", performedBy: "User" };
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
          {activeCount > 0 && <button onClick={clearAll} className="flex items-center gap-1 px-2.5 py-1 rounded text-xs" style={{ background: "#fff2f2", color: F.error, border: `1px solid #bb000030` }}><X size={11} /> Clear filters ({activeCount})</button>}
        </div>
      </div>
    </div>
  );
}

function HistoryTab() {
  const { auditLogs } = useAppContext();
  const allEntries = auditLogs.filter((l) => l.module === "Lock/Unlock");
  const fh = useHistoryFilters(allEntries);
  const { filtered } = fh;

  if (allEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: F.muted }}>
        <History size={40} strokeWidth={1.2} />
        <p className="text-sm">No lock / unlock history yet.</p>
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
            <span>Username</span><span>System / Client</span><span>Action</span><span>Performed By</span><span>Timestamp</span><span>Status</span>
          </div>
          {filtered.map((log, idx) => {
            const ts = new Date(log.timestamp);
            const isLock = log.action === "Lock User";
            return (
              <div key={log.id} className="px-5 py-4 grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-4 items-start" style={{ borderBottom: idx < filtered.length - 1 ? `1px solid ${F.border}` : "none" }}>
                <div><p className="text-sm font-medium" style={{ color: F.text }}>{log.targetObject}</p></div>
                <div><p className="text-sm" style={{ color: F.text }}>{log.system}</p><p className="text-xs mt-0.5" style={{ color: F.muted }}>Client {log.client}</p></div>
                <div className="flex items-center gap-1.5">
                  {isLock ? <Lock size={13} style={{ color: F.error }} /> : <Unlock size={13} style={{ color: F.success }} />}
                  <p className="text-sm" style={{ color: isLock ? F.error : F.success }}>{log.action}</p>
                </div>
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

function HistoryTabMini() {
  const { auditLogs } = useAppContext();
  const entries = auditLogs.filter((l) => l.module === "Lock/Unlock").slice(0, 5);
  if (entries.length === 0) return <div className="px-4 py-6 text-center" style={{ color: F.muted }}><p className="text-xs">No recent actions.</p></div>;
  return (
    <div className="divide-y" style={{ borderColor: F.border }}>
      {entries.map((item) => {
        const isLock = item.action === "Lock User";
        const ts = new Date(item.timestamp);
        return (
          <div key={item.id} className="px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              {isLock ? <Lock size={12} style={{ color: F.error }} /> : <Unlock size={12} style={{ color: F.success }} />}
              <span className="text-sm" style={{ color: F.text }}>{item.targetObject}</span>
              <span className="ml-auto px-2 py-0.5 text-xs rounded" style={{ background: isLock ? "#fff2f2" : "#f1fdf6", color: isLock ? F.error : F.success }}>{isLock ? "locked" : "unlocked"}</span>
            </div>
            <p className="text-xs" style={{ color: F.muted }}>{ts.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} {ts.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} · {item.performedBy} · {item.system}</p>
          </div>
        );
      })}
    </div>
  );
}

export function LockUnlockUser() {
  const { systems, logAction } = useAppContext();
  const [activeTab, setActiveTab] = useState<"control" | "history">("control");
  const [selectedSystem, setSelectedSystem] = useState("");
  const [username, setUsername] = useState("");
  const [action, setAction] = useState<Action>("lock");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState<{ username: string; action: Action; system: string } | null>(null);

  const validate = (): boolean => { const e: Record<string, string> = {}; if (!selectedSystem) e.system = "Please select a target SAP system"; if (!username.trim()) e.username = "Username is required"; setErrors(e); return Object.keys(e).length === 0; };
  const handleSubmitClick = () => { if (validate()) setShowConfirmDialog(true); };
  const handleConfirm = async () => {
    setShowConfirmDialog(false); setLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    const success = Math.random() > 0.15;
    setLoading(false); setStatus(success ? "success" : "error");
    const sys = systems.find((s) => s.id === selectedSystem);
    if (success) setLastAction({ username, action, system: sys?.systemId ?? "—" });
    logAction({
      module: "Lock/Unlock", action: action === "lock" ? "Lock User" : "Unlock User",
      targetObject: username, system: sys?.systemId ?? "—", client: sys?.client ?? "—",
      status: success ? "Success" : "Failed",
      durationMs: Math.floor(500 + Math.random() * 700),
      details: success ? (action === "lock" ? `User ${username} locked in ${sys?.systemId}/${sys?.client}. All active sessions terminated.` : `User ${username} unlocked in ${sys?.systemId}/${sys?.client}. Logon access restored.`) : `${action === "lock" ? "Lock" : "Unlock"} failed — ${username} not found or insufficient authorization (S_USR_ADM).`,
      errorCode: success ? undefined : "AUTH_FAILURE_S_USR_ADM",
      changesBefore: success ? `Status: ${action === "lock" ? "Active" : "Locked"}` : undefined,
      changesAfter: success ? `Status: ${action === "lock" ? "Locked" : "Active"}` : undefined,
    });
  };
  const handleReset = () => { setUsername(""); setAction("lock"); setErrors({}); setStatus("idle"); setSelectedSystem(""); };
  const sys = systems.find((s) => s.id === selectedSystem);
  const tabBtn = (active: boolean) => ({ color: active ? F.primary : F.muted, fontWeight: active ? "600" : "400", borderBottom: active ? `2px solid ${F.primary}` : "2px solid transparent", marginBottom: "-2px", background: "transparent", outline: "none" } as React.CSSProperties);

  return (
    <div>
      {showConfirmDialog && <ConfirmDialog username={username} action={action} system={sys ? `${sys.systemId} / Client ${sys.client}` : "—"} onConfirm={handleConfirm} onCancel={() => setShowConfirmDialog(false)} />}

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1"><Lock size={20} style={{ color: F.primary }} /><h1 className="text-xl" style={{ color: F.text }}>Lock / Unlock User</h1></div>
        <p className="text-sm" style={{ color: F.muted }}>Control SAP user account access by locking or unlocking accounts.</p>
      </div>

      <div className="flex gap-0 mb-6" style={{ borderBottom: `2px solid ${F.border}` }}>
        <button id="tab-lock-control" onClick={() => setActiveTab("control")} className="flex items-center gap-2 px-5 py-2.5 text-sm transition-all" style={tabBtn(activeTab === "control")}><Lock size={15} /> User Control</button>
        <button id="tab-lock-history" onClick={() => setActiveTab("history")} className="flex items-center gap-2 px-5 py-2.5 text-sm transition-all" style={tabBtn(activeTab === "history")}><History size={15} /> History</button>
      </div>

      {activeTab === "control" && (
        <>
          {status === "success" && lastAction && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded" style={{ background: "#f1fdf6", border: `1px solid ${F.success}` }}>
              <CheckCircle2 size={18} style={{ color: F.success, flexShrink: 0, marginTop: "2px" }} />
              <div><p className="text-sm" style={{ color: F.success }}>User <strong>{lastAction.username}</strong> successfully <strong>{lastAction.action}ed</strong> in <strong>{lastAction.system}</strong>.</p><p className="text-xs mt-0.5" style={{ color: F.muted }}>Action recorded in security audit log at {new Date().toLocaleTimeString()}.</p></div>
            </div>
          )}
          {status === "error" && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded" style={{ background: "#fff2f2", border: `1px solid ${F.error}` }}>
              <AlertCircle size={18} style={{ color: F.error, flexShrink: 0, marginTop: "2px" }} />
              <div><p className="text-sm" style={{ color: F.error }}>Operation failed. User not found or insufficient authorization.</p><p className="text-xs mt-0.5" style={{ color: F.muted }}>Check audit log for error code AUTH_FAILURE_S_USR_ADM.</p></div>
            </div>
          )}

          <SystemSelector systems={systems} selectedId={selectedSystem} onChange={setSelectedSystem} />
          {errors.system && <p className="flex items-center gap-1 mb-4 text-xs" style={{ color: F.error }}><AlertCircle size={11} /> {errors.system}</p>}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="rounded" style={{ background: F.white, border: `1px solid ${F.border}` }}>
                <div className="px-5 py-3" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}><h3 className="text-sm" style={{ color: F.text }}>User Account Control</h3></div>
                <div className="p-5">
                  <div className="mb-5">
                    <label className="block text-sm mb-1" style={{ color: F.muted }}>Username <span style={{ color: F.error }}>*</span></label>
                    <ValueHelpInput value={username} onChange={(v) => { setUsername(v); if (errors.username) setErrors((e) => { const n = { ...e }; delete n.username; return n; }); }} options={MOCK_SAP_USERS} placeholder="Select or search user…" error={errors.username} emptyMessage="No matching SAP users found." />
                    <p className="text-xs mt-1.5" style={{ color: F.muted }}>Click input to browse all users. Locked users are marked in the list.</p>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm mb-2" style={{ color: F.muted }}>Action <span style={{ color: F.error }}>*</span></label>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setAction("lock")} className="flex items-center gap-3 p-4 rounded text-left transition-all" style={{ border: `2px solid ${action === "lock" ? F.error : F.border}`, background: action === "lock" ? "#fff2f2" : F.white }}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: action === "lock" ? F.error : "#f5f6f7" }}><Lock size={16} style={{ color: action === "lock" ? "#fff" : F.muted }} /></div>
                        <div><p className="text-sm" style={{ color: action === "lock" ? F.error : F.text }}>Lock User</p><p className="text-xs mt-0.5" style={{ color: F.muted }}>Revoke system access</p></div>
                      </button>
                      <button onClick={() => setAction("unlock")} className="flex items-center gap-3 p-4 rounded text-left transition-all" style={{ border: `2px solid ${action === "unlock" ? F.success : F.border}`, background: action === "unlock" ? "#f1fdf6" : F.white }}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: action === "unlock" ? F.success : "#f5f6f7" }}><Unlock size={16} style={{ color: action === "unlock" ? "#fff" : F.muted }} /></div>
                        <div><p className="text-sm" style={{ color: action === "unlock" ? F.success : F.text }}>Unlock User</p><p className="text-xs mt-0.5" style={{ color: F.muted }}>Restore system access</p></div>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded" style={{ background: "#f0f6ff", border: `1px solid #0070f230` }}>
                    <AlertCircle size={15} style={{ color: F.primary, flexShrink: 0, marginTop: "2px" }} />
                    <p className="text-xs" style={{ color: F.muted }}>{action === "lock" ? "Locking a user will immediately terminate active sessions and prevent further logon. The user remains locked until manually unlocked." : "Unlocking a user restores logon access. Ensure the user's validity period is still active and roles are correctly assigned."}</p>
                  </div>
                </div>
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderTop: `1px solid ${F.border}`, background: "#fafafa" }}>
                  <button onClick={handleReset} className="px-4 py-2 text-sm rounded" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>Clear</button>
                  <button onClick={handleSubmitClick} disabled={loading} className="flex items-center gap-2 px-5 py-2 text-sm rounded text-white" style={{ background: loading ? "#74a8f5" : action === "lock" ? F.error : F.success }}>
                    {loading ? <><span className="animate-spin border-2 border-white border-t-transparent rounded-full w-3.5 h-3.5" /> Processing...</> : action === "lock" ? <><Lock size={14} /> Lock User</> : <><Unlock size={14} /> Unlock User</>}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <div className="rounded" style={{ background: F.white, border: `1px solid ${F.border}` }}>
                <div className="px-4 py-3" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}><h3 className="text-sm" style={{ color: F.text }}>Recent Activity</h3></div>
                <HistoryTabMini />
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "history" && <HistoryTab />}
    </div>
  );
}
