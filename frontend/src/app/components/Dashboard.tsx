import { useState, useMemo } from "react";
import {
  UserPlus, Upload, KeyRound, Lock, Database, ClipboardList,
  Users, TrendingUp, TrendingDown, CheckCircle2, AlertCircle, AlertTriangle,
  ChevronRight, ChevronDown, Filter, X, Server, Activity, ArrowUpRight, Clock,
} from "lucide-react";
import { useAppContext, AuditLog, AuditModule, AuditStatus } from "../contexts/AppContext";
import logoImage from "../../imports/image.png";

const F = {
  primary: "#0070f2", success: "#107e3e", error: "#bb0000",
  warning: "#e9730c", purple: "#6a1b9a", text: "#32363a", muted: "#74777a",
  border: "#d9d9d9", bg: "#f5f6f7", white: "#ffffff",
};

const MODULE_META: Record<AuditModule, { color: string; bg: string }> = {
  "Single User":    { color: "#0070f2", bg: "#e8f2ff" },
  "Bulk User":      { color: "#6a1b9a", bg: "#f3e5f5" },
  "Password Reset": { color: "#e9730c", bg: "#fff8f0" },
  "Lock/Unlock":    { color: "#bb0000", bg: "#fff2f2" },
  "Data Management":{ color: "#107e3e", bg: "#f1fdf6" },
  "System":         { color: "#74777a", bg: "#f5f6f7" },
};

const STATUS_META: Record<AuditStatus, { color: string; bg: string; icon: React.ReactNode }> = {
  Success: { color: "#107e3e", bg: "#f1fdf6", icon: <CheckCircle2 size={13} style={{ color: "#107e3e" }} /> },
  Failed:  { color: "#bb0000", bg: "#fff2f2", icon: <AlertCircle size={13} style={{ color: "#bb0000" }} /> },
  Warning: { color: "#e9730c", bg: "#fff8f0", icon: <AlertTriangle size={13} style={{ color: "#e9730c" }} /> },
};

export type DashNav =
  | "single-user" | "bulk-user" | "password-reset"
  | "lock-unlock" | "data-management" | "audit-logs" | "analytics";

const TIME_RANGES = [
  { id: "24h", label: "Last 24 hours", hours: 24 },
  { id: "7d", label: "Last 7 days", hours: 24 * 7 },
  { id: "30d", label: "Last 30 days", hours: 24 * 30 },
  { id: "all", label: "All time", hours: Infinity },
];

interface Props {
  onNavigate: (view: DashNav) => void;
  onViewAudit: (log: AuditLog) => void;
}

