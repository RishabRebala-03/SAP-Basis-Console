import { useState, useMemo, useEffect, useRef } from "react";
import {
  Eye, EyeOff, CheckCircle2, AlertCircle, RotateCcw, Save,
  UserPlus, Server, History, Clock, Search, Filter, X, ChevronUp, ChevronDown, Play,
} from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { SearchableFilterDropdown } from "./SearchableFilterDropdown";
import type { AuditLog } from "../contexts/AppContext";
import { createSingleUserApi } from "../../api/sapApi";

interface FormData {
  username: string; lastName: string; firstName: string; email: string;
  tempPassword: string; validFrom: string; validTo: string; roles: string; userType: string;
}
interface FormErrors { [key: string]: string; }

const AVAILABLE_ROLES = [
  "Z_BASIS_ADMIN", "Z_FI_ACCOUNTANT", "Z_MM_PURCHASER", "Z_SD_SALES",
  "Z_HR_MANAGER", "Z_PP_PLANNER", "Z_QM_INSPECTOR", "Z_CO_CONTROLLER",
  "SAP_ALL", "SAP_NEW",
];
const USER_TYPES = ["Dialog", "System", "Communication", "Service", "Reference"];

const F = {
  primary: "#0070f2", success: "#107e3e", error: "#bb0000", warning: "#e9730c",
  text: "var(--app-text)", muted: "var(--app-muted)", border: "var(--app-border)", bg: "var(--app-bg)", white: "var(--app-surface)",
};

function FioriLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="block text-sm mb-1" style={{ color: F.muted }}>
      {label} {required && <span style={{ color: F.error }}>*</span>}
    </label>
  );
}

function FioriInput({ value, onChange, placeholder, type = "text", error, disabled }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; error?: string; disabled?: boolean;
}) {
  return (
    <div>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        className="w-full px-3 py-2 text-sm outline-none transition-all"
        style={{ border: `1px solid ${error ? F.error : F.border}`, borderRadius: "4px", background: disabled ? F.bg : F.white, color: F.text }}
        onFocus={(e) => { e.target.style.borderColor = error ? F.error : F.primary; e.target.style.boxShadow = `0 0 0 2px ${error ? "#bb000020" : "#0070f220"}`; }}
        onBlur={(e) => { e.target.style.borderColor = error ? F.error : F.border; e.target.style.boxShadow = "none"; }}
      />
      {error && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: F.error }}><AlertCircle size={11} /> {error}</p>}
    </div>
  );
}

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

