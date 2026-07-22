import { useState, useMemo, useId } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Filter, ChevronDown, X, TrendingUp, BarChart3, PieChart as PieIcon,
  Activity, Server, Users, ArrowUpRight, Calendar,
} from "lucide-react";
import { useAppContext, AuditModule, AuditStatus } from "../contexts/AppContext";
import { DashNav } from "./Dashboard";
import { SearchableFilterDropdown } from "./SearchableFilterDropdown";

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

const STATUS_META: Record<AuditStatus, { color: string }> = {
  Success: { color: "#107e3e" },
  Failed:  { color: "#bb0000" },
  Warning: { color: "#e9730c" },
};

const TIME_RANGES = [
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "14d", label: "Last 14 days", days: 14 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "all", label: "All time", days: Infinity },
];

interface Props {
  onNavigate: (view: DashNav) => void;
}

function Panel({ title, icon, subtitle, action, children }: { title: string; icon: React.ReactNode; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}` }}>
      <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
        <span style={{ color: F.muted }}>{icon}</span>
        <div>
          <h3 className="text-sm" style={{ color: F.text }}>{title}</h3>
          {subtitle && <p className="text-xs" style={{ color: F.muted }}>{subtitle}</p>}
        </div>
        <div className="flex-1" />
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded shadow-lg px-3 py-2" style={{ background: F.white, border: `1px solid ${F.border}` }}>
      {label !== undefined && <p className="text-xs mb-1" style={{ color: F.muted }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm" style={{ color: p.color || p.fill || F.text }}>
          {p.name}: <span style={{ color: F.text }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function Analytics({ onNavigate }: Props) {
  const { auditLogs, systems } = useAppContext();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [showFilters, setShowFilters] = useState(true);
  const [range, setRange] = useState("30d");
  const [systemFilter, setSystemFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const uniqueSystems = useMemo(
    () => ["All", ...Array.from(new Set(auditLogs.map((l) => l.system).filter((s) => s !== "—")))],
    [auditLogs]
  );

  const rangeDays = TIME_RANGES.find((r) => r.id === range)!.days;
  const now = Date.now();

  const logs = useMemo(() => auditLogs.filter((l) => {
    const ageD = (now - new Date(l.timestamp).getTime()) / 86_400_000;
    const inRange = rangeDays === Infinity || ageD <= rangeDays;
    const inSys = systemFilter === "All" || l.system === systemFilter;
    const inStatus = statusFilter === "All" || l.status === statusFilter;
    return inRange && inSys && inStatus;
  }), [auditLogs, rangeDays, systemFilter, statusFilter, now]);

  const filtersActive = range !== "30d" || systemFilter !== "All" || statusFilter !== "All";

  /* Trend over time (by day) */
  const trendData = useMemo(() => {
    const days = rangeDays === Infinity ? 14 : Math.min(rangeDays, 14);
    const buckets: { date: string; label: string; Success: number; Failed: number; Warning: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 86_400_000);
      const key = d.toISOString().slice(0, 10);
      buckets.push({ date: key, label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), Success: 0, Failed: 0, Warning: 0 });
    }
    logs.forEach((l) => {
      const key = new Date(l.timestamp).toISOString().slice(0, 10);
      const b = buckets.find((x) => x.date === key);
      if (b) b[l.status] += 1;
    });
    return buckets;
  }, [logs, rangeDays, now]);

  /* By module */
  const moduleData = useMemo(() => {
    const m: Record<string, number> = {};
    logs.forEach((l) => { m[l.module] = (m[l.module] ?? 0) + 1; });
    return (Object.keys(MODULE_META) as AuditModule[])
      .map((mod) => ({ name: mod, value: m[mod] ?? 0, color: MODULE_META[mod].color }))
      .filter((x) => x.value > 0);
  }, [logs]);

  /* Status distribution */
  const statusData = useMemo(() => {
    const s: Record<string, number> = {};
    logs.forEach((l) => { s[l.status] = (s[l.status] ?? 0) + 1; });
    return (Object.keys(STATUS_META) as AuditStatus[])
      .map((st) => ({ name: st, value: s[st] ?? 0, color: STATUS_META[st].color }))
      .filter((x) => x.value > 0);
  }, [logs]);

  /* By performer */
  const performerData = useMemo(() => {
    const p: Record<string, number> = {};
    logs.forEach((l) => { p[l.performedBy] = (p[l.performedBy] ?? 0) + 1; });
    return Object.entries(p).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [logs]);

  /* By system */
  const systemData = useMemo(() => {
    const s: Record<string, number> = {};
    logs.forEach((l) => { if (l.system !== "—") s[l.system] = (s[l.system] ?? 0) + 1; });
    return Object.entries(s).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [logs]);

  const total = logs.length;
  const success = logs.filter((l) => l.status === "Success").length;
  const successRate = total ? Math.round((success / total) * 100) : 0;
  const avgDuration = total ? Math.round(logs.reduce((s, l) => s + l.durationMs, 0) / total) : 0;
  const activeSystems = systems.filter((s) => s.status === "Active").length;

  const summary = [
    { label: "Total Operations", value: total, icon: Activity, color: F.primary, bg: "#e8f2ff", nav: "audit-logs" as DashNav },
    { label: "Success Rate", value: `${successRate}%`, icon: TrendingUp, color: F.success, bg: "#f1fdf6", nav: "audit-logs" as DashNav },
    { label: "Avg Duration", value: `${avgDuration}ms`, icon: Calendar, color: F.purple, bg: "#f3e5f5", nav: "audit-logs" as DashNav },
    { label: "Active Systems", value: activeSystems, icon: Server, color: F.warning, bg: "#fff8f0", nav: "data-management" as DashNav },
  ];

  const maxPerformer = Math.max(1, ...performerData.map((p) => p.value));

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 style={{ color: F.text, fontWeight: 300 }}>Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: F.muted }}>Provisioning activity insights · {TIME_RANGES.find((r) => r.id === range)!.label}</p>
        </div>
        <button
          onClick={() => onNavigate("audit-logs")}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors"
          style={{ background: F.primary, color: "#fff" }}
        >
          Open Audit Logs <ArrowUpRight size={14} />
        </button>
      </div>

      {/* Collapsible filters */}
      <div className="rounded-lg overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}` }}>
        <button onClick={() => setShowFilters((s) => !s)} className="w-full flex items-center gap-2 px-5 py-3 text-left" style={{ background: "#fafafa" }}>
          <Filter size={14} style={{ color: F.primary }} />
          <span className="text-sm" style={{ color: F.text }}>Filters</span>
          {filtersActive && <span className="px-2 py-0.5 rounded-full text-xs text-white" style={{ background: F.primary }}>Active</span>}
          <div className="flex-1" />
          <ChevronDown size={16} style={{ color: F.muted, transform: showFilters ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>
        {showFilters && (
          <div className="px-5 py-4 flex flex-wrap items-end gap-5" style={{ borderTop: `1px solid ${F.border}` }}>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs" style={{ color: F.muted }}>Time Range</label>
              <div className="flex gap-1">
                {TIME_RANGES.map((r) => (
                  <button key={r.id} onClick={() => setRange(r.id)} className="px-3 py-1.5 rounded text-xs transition-colors"
                    style={{ background: range === r.id ? F.primary : F.bg, color: range === r.id ? "#fff" : F.text, border: `1px solid ${range === r.id ? F.primary : F.border}` }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[150px]">
              <SearchableFilterDropdown
                label="System"
                value={systemFilter === "All" ? "" : systemFilter}
                onChange={(v) => setSystemFilter(v || "All")}
                options={uniqueSystems.map((s) => s === "All" ? "" : s)}
                allLabel="All Systems"
                placeholder="Search system…"
              />
            </div>
            <div className="flex flex-col gap-1.5 min-w-[150px]">
              <SearchableFilterDropdown
                label="Status"
                value={statusFilter === "All" ? "" : statusFilter}
                onChange={(v) => setStatusFilter(v || "All")}
                options={["", "Success", "Warning", "Failed"]}
                allLabel="All Statuses"
                placeholder="Search status…"
              />
            </div>
            {filtersActive && (
              <button onClick={() => { setRange("30d"); setSystemFilter("All"); setStatusFilter("All"); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors"
                style={{ border: `1px solid ${F.border}`, background: F.white, color: F.muted }}>
                <X size={12} /> Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((s) => (
          <button key={s.label} onClick={() => onNavigate(s.nav)}
            className="rounded-lg p-4 text-left transition-all flex items-center gap-3"
            style={{ background: F.white, border: `1px solid ${F.border}` }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = F.border; e.currentTarget.style.boxShadow = "none"; }}>
            <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <div>
              <p style={{ fontSize: "24px", fontWeight: 300, color: F.text }}>{s.value}</p>
              <p className="text-xs" style={{ color: F.muted }}>{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Trend chart */}
      <Panel title="Operations Over Time" subtitle="Stacked by status · click legend to focus" icon={<TrendingUp size={14} />}>
        {total === 0 ? (
          <p className="text-sm text-center py-16" style={{ color: F.muted }}>No data for the selected filters.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} onClick={() => onNavigate("audit-logs")} style={{ cursor: "pointer" }}>
              <defs>
                <linearGradient id={`${uid}gSuccess`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={F.success} stopOpacity={0.35} /><stop offset="100%" stopColor={F.success} stopOpacity={0.02} /></linearGradient>
                <linearGradient id={`${uid}gWarning`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={F.warning} stopOpacity={0.35} /><stop offset="100%" stopColor={F.warning} stopOpacity={0.02} /></linearGradient>
                <linearGradient id={`${uid}gFailed`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={F.error} stopOpacity={0.35} /><stop offset="100%" stopColor={F.error} stopOpacity={0.02} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: F.muted }} axisLine={{ stroke: F.border }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: F.muted }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Area type="monotone" dataKey="Success" stackId="1" stroke={F.success} fill={`url(#${uid}gSuccess)`} strokeWidth={2} />
              <Area type="monotone" dataKey="Warning" stackId="1" stroke={F.warning} fill={`url(#${uid}gWarning)`} strokeWidth={2} />
              <Area type="monotone" dataKey="Failed" stackId="1" stroke={F.error} fill={`url(#${uid}gFailed)`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Panel>

      {/* Module bar + status donut */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <Panel title="Activity by Module" subtitle="Click a bar to open Audit Logs" icon={<BarChart3 size={14} />}>
            {moduleData.length === 0 ? (
              <p className="text-sm text-center py-16" style={{ color: F.muted }}>No data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={moduleData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: F.muted }} axisLine={{ stroke: F.border }} tickLine={false} interval={0} angle={-12} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11, fill: F.muted }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,112,242,0.06)" }} />
                  <Bar dataKey="value" name="Operations" radius={[4, 4, 0, 0]} cursor="pointer" onClick={() => onNavigate("audit-logs")}>
                    {moduleData.map((d) => <Cell key={`${uid}-mod-${d.name}`} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>
        <div className="lg:col-span-2">
          <Panel title="Status Distribution" subtitle="Outcome breakdown" icon={<PieIcon size={14} />}>
            {statusData.length === 0 ? (
              <p className="text-sm text-center py-16" style={{ color: F.muted }}>No data.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} cursor="pointer" onClick={() => onNavigate("audit-logs")}>
                      {statusData.map((d) => <Cell key={`${uid}-st-${d.name}`} fill={d.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 mt-3">
                  {statusData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                        <span className="text-xs" style={{ color: F.text }}>{d.name}</span>
                      </div>
                      <span className="text-xs" style={{ color: F.muted }}>{d.value} · {Math.round((d.value / total) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Panel>
        </div>
      </div>

      {/* Performer + system */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Operations by Operator" subtitle="Who performed the actions" icon={<Users size={14} />}>
          {performerData.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: F.muted }}>No data.</p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {performerData.map((p) => (
                <div key={p.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0" style={{ background: F.primary }}>{p.name.slice(0, 2)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: F.text }}>{p.name}</span>
                      <span className="text-xs" style={{ color: F.muted }}>{p.value}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: F.bg }}>
                      <div className="h-full rounded-full" style={{ width: `${(p.value / maxPerformer) * 100}%`, background: F.primary }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Operations by System" subtitle="Target environment volume" icon={<Server size={14} />}>
          {systemData.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: F.muted }}>No system-scoped data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, systemData.length * 46)}>
              <BarChart data={systemData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: F.muted }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: F.text }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,112,242,0.06)" }} />
                <Bar dataKey="value" name="Operations" fill={F.purple} radius={[0, 4, 4, 0]} cursor="pointer" onClick={() => onNavigate("data-management")} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>
    </div>
  );
}