/* ── Reusable primitives ── */
function Panel({ title, icon, action, children }: { title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}` }}>
      <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
        <span style={{ color: F.muted }}>{icon}</span>
        <h3 className="text-sm" style={{ color: F.text }}>{title}</h3>
        <div className="flex-1" />
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Dashboard({ onNavigate, onViewAudit }: Props) {
  const { auditLogs, systems } = useAppContext();
  const [showFilters, setShowFilters] = useState(false);
  const [range, setRange] = useState("7d");
  const [systemFilter, setSystemFilter] = useState("All");

  const uniqueSystems = useMemo(
    () => ["All", ...Array.from(new Set(auditLogs.map((l) => l.system).filter((s) => s !== "—")))],
    [auditLogs]
  );

  const rangeHours = TIME_RANGES.find((r) => r.id === range)!.hours;
  const now = Date.now();

  const logs = useMemo(() => {
    return auditLogs.filter((l) => {
      const ageH = (now - new Date(l.timestamp).getTime()) / 3_600_000;
      const inRange = rangeHours === Infinity || ageH <= rangeHours;
      const inSys = systemFilter === "All" || l.system === systemFilter;
      return inRange && inSys;
    });
  }, [auditLogs, rangeHours, systemFilter, now]);

  const total = logs.length;
  const success = logs.filter((l) => l.status === "Success").length;
  const failed = logs.filter((l) => l.status === "Failed").length;
  const warning = logs.filter((l) => l.status === "Warning").length;
  const successRate = total ? Math.round((success / total) * 100) : 0;
  const usersCreated = logs.filter((l) => l.action === "Create User").length;
  const activeSystems = systems.filter((s) => s.status === "Active").length;

  const filtersActive = range !== "7d" || systemFilter !== "All";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  /* KPI cards */
  const kpis = [
    { label: "Total Operations", value: total, sub: TIME_RANGES.find((r) => r.id === range)!.label, icon: Activity, color: F.primary, bg: "#e8f2ff", trend: total ? "activity recorded" : "no activity", up: true, nav: "audit-logs" as DashNav },
    { label: "Users Provisioned", value: usersCreated, sub: "Create User actions", icon: UserPlus, color: F.success, bg: "#f1fdf6", trend: usersCreated ? "users created" : "none created", up: true, nav: "single-user" as DashNav },
    { label: "Success Rate", value: `${successRate}%`, sub: `${success} of ${total} succeeded`, icon: CheckCircle2, color: F.purple, bg: "#f3e5f5", trend: failed ? `${failed} failed` : "no errors", up: !failed, nav: "audit-logs" as DashNav },
    { label: "Active Systems", value: activeSystems, sub: `${systems.length} registered`, icon: Server, color: F.warning, bg: "#fff8f0", trend: "stable", up: true, nav: "data-management" as DashNav },
  ];

  /* Quick actions */
  const actions = [
    { id: "single-user" as DashNav, label: "Single User Creation", desc: "Provision one user with roles & validity", icon: UserPlus, color: F.primary, bg: "#e8f2ff" },
    { id: "bulk-user" as DashNav, label: "Bulk User Creation", desc: "Import users from an Excel sheet", icon: Upload, color: F.purple, bg: "#f3e5f5" },
    { id: "password-reset" as DashNav, label: "Password Reset", desc: "Generate a temporary password", icon: KeyRound, color: F.warning, bg: "#fff8f0" },
    { id: "lock-unlock" as DashNav, label: "Lock / Unlock User", desc: "Lock users or unlock wrong-password lockouts", icon: Lock, color: F.error, bg: "#fff2f2" },
    { id: "data-management" as DashNav, label: "Data Management", desc: "Manage SAP system registry", icon: Database, color: F.success, bg: "#f1fdf6" },
    { id: "audit-logs" as DashNav, label: "Audit Logs", desc: "Search, filter & export activity", icon: ClipboardList, color: F.muted, bg: "#f5f6f7" },
  ];

  /* Module breakdown */
  const moduleCounts = useMemo(() => {
    const m: Record<string, number> = {};
    logs.forEach((l) => { m[l.module] = (m[l.module] ?? 0) + 1; });
    return (Object.keys(MODULE_META) as AuditModule[])
      .map((mod) => ({ mod, count: m[mod] ?? 0 }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [logs]);
  const maxModule = Math.max(1, ...moduleCounts.map((m) => m.count));

  const recent = logs.slice(0, 6);

  return (
    <div className="flex flex-col gap-5">
      {/* Hero welcome banner */}
      <div className="rounded-lg overflow-hidden relative" style={{ border: `1px solid ${F.border}` }}>
        <div className="px-6 py-6 relative" style={{ background: "linear-gradient(120deg, #1d2d3e 0%, #0d1e2e 60%, #10233a 100%)" }}>
          {/* ambient glows */}
          <div className="absolute pointer-events-none" style={{ top: "-60px", right: "10%", width: "260px", height: "260px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,112,242,0.25), transparent 70%)" }} />
          <div className="absolute pointer-events-none" style={{ bottom: "-80px", right: "26%", width: "220px", height: "220px", borderRadius: "50%", background: "radial-gradient(circle, rgba(106,27,154,0.22), transparent 70%)" }} />
          <div className="flex flex-wrap items-center justify-between gap-5 relative">
            <div className="flex items-center gap-4">
              <img src={logoImage} alt="Naxrita" style={{ width: "52px", height: "52px", objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(0,112,242,0.4))" }} />
              <div>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{greeting}, Admin</p>
                <h1 className="text-white" style={{ fontWeight: 300, letterSpacing: "0.01em" }}>Basis Provisioning Overview</h1>
                <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {total} operations · {successRate}% success · {activeSystems} active systems
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate("analytics")}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff" }}
            >
              <TrendingUp size={15} /> View Analytics <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible filters */}
      <div className="rounded-lg overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}` }}>
        <button
          onClick={() => setShowFilters((s) => !s)}
          className="w-full flex items-center gap-2 px-5 py-3 text-left"
          style={{ background: "#fafafa" }}
        >
          <Filter size={14} style={{ color: F.primary }} />
          <span className="text-sm" style={{ color: F.text }}>Filters</span>
          {filtersActive && (
            <span className="px-2 py-0.5 rounded-full text-xs text-white" style={{ background: F.primary }}>Active</span>
          )}
          <div className="flex-1" />
          <span className="text-xs" style={{ color: F.muted }}>{TIME_RANGES.find((r) => r.id === range)!.label}{systemFilter !== "All" ? ` · ${systemFilter}` : ""}</span>
          <ChevronDown size={16} style={{ color: F.muted, transform: showFilters ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>
        {showFilters && (
          <div className="px-5 py-4 flex flex-wrap items-end gap-5" style={{ borderTop: `1px solid ${F.border}` }}>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs" style={{ color: F.muted }}>Time Range</label>
              <div className="flex gap-1">
                {TIME_RANGES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRange(r.id)}
                    className="px-3 py-1.5 rounded text-xs transition-colors"
                    style={{
                      background: range === r.id ? F.primary : F.bg,
                      color: range === r.id ? "#fff" : F.text,
                      border: `1px solid ${range === r.id ? F.primary : F.border}`,
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs" style={{ color: F.muted }}>System</label>
              <select
                value={systemFilter}
                onChange={(e) => setSystemFilter(e.target.value)}
                className="px-3 py-1.5 rounded text-sm outline-none"
                style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text, minWidth: "140px" }}
              >
                {uniqueSystems.map((s) => <option key={s} value={s}>{s === "All" ? "All Systems" : s}</option>)}
              </select>
            </div>
            {filtersActive && (
              <button
                onClick={() => { setRange("7d"); setSystemFilter("All"); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors"
                style={{ border: `1px solid ${F.border}`, background: F.white, color: F.muted }}
              >
                <X size={12} /> Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <button
            key={k.label}
            onClick={() => onNavigate(k.nav)}
            className="group rounded-lg p-5 text-left transition-all"
            style={{ background: F.white, border: `1px solid ${F.border}` }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)"; e.currentTarget.style.borderColor = k.color; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = F.border; }}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: k.bg }}>
                <k.icon size={18} style={{ color: k.color }} />
              </div>
              <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: k.color }} />
            </div>
            <p className="mt-4" style={{ fontSize: "28px", fontWeight: 300, color: F.text, letterSpacing: "-0.01em" }}>{k.value}</p>
            <p className="text-sm mt-0.5" style={{ color: F.text }}>{k.label}</p>
            <div className="flex items-center gap-1.5 mt-2">
              {k.up ? <TrendingUp size={12} style={{ color: F.success }} /> : <TrendingDown size={12} style={{ color: F.error }} />}
              <span className="text-xs" style={{ color: k.up ? F.success : F.error }}>{k.trend}</span>
              <span className="text-xs" style={{ color: F.muted }}>· {k.sub}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <Panel title="Quick Actions" icon={<Activity size={14} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((a) => (
            <button
              key={a.id}
              onClick={() => onNavigate(a.id)}
              className="group flex items-center gap-3 p-4 rounded-lg text-left transition-all"
              style={{ background: F.bg, border: `1px solid ${F.border}` }}
              onMouseEnter={(e) => { e.currentTarget.style.background = F.white; e.currentTarget.style.borderColor = a.color; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = F.bg; e.currentTarget.style.borderColor = F.border; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: a.bg }}>
                <a.icon size={18} style={{ color: a.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: F.text }}>{a.label}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: F.muted }}>{a.desc}</p>
              </div>
              <ChevronRight size={16} className="flex-shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: a.color }} />
            </button>
          ))}
        </div>
      </Panel>

      {/* Two-column: recent activity + module breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Panel
            title="Recent Activity"
            icon={<Clock size={14} />}
            action={
              <button onClick={() => onNavigate("audit-logs")} className="flex items-center gap-1 text-xs" style={{ color: F.primary }}>
                View all <ChevronRight size={12} />
              </button>
            }
          >
            {recent.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: F.muted }}>No activity in the selected range.</p>
            ) : (
              <div className="flex flex-col">
                {recent.map((l, i) => {
                  const mod = MODULE_META[l.module];
                  const sta = STATUS_META[l.status];
                  const ts = new Date(l.timestamp);
                  return (
                    <button
                      key={l.id}
                      onClick={() => onViewAudit(l)}
                      className="flex items-center gap-3 py-3 text-left transition-colors hover:bg-gray-50 rounded px-2 -mx-2"
                      style={{ borderBottom: i < recent.length - 1 ? `1px solid ${F.border}` : "none" }}
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: mod.bg }}>
                        {sta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm truncate" style={{ color: F.text }}>{l.action}</p>
                          <span className="px-1.5 py-0.5 rounded text-xs flex-shrink-0" style={{ background: mod.bg, color: mod.color }}>{l.module}</span>
                        </div>
                        <p className="text-xs mt-0.5 truncate" style={{ color: F.muted }}>
                          <span className="font-mono">{l.targetObject}</span> · {l.system !== "—" ? `${l.system}/${l.client}` : "—"} · {l.performedBy}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs justify-center" style={{ background: sta.bg, color: sta.color }}>{l.status}</span>
                        <p className="text-xs mt-1" style={{ color: F.muted }}>{ts.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} {ts.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        {/* Module breakdown */}
        <Panel
          title="Activity by Module"
          icon={<ClipboardList size={14} />}
          action={
            <button onClick={() => onNavigate("analytics")} className="flex items-center gap-1 text-xs" style={{ color: F.primary }}>
              Details <ChevronRight size={12} />
            </button>
          }
        >
          {moduleCounts.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: F.muted }}>No data.</p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {moduleCounts.map(({ mod, count }) => {
                const meta = MODULE_META[mod];
                return (
                  <button key={mod} onClick={() => onNavigate("audit-logs")} className="text-left group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs" style={{ color: F.text }}>{mod}</span>
                      <span className="text-xs" style={{ color: F.muted }}>{count}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: F.bg }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${(count / maxModule) * 100}%`, background: meta.color }} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-4" style={{ borderTop: `1px solid ${F.border}` }}>
            {[
              { label: "Success", value: success, color: F.success, bg: "#f1fdf6" },
              { label: "Warning", value: warning, color: F.warning, bg: "#fff8f0" },
              { label: "Failed", value: failed, color: F.error, bg: "#fff2f2" },
            ].map((s) => (
              <div key={s.label} className="p-2.5 rounded text-center" style={{ background: s.bg }}>
                <p style={{ fontSize: "20px", fontWeight: 300, color: s.color }}>{s.value}</p>
                <p className="text-xs" style={{ color: F.muted }}>{s.label}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