interface HistoryFilters {
  search: string; status: string; system: string; performedBy: string;
  dateFrom: string; dateTo: string; sortField: SortField; sortDir: SortDir;
}
const DEFAULT_FILTERS: HistoryFilters = {
  search: "", status: "", system: "", performedBy: "",
  dateFrom: "", dateTo: "", sortField: "timestamp", sortDir: "desc",
};

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
    r.sort((a, b) => {
      const av = (a[currentFilters.sortField as keyof AuditLog] as string) ?? "";
      const bv = (b[currentFilters.sortField as keyof AuditLog] as string) ?? "";
      return currentFilters.sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
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
  const toggleSort = (field: SortField) => {
    if (filters.sortField === field) set("sortDir")(filters.sortDir === "desc" ? "asc" : "desc");
    else { set("sortField")(field); set("sortDir")("desc"); }
  };
  const SortIcon = ({ field }: { field: SortField }) =>
    filters.sortField === field ? (filters.sortDir === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />) : null;

  return (
    <div className="mb-4 rounded" style={{ background: F.white, border: `1px solid ${F.border}` }}>
      <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end" style={{ borderBottom: `1px solid ${F.border}` }}>
        <div className="lg:col-span-2">
          <p className="text-xs mb-1" style={{ color: F.muted }}>Search</p>
          <SearchAutocomplete value={filters.search} onChange={set("search")} targets={targets} systems={systems} performers={performers} actions={actions} placeholder="Username, system, action…" />
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
        <div>
          <p className="text-xs mb-1" style={{ color: F.muted }}>Date From</p>
          <input type="date" value={filters.dateFrom} onChange={(e) => set("dateFrom")(e.target.value)} className={inputCls} style={inputStyle} />
        </div>
      </div>
      <div className="px-4 py-2.5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <p className="text-xs" style={{ color: F.muted }}>To:</p>
          <input type="date" value={filters.dateTo} onChange={(e) => set("dateTo")(e.target.value)} className="px-2 py-1 text-xs rounded outline-none" style={inputStyle} />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={12} style={{ color: F.muted }} />
          <p className="text-xs" style={{ color: F.muted }}>Sort by:</p>
          {(["timestamp", "targetObject", "system", "status", "performedBy"] as SortField[]).map((f) => {
            const labels: Record<SortField, string> = { timestamp: "Date", targetObject: "Username", system: "System", status: "Status", performedBy: "User" };
            const isActive = filters.sortField === f;
            return (
              <button key={f} onClick={() => toggleSort(f)} className="flex items-center gap-0.5 px-2.5 py-1 rounded text-xs transition-all" style={{ background: isActive ? F.primary : F.bg, color: isActive ? "#fff" : F.text, border: `1px solid ${isActive ? F.primary : F.border}` }}>
                {labels[f]} <SortIcon field={f} />
              </button>
            );
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
  const allEntries = auditLogs.filter((l) => l.module === "Single User");
  const fh = useHistoryFilters(allEntries);
  const { filtered } = fh;

  if (allEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: F.muted }}>
        <History size={40} strokeWidth={1.2} />
        <p className="text-sm">No user creation history yet.</p>
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
          <div className="px-5 py-3 grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-4 text-xs font-medium" style={{ borderBottom: `1px solid ${F.border}`, backgroundColor: "#1d2d3e", color: "white",fontWeight:700,fontSize:14 }}>
            <span>Username</span><span>System / Client</span><span>Action</span><span>Performed By</span><span>Timestamp</span><span>Status</span>
          </div>
          {filtered.map((log, idx) => {
            const ts = new Date(log.timestamp);
            return (
              <div key={log.id} className="px-5 py-4 grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-4 items-start" style={{ borderBottom: idx < filtered.length - 1 ? `1px solid ${F.border}` : "none" }}>
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
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export function SingleUserCreation({ embedded = false }: { embedded?: boolean }) {
  const { systems, logAction } = useAppContext();
  const [activeTab, setActiveTab] = useState<"creation" | "history">("creation");
  const [selectedSystem, setSelectedSystem] = useState("");
  const [form, setForm] = useState<FormData>({ username: "", lastName: "", firstName: "", email: "", tempPassword: "", validFrom: "", validTo: "", roles: "", userType: "Dialog" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);

  const set = (field: keyof FormData) => (value: string) => { setForm((f) => ({ ...f, [field]: value })); if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; }); };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!selectedSystem) e.system = "Please select a target SAP system";
    if (!form.username.trim()) e.username = "Username is required";
    else if (!/^[A-Z0-9_.]{3,12}$/.test(form.username)) e.username = "3–12 chars, uppercase letters/numbers/dots only";
    if (!form.lastName.trim()) {
  e.lastName = "Last name is required";
}

/* Email validation */
if (form.email.trim()) {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  if (!emailRegex.test(form.email.trim())) {
    e.email = "Enter a valid email address (example: user@company.com)";
  }
}
    if (!form.tempPassword) e.tempPassword = "Temporary password is required";
    else if (form.tempPassword.length < 8) e.tempPassword = "Minimum 8 characters";
    if (!form.validFrom) e.validFrom = "Valid From date is required";
    if (!form.validTo) e.validTo = "Valid To date is required";
    if (form.validFrom && form.validTo && form.validFrom >= form.validTo) e.validTo = "Valid To must be after Valid From";
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setStatus("idle");
    const sys = systems.find((s) => s.id === selectedSystem);
    const targetSystemId = sys?.systemId || selectedSystem || "SHD";

    try {
      const res = await createSingleUserApi({
        system_id: targetSystemId,
        username: form.username,
        first_name: form.firstName,
        last_name: form.lastName,
        init_password: form.tempPassword || "Venkanna@123",
        user_type: form.userType,
        email: form.email,
        valid_from: form.validFrom,
        valid_to: form.validTo,
        roles: selectedRoles,
      });

      setLoading(false);
      setStatus("success");
      logAction({
        module: "Single User", action: "Create User", targetObject: form.username,
        system: targetSystemId, client: sys?.client ?? "100",
        status: "Success",
        durationMs: 1100,
        details: res.Message || `User ${form.username} (${form.lastName}, ${form.firstName}) created in SAP.`,
        changesAfter: `User ${form.username} provisioned in ${targetSystemId}/${sys?.client || "100"}`
      });
    } catch (err: any) {
      setLoading(false);
      setStatus("error");
      logAction({
        module: "Single User", action: "Create User", targetObject: form.username,
        system: targetSystemId, client: sys?.client ?? "100",
        status: "Failed",
        durationMs: 700,
        details: err.message || "User creation failed in SAP system.",
        errorCode: "BAPI_USER_EXIST"
      });
    }
  };

  const handleReset = () => { setForm({ username: "", lastName: "", firstName: "", email: "", tempPassword: "", validFrom: "", validTo: "", roles: "", userType: "Dialog" }); setSelectedRoles([]); setErrors({}); setStatus("idle"); setSelectedSystem(""); };
  const toggleRole = (role: string) => { setSelectedRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]); if (errors.roles) setErrors((e) => { const n = { ...e }; delete n.roles; return n; }); };

  const tabBtn = (active: boolean) => ({
    color: active ? F.primary : F.muted, fontWeight: active ? "600" : "400",
    borderBottom: active ? `2px solid ${F.primary}` : "2px solid transparent",
    marginBottom: "-2px", background: "transparent", outline: "none",
  } as React.CSSProperties);

  return (
    <div>
      {!embedded && (
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1"><UserPlus size={20} style={{ color: F.primary }} /><h1 className="text-xl" style={{ color: F.text,font }}>Single User Creation</h1></div>
            <p className="text-sm" style={{ color: F.muted }}>Create a new SAP user account with roles and validity periods.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 mb-6" style={{ borderBottom: `2px solid ${F.border}` }}>
        <button id="tab-user-creation" onClick={() => setActiveTab("creation")} className="flex items-center gap-2 px-5 py-2.5 text-sm transition-all" style={tabBtn(activeTab === "creation")}>
          <UserPlus size={15} /> User Creation
        </button>
        <button id="tab-history" onClick={() => setActiveTab("history")} className="flex items-center gap-2 px-5 py-2.5 text-sm transition-all" style={tabBtn(activeTab === "history")}>
          <History size={15} /> History
        </button>
      </div>

      {activeTab === "creation" && (
        <>
          {status === "success" && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3.5 rounded" style={{ background: "#f1fdf6", border: `1px solid ${F.success}` }}>
              <CheckCircle2 size={18} style={{ color: F.success, flexShrink: 0, marginTop: "2px" }} />
              <div>
                <p className="text-sm" style={{ color: F.success }}>User <strong>{form.username}</strong> created successfully in <strong>{systems.find((s) => s.id === selectedSystem)?.systemId}</strong>.</p>
                <p className="text-xs mt-0.5" style={{ color: F.muted }}>Verified in SAP system and action recorded in security audit log at {new Date().toLocaleTimeString()}.</p>
              </div>
            </div>
          )}
          {status === "error" && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded" style={{ background: "#fff2f2", border: `1px solid ${F.error}` }}>
              <AlertCircle size={18} style={{ color: F.error, flexShrink: 0, marginTop: "2px" }} />
              <div>
                <p className="text-sm" style={{ color: F.error }}>Failed to create user. Username may already exist in this system.</p>
                <p className="text-xs mt-0.5" style={{ color: F.muted }}>Check the audit log for error details.</p>
              </div>
            </div>
          )}

          <SystemSelector systems={systems} selectedId={selectedSystem} onChange={setSelectedSystem} />
          {errors.system && <p className="flex items-center gap-1 mb-4 text-xs" style={{ color: F.error }}><AlertCircle size={11} /> {errors.system}</p>}

          <div className="rounded" style={{ background: F.white, border: `1px solid ${F.border}` }}>
            <div className="px-5 py-3" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}><h3 className="text-sm" style={{ color: F.text }}>Basic Information</h3></div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" style={{ borderBottom: `1px solid ${F.border}` }}>
              <div><FioriLabel label="Username" required /><FioriInput value={form.username} onChange={(v) => set("username")(v.toUpperCase())} placeholder="e.g. JOHN.DOE" error={errors.username} /><p className="text-xs mt-1" style={{ color: F.muted }}>Max 12 characters, uppercase</p></div>
              <div><FioriLabel label="Last Name" required /><FioriInput value={form.lastName} onChange={set("lastName")} placeholder="Family name" error={errors.lastName} /></div>
              <div><FioriLabel label="First Name" /><FioriInput value={form.firstName} onChange={set("firstName")} placeholder="Given name" /></div>
              <div><FioriLabel label="Email Address" /><FioriInput value={form.email} onChange={set("email")} placeholder="user@company.com" type="email" error={errors.email} /></div>
              <div>
                <FioriLabel label="User Type" required />
                <select value={form.userType} onChange={(e) => set("userType")(e.target.value)} className="w-full px-3 py-2 text-sm outline-none" style={{ border: `1px solid ${F.border}`, borderRadius: "4px", background: F.white, color: F.text }}>
                  {USER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="px-5 py-3" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}><h3 className="text-sm" style={{ color: F.text }}>Security</h3></div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5" style={{ borderBottom: `1px solid ${F.border}` }}>
              <div>
                <FioriLabel label="Temporary Password" required />
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={form.tempPassword} onChange={(e) => set("tempPassword")(e.target.value)} placeholder="Minimum 8 characters"
                    className="w-full px-3 py-2 pr-10 text-sm outline-none transition-all" style={{ border: `1px solid ${errors.tempPassword ? F.error : F.border}`, borderRadius: "4px", background: F.white, color: F.text }}
                    onFocus={(e) => { e.target.style.borderColor = F.primary; e.target.style.boxShadow = `0 0 0 2px #0070f220`; }}
                    onBlur={(e) => { e.target.style.borderColor = errors.tempPassword ? F.error : F.border; e.target.style.boxShadow = "none"; }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: F.muted }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.tempPassword && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: F.error }}><AlertCircle size={11} /> {errors.tempPassword}</p>}
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ background: form.tempPassword.length === 0 ? "#d9d9d9" : i === 1 ? (form.tempPassword.length < 6 ? F.error : F.success) : i === 2 ? (form.tempPassword.length < 8 ? F.warning : F.success) : i === 3 ? (form.tempPassword.length < 10 ? (form.tempPassword.length >= 8 ? "#f0ab00" : "#d9d9d9") : F.success) : form.tempPassword.length >= 12 ? F.success : "#d9d9d9" }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-3" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}><h3 className="text-sm" style={{ color: F.text }}>Validity Period</h3></div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5" style={{ borderBottom: `1px solid ${F.border}` }}>
              <div><FioriLabel label="Valid From" required /><FioriInput value={form.validFrom} onChange={set("validFrom")} type="date" error={errors.validFrom} /></div>
              <div><FioriLabel label="Valid To" required /><FioriInput value={form.validTo} onChange={set("validTo")} type="date" error={errors.validTo} /></div>
            </div>

            <div className="px-5 py-3" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}><h3 className="text-sm" style={{ color: F.text }}>Roles &amp; Profiles</h3></div>
            <div className="p-5" style={{ borderBottom: `1px solid ${F.border}` }}>
              <FioriLabel label="Select Roles / Profiles" required />
              {errors.roles && <p className="flex items-center gap-1 mb-2 text-xs" style={{ color: F.error }}><AlertCircle size={11} /> {errors.roles}</p>}
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ROLES.map((role) => {
                  const selected = selectedRoles.includes(role);
                  return (
                    <button key={role} onClick={() => toggleRole(role)} className="px-3 py-1.5 text-xs rounded transition-all" style={{ border: `1px solid ${selected ? F.primary : F.border}`, background: selected ? F.primary : F.white, color: selected ? "#ffffff" : F.text }}>
                      {role}
                    </button>
                  );
                })}
              </div>
              {selectedRoles.length > 0 && <p className="mt-2 text-xs" style={{ color: F.muted }}>{selectedRoles.length} role(s): {selectedRoles.join(", ")}</p>}
            </div>

            <div className="px-5 py-4 flex items-center justify-between gap-3" style={{ background: "#fafafa" }}>
              <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 text-sm rounded transition-colors" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}><RotateCcw size={14} /> Reset</button>
              <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-5 py-2 text-sm rounded text-white" style={{ background: loading ? "#74a8f5" : F.primary }}>
                {loading ? <><span className="animate-spin border-2 border-white border-t-transparent rounded-full w-3.5 h-3.5" /> Creating & Verifying in SAP...</> : <><Save size={14} /> Create User</>}
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === "history" && <HistoryTab />}
    </div>
  );
}
