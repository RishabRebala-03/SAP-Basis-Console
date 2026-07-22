import { useState, useMemo } from "react";
import { ClipboardList, Download, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Filter, X, Eye } from "lucide-react";
import { useAppContext, AuditLog, AuditModule, AuditStatus } from "../contexts/AppContext";
import { ValueHelpInput } from "./ValueHelpInput";

const F = {
  primary: "#0070f2", success: "#107e3e", error: "#bb0000",
  warning: "#e9730c", text: "#32363a", muted: "#74777a",
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

const STATUS_META: Record<AuditStatus, { color: string; bg: string; dot: string }> = {
  Success: { color: "#107e3e", bg: "#f1fdf6", dot: "#107e3e" },
  Failed:  { color: "#bb0000", bg: "#fff2f2", dot: "#bb0000" },
  Warning: { color: "#e9730c", bg: "#fff8f0", dot: "#e9730c" },
};

type SortField = "timestamp" | "module" | "action" | "targetObject" | "system" | "performedBy" | "status" | "durationMs";

const PAGE_SIZES = [10, 25, 50];


export function AuditLogs({ onViewDetail }: { onViewDetail: (log: AuditLog) => void }) {
  const { auditLogs } = useAppContext();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [performerFilter, setPerformerFilter] = useState("All");
  const [systemFilter, setSystemFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  const uniquePerformers = useMemo(() => ["All", ...Array.from(new Set(auditLogs.map((l) => l.performedBy)))], [auditLogs]);
  const uniqueSystems = useMemo(() => ["All", ...Array.from(new Set(auditLogs.map((l) => l.system).filter((s) => s !== "—")))], [auditLogs]);

  const searchOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { value: string; label: string; secondary?: string; badge?: string; badgeColor?: string; badgeBg?: string }[] = [];
    auditLogs.forEach((l) => {
      if (!seen.has(l.action)) {
        seen.add(l.action);
        opts.push({ value: l.action, label: l.action, secondary: `Module: ${l.module}`, badge: l.module, badgeColor: "#6a1b9a", badgeBg: "#f3e5f5" });
      }
      if (!seen.has(l.targetObject)) {
        seen.add(l.targetObject);
        opts.push({ value: l.targetObject, label: l.targetObject, secondary: `${l.action} · ${l.system}`, badge: l.status, badgeColor: l.status === "Success" ? "#107e3e" : l.status === "Failed" ? "#bb0000" : "#e9730c", badgeBg: l.status === "Success" ? "#f1fdf6" : l.status === "Failed" ? "#fff2f2" : "#fff8f0" });
      }
      if (!seen.has(l.performedBy)) {
        seen.add(l.performedBy);
        opts.push({ value: l.performedBy, label: l.performedBy, secondary: "Performed By", badge: "User", badgeColor: "#74777a", badgeBg: "#f5f6f7" });
      }
    });
    return opts;
  }, [auditLogs]);

  const filtered = useMemo(() => {
    return auditLogs
      .filter((l) => {
        const q = search.toLowerCase();
        const matchSearch = !q || l.action.toLowerCase().includes(q) || l.targetObject.toLowerCase().includes(q) || l.performedBy.toLowerCase().includes(q) || l.details.toLowerCase().includes(q) || l.id.toLowerCase().includes(q);
        const matchModule = moduleFilter === "All" || l.module === moduleFilter;
        const matchStatus = statusFilter === "All" || l.status === statusFilter;
        const matchPerformer = performerFilter === "All" || l.performedBy === performerFilter;
        const matchSystem = systemFilter === "All" || l.system === systemFilter;
        const ts = new Date(l.timestamp);
        const matchFrom = !dateFrom || ts >= new Date(dateFrom);
        const matchTo = !dateTo || ts <= new Date(dateTo + "T23:59:59Z");
        return matchSearch && matchModule && matchStatus && matchPerformer && matchSystem && matchFrom && matchTo;
      })
      .sort((a, b) => {
        const va = a[sortField] ?? "";
        const vb = b[sortField] ?? "";
        return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
      });
  }, [auditLogs, search, moduleFilter, statusFilter, performerFilter, systemFilter, dateFrom, dateTo, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
    setPage(1);
  };

  const clearFilters = () => {
    setSearch(""); setModuleFilter("All"); setStatusFilter("All");
    setPerformerFilter("All"); setSystemFilter("All"); setDateFrom(""); setDateTo("");
    setPage(1);
  };

  const activeFilterCount = [moduleFilter !== "All", statusFilter !== "All", performerFilter !== "All", systemFilter !== "All", dateFrom, dateTo].filter(Boolean).length;

  const exportCsv = () => {
    const header = "Log ID,Timestamp,Module,Action,Target Object,System,Client,Performed By,Status,IP Address,Session ID,Duration (ms),Details,Error Code";
    const rows = filtered.map((l) =>
      [l.id, l.timestamp, l.module, l.action, l.targetObject, l.system, l.client, l.performedBy, l.status, l.ipAddress, l.sessionId, l.durationMs, `"${l.details.replace(/"/g, "'")}"`, l.errorCode ?? ""].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field
      ? sortDir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />
      : <span className="w-3 inline-block" />;

  // Summary counts
  const summary = { success: auditLogs.filter((l) => l.status === "Success").length, failed: auditLogs.filter((l) => l.status === "Failed").length, warning: auditLogs.filter((l) => l.status === "Warning").length };

  return (
    <div>

      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList size={20} style={{ color: F.primary }} />
            <h1 className="text-xl" style={{ color: F.text }}>Audit Logs</h1>
          </div>
          <p className="text-sm" style={{ color: F.muted }}>
            Full activity trail — every action, who did it, when, and what changed.
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded flex-shrink-0"
          style={{ border: `1px solid ${F.primary}`, color: F.primary, background: F.white }}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Events", value: auditLogs.length, color: F.primary, bg: "#e8f2ff" },
          { label: "Successful", value: summary.success, color: F.success, bg: "#f1fdf6" },
          { label: "Failed", value: summary.failed, color: F.error, bg: "#fff2f2" },
          { label: "Warnings", value: summary.warning, color: F.warning, bg: "#fff8f0" },
        ].map((c) => (
          <div key={c.label} className="rounded px-4 py-3" style={{ background: c.bg, border: `1px solid ${c.color}25` }}>
            <p className="text-xs mb-1" style={{ color: F.muted }}>{c.label}</p>
            <p className="text-3xl" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="rounded mb-1" style={{ background: F.white, border: `1px solid ${F.border}` }}>
        <div className="flex flex-wrap items-center gap-3 p-3">
          <div className="flex-1 min-w-52">
            <ValueHelpInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              options={searchOptions}
              placeholder="Search actions, users, targets… (F4 for value help)"
              emptyMessage="No matching log entries found."
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded"
            style={{
              border: `1px solid ${activeFilterCount > 0 ? F.primary : F.border}`,
              background: activeFilterCount > 0 ? "#e8f2ff" : F.white,
              color: activeFilterCount > 0 ? F.primary : F.text,
            }}
          >
            <Filter size={13} />
            Filters {activeFilterCount > 0 && <span className="px-1.5 py-0.5 rounded-full text-xs text-white" style={{ background: F.primary }}>{activeFilterCount}</span>}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs" style={{ color: F.error }}>
              <X size={12} /> Clear all
            </button>
          )}
          <span className="text-xs ml-auto" style={{ color: F.muted }}>{filtered.length} records</span>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="px-3 pb-3 pt-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" style={{ borderTop: `1px solid ${F.border}` }}>
            <div className="pt-3">
              <label className="block text-xs mb-1" style={{ color: F.muted }}>Module</label>
              <select value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }} className="w-full text-xs px-2 py-1.5 rounded outline-none" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>
                {["All", "Single User", "Bulk User", "Password Reset", "Lock/Unlock", "Data Management"].map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="pt-3">
              <label className="block text-xs mb-1" style={{ color: F.muted }}>Status</label>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-full text-xs px-2 py-1.5 rounded outline-none" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>
                {["All", "Success", "Failed", "Warning"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="pt-3">
              <label className="block text-xs mb-1" style={{ color: F.muted }}>Performed By</label>
              <select value={performerFilter} onChange={(e) => { setPerformerFilter(e.target.value); setPage(1); }} className="w-full text-xs px-2 py-1.5 rounded outline-none" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>
                {uniquePerformers.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="pt-3">
              <label className="block text-xs mb-1" style={{ color: F.muted }}>System</label>
              <select value={systemFilter} onChange={(e) => { setSystemFilter(e.target.value); setPage(1); }} className="w-full text-xs px-2 py-1.5 rounded outline-none" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>
                {uniqueSystems.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="pt-3">
              <label className="block text-xs mb-1" style={{ color: F.muted }}>Date From</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="w-full text-xs px-2 py-1.5 rounded outline-none" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }} />
            </div>
            <div className="pt-3">
              <label className="block text-xs mb-1" style={{ color: F.muted }}>Date To</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="w-full text-xs px-2 py-1.5 rounded outline-none" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }} />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded overflow-hidden mt-4" style={{ background: F.white, border: `1px solid ${F.border}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#f5f6f7", borderBottom: `1px solid ${F.border}` }}>
                {([
                  ["timestamp", "Timestamp"],
                  ["module", "Module"],
                  ["action", "Action"],
                  ["targetObject", "Target"],
                  ["system", "System"],
                  ["performedBy", "Performed By"],
                  ["status", "Status"],
                  ["durationMs", "Duration"],
                ] as [SortField, string][]).map(([field, label]) => (
                  <th
                    key={field}
                    onClick={() => handleSort(field)}
                    className="px-4 py-3 text-left text-xs cursor-pointer select-none whitespace-nowrap"
                    style={{ color: sortField === field ? F.primary : F.muted, fontWeight: 600 }}
                  >
                    <span className="flex items-center gap-1">{label}<SortIcon field={field} /></span>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs" style={{ color: F.muted, fontWeight: 600 }}>IP Address</th>
                <th className="px-4 py-3 text-left text-xs" style={{ color: F.muted, fontWeight: 600 }}>Details</th>
                <th className="px-4 py-3 text-right text-xs" style={{ color: F.muted, fontWeight: 600 }}>View</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-14 text-center text-sm" style={{ color: F.muted }}>
                    No audit log entries match your current filters.
                  </td>
                </tr>
              )}
              {paginated.map((log, i) => {
                const mod = MODULE_META[log.module];
                const sta = STATUS_META[log.status];
                const ts = new Date(log.timestamp);
                return (
                  <tr
                    key={log.id}
                    onClick={() => onViewDetail(log)}
                    style={{ borderBottom: `1px solid ${F.border}`, background: i % 2 === 0 ? F.white : "#fafafa", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f6ff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? F.white : "#fafafa")}
                  >
                    {/* Timestamp */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs" style={{ color: F.text }}>{ts.toLocaleDateString()}</p>
                      <p className="text-xs" style={{ color: F.muted }}>{ts.toLocaleTimeString()}</p>
                    </td>
                    {/* Module */}
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs whitespace-nowrap" style={{ background: mod.bg, color: mod.color }}>
                        {log.module}
                      </span>
                    </td>
                    {/* Action */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: F.text }}>{log.action}</td>
                    {/* Target */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: "#f5f6f7", color: F.text }}>{log.targetObject}</span>
                    </td>
                    {/* System */}
                    <td className="px-4 py-3">
                      {log.system !== "—" ? (
                        <div>
                          <p className="text-xs" style={{ color: F.text }}>{log.system}</p>
                          <p className="text-xs" style={{ color: F.muted }}>/{log.client}</p>
                        </div>
                      ) : <span className="text-xs" style={{ color: F.muted }}>—</span>}
                    </td>
                    {/* Performed By */}
                    <td className="px-4 py-3">
                      <span className="text-xs flex items-center gap-1">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: F.primary, fontSize: "9px" }}>
                          {log.performedBy.slice(0, 2)}
                        </span>
                        <span style={{ color: F.text }}>{log.performedBy}</span>
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sta.dot }} />
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: sta.bg, color: sta.color }}>{log.status}</span>
                      </span>
                    </td>
                    {/* Duration */}
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: log.durationMs > 3000 ? F.warning : F.muted }}>
                      {log.durationMs} ms
                    </td>
                    {/* IP */}
                    <td className="px-4 py-3 text-xs font-mono whitespace-nowrap" style={{ color: F.muted }}>{log.ipAddress}</td>
                    {/* Details */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-xs truncate" style={{ color: F.muted, maxWidth: "180px" }} title={log.details}>{log.details}</p>
                      {log.errorCode && <p className="text-xs mt-0.5 font-mono" style={{ color: F.error }}>{log.errorCode}</p>}
                    </td>
                    {/* View */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); onViewDetail(log); }}
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        title="View full details"
                        style={{ color: F.primary }}
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3" style={{ borderTop: `1px solid ${F.border}`, background: "#fafafa" }}>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: F.muted }}>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="text-xs px-2 py-1 rounded outline-none"
              style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}
            >
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <p className="text-xs" style={{ color: F.muted }}>
            {filtered.length === 0 ? "No results" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} of ${filtered.length}`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-2 py-1 text-xs rounded disabled:opacity-40"
              style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}
            >«</button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded disabled:opacity-40"
              style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}
            ><ChevronLeft size={13} /></button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              return p <= totalPages ? (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-7 h-7 text-xs rounded"
                  style={{ background: p === page ? F.primary : F.white, color: p === page ? "#fff" : F.text, border: `1px solid ${p === page ? F.primary : F.border}` }}
                >{p}</button>
              ) : null;
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded disabled:opacity-40"
              style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}
            ><ChevronRight size={13} /></button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-2 py-1 text-xs rounded disabled:opacity-40"
              style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}
            >»</button>
          </div>
        </div>
      </div>
    </div>
  );
}
