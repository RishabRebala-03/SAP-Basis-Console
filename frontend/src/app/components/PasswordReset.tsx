import { useState, useMemo, useEffect, useRef } from "react";
import {
  KeyRound, AlertCircle, CheckCircle2, Server, Copy, Check,
  Eye, EyeOff, History, Clock, Search, Filter, X, ChevronUp, ChevronDown, Play,
} from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { ValueHelpInput, MOCK_SAP_USERS } from "./ValueHelpInput";
import { SearchableFilterDropdown } from "./SearchableFilterDropdown";
import type { AuditLog } from "../contexts/AppContext";

const F = {
  primary: "#0070f2", success: "#107e3e", error: "#bb0000", warning: "#e9730c",
  text: "var(--app-text)", muted: "var(--app-muted)", border: "var(--app-border)", bg: "var(--app-bg)", white: "var(--app-surface)",
};

function generatePasswordFromServer(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*";
  const pool = [
    upper[Math.floor(Math.random() * upper.length)],
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
    special[Math.floor(Math.random() * special.length)],
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
  ];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.join("");
}

function SystemSelector({ systems, selectedId, onChange }: {
  systems: ReturnType<typeof useAppContext>["systems"]; selectedId: string; onChange: (id: string) => void;
}) {
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

// ── Shared filter input styles ──────────────────────────────────────────────
const inputCls = "px-3 py-1.5 text-xs rounded outline-none w-full";
const inputStyle = { border: `1px solid ${F.border}`, background: F.white, color: F.text };

type SortField = "timestamp" | "targetObject" | "system" | "status" | "performedBy";
type SortDir = "desc" | "asc";

interface HistoryFilters {
  search: string;
  status: string;
  system: string;
  performedBy: string;
  dateFrom: string;
  dateTo: string;
  sortField: SortField;
  sortDir: SortDir;
}

const DEFAULT_FILTERS: HistoryFilters = {
  search: "", status: "", system: "", performedBy: "",
  dateFrom: "", dateTo: "", sortField: "timestamp", sortDir: "desc",
};

function useHistoryFilters(entries: AuditLog[]) {
  const [filters, setFilters] = useState<HistoryFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<HistoryFilters | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const set = (k: keyof HistoryFilters) => (v: string) =>
    setFilters((f) => ({ ...f, [k]: v }));

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

  const activeCount = Object.entries(filters).filter(([k, v]) =>
    k !== "sortField" && k !== "sortDir" && v !== ""
  ).length;

  const currentFilters = appliedFilters || DEFAULT_FILTERS;
  const filtered = useMemo(() => {
    if (!hasSubmitted) return [];
    let r = [...entries];
    if (currentFilters.search) {
      const q = currentFilters.search.toLowerCase();
      r = r.filter((e) =>
        e.targetObject.toLowerCase().includes(q) ||
        e.system.toLowerCase().includes(q) ||
        e.performedBy.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q)
      );
    }
    if (currentFilters.status) r = r.filter((e) => e.status === currentFilters.status);
    if (currentFilters.system) r = r.filter((e) => e.system === currentFilters.system);
    if (currentFilters.performedBy) r = r.filter((e) => e.performedBy === currentFilters.performedBy);
    if (currentFilters.dateFrom) r = r.filter((e) => e.timestamp >= currentFilters.dateFrom);
    if (currentFilters.dateTo) {
      const to = currentFilters.dateTo + "T23:59:59Z";
      r = r.filter((e) => e.timestamp <= to);
    }
    r.sort((a, b) => {
      let av = a[currentFilters.sortField as keyof AuditLog] as string ?? "";
      let bv = b[currentFilters.sortField as keyof AuditLog] as string ?? "";
      return currentFilters.sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return r;
  }, [entries, currentFilters, hasSubmitted]);

  return { filters, set, clearAll, submitFilters, hasSubmitted, systems, performers,
    actions: useMemo(() => [...new Set(entries.map((e) => e.action).filter(Boolean))].sort(), [entries]),
    targets: useMemo(() => [...new Set(entries.map((e) => e.targetObject).filter(Boolean))].sort(), [entries]),
    activeCount, filtered };
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

function HistoryFilterBar({
  filters, set, clearAll, submitFilters, systems, performers, actions, targets, activeCount, total, shown,
}: ReturnType<typeof useHistoryFilters> & { total: number; shown: number }) {
  const toggleSort = (field: SortField) => {
    if (filters.sortField === field) {
      set("sortDir")(filters.sortDir === "desc" ? "asc" : "desc");
    } else {
      set("sortField")(field);
      set("sortDir")("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    filters.sortField === field
      ? filters.sortDir === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />
      : null;

  return (
    <div className="mb-4 rounded" style={{ background: F.white, border: `1px solid ${F.border}` }}>
      {/* Filter row */}
      <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end" style={{ borderBottom: `1px solid ${F.border}` }}>
        {/* Search */}
        <div className="lg:col-span-2">
          <p className="text-xs mb-1" style={{ color: F.muted }}>Search</p>
          <SearchAutocomplete value={filters.search} onChange={set("search")} targets={targets} systems={systems} performers={performers} actions={actions} placeholder="Username, system, action…" />
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

        {/* Date From */}
        <div>
          <p className="text-xs mb-1" style={{ color: F.muted }}>Date From</p>
          <input type="date" value={filters.dateFrom} onChange={(e) => set("dateFrom")(e.target.value)} className={inputCls} style={inputStyle} />
        </div>
      </div>

      {/* Second row: date to + sort + results */}
      <div className="px-4 py-2.5 flex flex-wrap items-center gap-3">
        {/* Date To */}
        <div className="flex items-center gap-2">
          <p className="text-xs" style={{ color: F.muted }}>To:</p>
          <input type="date" value={filters.dateTo} onChange={(e) => set("dateTo")(e.target.value)} className="px-2 py-1 text-xs rounded outline-none" style={inputStyle} />
        </div>

        {/* Sort by */}
        <div className="flex items-center gap-1.5">
          <Filter size={12} style={{ color: F.muted }} />
          <p className="text-xs" style={{ color: F.muted }}>Sort by:</p>
          {(["timestamp", "targetObject", "system", "status", "performedBy"] as SortField[]).map((f) => {
            const labels: Record<SortField, string> = { timestamp: "Date", targetObject: "Username", system: "System", status: "Status", performedBy: "User" };
            const isActive = filters.sortField === f;
            return (
              <button
                key={f} onClick={() => toggleSort(f)}
                className="flex items-center gap-0.5 px-2.5 py-1 rounded text-xs transition-all"
                style={{ background: isActive ? F.primary : F.bg, color: isActive ? "#fff" : F.text, border: `1px solid ${isActive ? F.primary : F.border}` }}
              >
                {labels[f]} <SortIcon field={f} />
              </button>
            );
          })}
        </div>

        {/* Results count + clear */}
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={submitFilters}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded text-white shadow-sm transition-all"
            style={{ background: F.primary }}
          >
            <Play size={12} fill="currentColor" /> Go
          </button>
          <p className="text-xs" style={{ color: F.muted }}>
            Showing <strong style={{ color: F.text }}>{shown}</strong> of <strong style={{ color: F.text }}>{total}</strong> entries
          </p>
          {activeCount > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1 px-2.5 py-1 rounded text-xs" style={{ background: "#fff2f2", color: F.error, border: `1px solid #bb000030` }}>
              <X size={11} /> Clear filters ({activeCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── History Tab ─────────────────────────────────────────────────────────────
function HistoryTab() {
  const { auditLogs } = useAppContext();
  const allEntries = auditLogs.filter((l) => l.module === "Password Reset");
  const fh = useHistoryFilters(allEntries);
  const { filtered } = fh;

  if (allEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: F.muted }}>
        <History size={40} strokeWidth={1.2} />
        <p className="text-sm">No password reset history yet.</p>
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
            <span>Username</span>
            <span>System / Client</span>
            <span>Action</span>
            <span>Performed By</span>
            <span>Timestamp</span>
            <span>Status</span>
          </div>
          {filtered.map((log, idx) => {
            const ts = new Date(log.timestamp);
            return (
              <div key={log.id} className="px-5 py-4 grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-4 items-start" style={{ borderBottom: idx < filtered.length - 1 ? `1px solid ${F.border}` : "none" }}>
                <div><p className="text-sm font-medium" style={{ color: F.text }}>{log.targetObject}</p></div>
                <div>
                  <p className="text-sm" style={{ color: F.text }}>{log.system}</p>
                  <p className="text-xs mt-0.5" style={{ color: F.muted }}>Client {log.client}</p>
                </div>
                <div><p className="text-sm" style={{ color: F.text }}>{log.action}</p></div>
                <div>
                  <p className="text-sm" style={{ color: F.text }}>{log.performedBy}</p>
                  <p className="text-xs mt-0.5" style={{ color: F.muted }}>{log.ipAddress}</p>
                </div>
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

// ── Main Component ───────────────────────────────────────────────────────────
export function PasswordReset() {
  const { systems, logAction } = useAppContext();
  const [activeTab, setActiveTab] = useState<"reset" | "history">("reset");
  const [selectedSystem, setSelectedSystem] = useState("");
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [returnedPassword, setReturnedPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!selectedSystem) e.system = "Please select a target SAP system";
    if (!username.trim()) e.username = "Username is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleResetClick = async () => {
    if (!validate()) return;
    setLoading(true); setStatus("idle"); setReturnedPassword(""); setShowPassword(false);
    await new Promise((r) => setTimeout(r, 1500));
    const success = Math.random() > 0.2;
    const serverPassword = success ? generatePasswordFromServer() : "";
    setLoading(false); setStatus(success ? "success" : "error"); setReturnedPassword(serverPassword);
    const sys = systems.find((s) => s.id === selectedSystem);
    logAction({
      module: "Password Reset", action: "Reset Password", targetObject: username,
      system: sys?.systemId ?? "—", client: sys?.client ?? "—",
      status: success ? "Success" : "Failed",
      durationMs: Math.floor(600 + Math.random() * 800),
      details: success
        ? `Temporary system-generated password assigned to ${username}. Force change on next logon enabled.`
        : `Password reset failed — ${username} not found in ${sys?.systemId ?? "system"} or authorization error.`,
      errorCode: success ? undefined : "BAPI_USER_NOT_FOUND",
      changesBefore: success ? "Password: [previous encrypted]" : undefined,
      changesAfter: success ? "Temporary password set, force change flag = TRUE" : undefined,
    });
  };

  const handleClear = () => { setUsername(""); setErrors({}); setStatus("idle"); setSelectedSystem(""); setReturnedPassword(""); setShowPassword(false); setCopied(false); };
  const handleCopy = () => { navigator.clipboard.writeText(returnedPassword).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const sys = systems.find((s) => s.id === selectedSystem);

  const tabBtn = (active: boolean) => ({
    color: active ? F.primary : F.muted,
    fontWeight: active ? "600" : "400",
    borderBottom: active ? `2px solid ${F.primary}` : "2px solid transparent",
    marginBottom: "-2px", background: "transparent", outline: "none",
  } as React.CSSProperties);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound size={20} style={{ color: F.primary }} />
          <h1 className="text-xl" style={{ color: F.text }}>Password Reset</h1>
        </div>
        <p className="text-sm" style={{ color: F.muted }}>The system will generate a secure temporary password for the selected user.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6" style={{ borderBottom: `2px solid ${F.border}` }}>
        <button id="tab-pw-reset" onClick={() => setActiveTab("reset")} className="flex items-center gap-2 px-5 py-2.5 text-sm transition-all" style={tabBtn(activeTab === "reset")}>
          <KeyRound size={15} /> Password Reset
        </button>
        <button id="tab-pw-history" onClick={() => setActiveTab("history")} className="flex items-center gap-2 px-5 py-2.5 text-sm transition-all" style={tabBtn(activeTab === "history")}>
          <History size={15} /> History
        </button>
      </div>

      {activeTab === "reset" && (
        <>
          {status === "success" && (
            <div className="mb-5 rounded" style={{ background: "#f1fdf6", border: `1px solid ${F.success}` }}>
              <div className="flex items-start gap-3 px-4 py-4" style={{ borderBottom: `1px solid #107e3e30` }}>
                <CheckCircle2 size={18} style={{ color: F.success, flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <p className="text-sm" style={{ color: F.success }}>Password reset successfully for <strong>{username}</strong> in <strong>{sys?.systemId}</strong>.</p>
                  <p className="text-xs mt-0.5" style={{ color: F.muted }}>User will be forced to change this password on next login. Action recorded in audit log.</p>
                </div>
              </div>
              <div className="px-4 py-4">
                <p className="text-xs mb-2" style={{ color: F.muted }}>Temporary Password (received from server) — share securely with the user:</p>
                <div className="flex items-center gap-3 p-3 rounded" style={{ background: F.white, border: `1px solid ${F.success}30` }}>
                  <code className="flex-1 text-base" style={{ color: F.text, fontFamily: "monospace", letterSpacing: showPassword ? "0.15em" : "0.3em" }}>
                    {showPassword ? returnedPassword : "•".repeat(returnedPassword.length)}
                  </code>
                  <button onClick={() => setShowPassword(!showPassword)} className="p-1.5 rounded hover:bg-gray-100" style={{ color: F.muted }}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded" style={{ background: copied ? "#f1fdf6" : F.bg, border: `1px solid ${copied ? F.success : F.border}`, color: copied ? F.success : F.text }}>
                    {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
                <div className="flex items-start gap-2 mt-3 p-3 rounded" style={{ background: "#fff8f0", border: `1px solid #e9730c30` }}>
                  <AlertCircle size={14} style={{ color: F.warning, flexShrink: 0, marginTop: "2px" }} />
                  <p className="text-xs" style={{ color: F.muted }}>Copy this password now. This is the only time it will be shown — it is not stored and will not be retrievable after leaving this page. The user must change it on their first logon.</p>
                </div>
              </div>
            </div>
          )}
          {status === "error" && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded" style={{ background: "#fff2f2", border: `1px solid ${F.error}` }}>
              <AlertCircle size={18} style={{ color: F.error, flexShrink: 0, marginTop: "2px" }} />
              <div>
                <p className="text-sm" style={{ color: F.error }}>Password reset failed — user not found or insufficient authorization.</p>
                <p className="text-xs mt-0.5" style={{ color: F.muted }}>Check the audit log for error code BAPI_USER_NOT_FOUND.</p>
              </div>
            </div>
          )}

          <SystemSelector systems={systems} selectedId={selectedSystem} onChange={setSelectedSystem} />
          {errors.system && <p className="flex items-center gap-1 mb-4 text-xs" style={{ color: F.error }}><AlertCircle size={11} /> {errors.system}</p>}

          <div className="max-w-2xl">
            <div className="rounded" style={{ background: F.white, border: `1px solid ${F.border}` }}>
              <div className="px-5 py-3" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
                <h3 className="text-sm" style={{ color: F.text }}>User Identification</h3>
              </div>
              <div className="p-5" style={{ borderBottom: `1px solid ${F.border}` }}>
                <label className="block text-sm mb-1" style={{ color: F.muted }}>Username <span style={{ color: F.error }}>*</span></label>
                <ValueHelpInput
                  value={username}
                  onChange={(v) => { setUsername(v); if (errors.username) setErrors((e) => { const n = { ...e }; delete n.username; return n; }); }}
                  options={MOCK_SAP_USERS} placeholder="Select or search user…" error={errors.username} emptyMessage="No matching SAP users found."
                />
                <p className="text-xs mt-1.5" style={{ color: F.muted }}>Click input to browse all users with live search.</p>
              </div>
              <div className="px-5 py-4 flex items-center justify-between" style={{ background: "#fafafa" }}>
                <button onClick={handleClear} className="px-4 py-2 text-sm rounded" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>Clear</button>
                <button onClick={handleResetClick} disabled={loading} className="flex items-center gap-2 px-5 py-2 text-sm rounded text-white" style={{ background: loading ? "#74a8f5" : F.primary }}>
                  {loading ? <><span className="animate-spin border-2 border-white border-t-transparent rounded-full w-3.5 h-3.5" /> Resetting...</> : <><KeyRound size={14} /> Reset Password</>}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "history" && <HistoryTab />}
    </div>
  );
}
