import { useState, useMemo } from "react";
import { Database, Plus, Pencil, Trash2, X, CheckCircle2, AlertCircle, ChevronUp, ChevronDown, Save, ServerCrash, Server, Filter, Play, Search } from "lucide-react";
import { useAppContext, SapSystem } from "../contexts/AppContext";
import { ValueHelpInput } from "./ValueHelpInput";
import { SearchableFilterDropdown } from "./SearchableFilterDropdown";

const F = {
  primary: "#0070f2", success: "#107e3e", error: "#bb0000",
  warning: "#e9730c", text: "var(--app-text)", muted: "var(--app-muted)",
  border: "var(--app-border)", bg: "var(--app-bg)", white: "var(--app-surface)",
};

const ENV_META: Record<string, { color: string; bg: string }> = {
  Production: { color: "#bb0000", bg: "#fff2f2" },
  Quality:    { color: "#e9730c", bg: "#fff8f0" },
  Development:{ color: "#0070f2", bg: "#e8f2ff" },
  Sandbox:    { color: "#74777a", bg: "#f5f6f7" },
};

type SortField = "systemId" | "systemName" | "environment" | "client" | "status" | "createdAt";
type SortDir = "asc" | "desc";

interface FormState {
  systemId: string; systemName: string; client: string;
  environment: SapSystem["environment"]; host: string; description: string; status: SapSystem["status"];
}

const EMPTY_FORM: FormState = {
  systemId: "", systemName: "", client: "100", environment: "Development", host: "", description: "", status: "Active",
};

const ALLOWED_SYSTEM_IDS = ["SHD", "EMP", "EMQ", "EMD"];

function normalizeSystemForm(form: FormState): FormState {
  const systemId = form.systemId.trim().toUpperCase();
  return {
    ...form,
    systemId,
    systemName: systemId,
    client: "100",
    environment: "Development",
    description: form.description.trim() || `${systemId} Development`,
  };
}

function FioriInput({ label, value, onChange, placeholder, error, required, maxLength }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string; required?: boolean; maxLength?: number;
}) {
  return (
    <div>
      <label className="block text-xs mb-1" style={{ color: F.muted }}>
        {label} {required && <span style={{ color: F.error }}>*</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-3 py-2 text-sm outline-none transition-all rounded"
        style={{ border: `1px solid ${error ? F.error : F.border}`, background: F.white, color: F.text }}
        onFocus={(e) => { e.target.style.borderColor = error ? F.error : F.primary; e.target.style.boxShadow = "0 0 0 2px #0070f218"; }}
        onBlur={(e) => { e.target.style.borderColor = error ? F.error : F.border; e.target.style.boxShadow = "none"; }}
      />
      {error && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: F.error }}><AlertCircle size={10} />{error}</p>}
    </div>
  );
}

function DeleteConfirmDialog({ system, onConfirm, onCancel }: { system: SapSystem; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="rounded shadow-2xl w-full max-w-md mx-4" style={{ background: F.white }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: `1px solid ${F.border}` }}>
          <ServerCrash size={18} style={{ color: F.error }} />
          <h3 className="text-base" style={{ color: F.text }}>Delete System Entry</h3>
          <button onClick={onCancel} className="ml-auto p-1 rounded hover:bg-gray-100" style={{ color: F.muted }}><X size={15} /></button>
        </div>
        <div className="px-5 py-5">
          <div className="p-3 rounded mb-3" style={{ background: "#fff2f2", border: `1px solid #bb000030` }}>
            <p className="text-sm" style={{ color: F.error }}>
              You are about to delete system <strong>{system.systemId}</strong> ({system.systemName}).
            </p>
          </div>
          <p className="text-sm" style={{ color: F.muted }}>
            This will remove it from all system selection dropdowns across the application. This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-3 px-5 py-4" style={{ borderTop: `1px solid ${F.border}`, background: "#fafafa" }}>
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded text-white" style={{ background: F.error }}>Delete System</button>
        </div>
      </div>
    </div>
  );
}

function SystemFormDrawer({
  mode, initial, onSave, onClose,
}: {
  mode: "add" | "edit"; initial: FormState; onSave: (f: FormState) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [saved, setSaved] = useState(false);

  const set = (k: keyof FormState) => (v: string) => {
    setForm((f) => {
      if (k === "systemId") {
        const systemId = v.toUpperCase();
        return { ...f, systemId, systemName: systemId, client: "100", environment: "Development" };
      }
      return { ...f, [k]: v };
    });
    setErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  };

  const validate = () => {
    const e: Partial<FormState> = {};
    const systemId = form.systemId.trim().toUpperCase();
    if (!systemId) e.systemId = "Required";
    else if (!ALLOWED_SYSTEM_IDS.includes(systemId)) e.systemId = "Use SHD, EMP, EMQ, or EMD";
    if (!form.host.trim()) e.host = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const normalized = normalizeSystemForm(form);
    setSaved(true);
    setTimeout(() => { onSave(normalized); onClose(); }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(0,0,0,0.35)" }}>
      <div className="ml-auto h-full w-full max-w-lg flex flex-col shadow-2xl" style={{ background: F.white }}>
        {/* Drawer Header */}
        <div className="flex items-center gap-2 px-5 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
          <Server size={18} style={{ color: F.primary }} />
          <h3 className="text-base" style={{ color: F.text }}>{mode === "add" ? "Add New SAP System" : `Edit System: ${initial.systemId}`}</h3>
          <button onClick={onClose} className="ml-auto p-1 rounded hover:bg-gray-100" style={{ color: F.muted }}><X size={15} /></button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {/* Identity */}
          <div className="rounded" style={{ border: `1px solid ${F.border}` }}>
            <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
              <p className="text-xs" style={{ color: F.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>System Identity</p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <FioriInput label="System ID" value={form.systemId} onChange={(v) => set("systemId")(v.toUpperCase())} placeholder="e.g. SHD" error={errors.systemId} required maxLength={3} />
              <FioriInput label="System Name" value={form.systemName} onChange={set("systemName")} placeholder="SHD, EMP, EMQ, or EMD" error={errors.systemName} required />
              <FioriInput label="Client Number" value="100" onChange={() => {}} placeholder="100" error={errors.client} required maxLength={3} />
              <div>
                <label className="block text-xs mb-1" style={{ color: F.muted }}>Environment <span style={{ color: F.error }}>*</span></label>
                <select
                  value="Development"
                  onChange={() => {}}
                  className="w-full px-3 py-2 text-sm outline-none rounded"
                  style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}
                >
                  <option>Development</option>
                </select>
              </div>
            </div>
          </div>

          {/* Connection */}
          <div className="rounded" style={{ border: `1px solid ${F.border}` }}>
            <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
              <p className="text-xs" style={{ color: F.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Connection Details</p>
            </div>
            <div className="p-4">
              <FioriInput label="Host / Application Server" value={form.host} onChange={set("host")} placeholder="e.g. sap-prd.corp.local" error={errors.host} required />
            </div>
          </div>

          {/* Metadata */}
          <div className="rounded" style={{ border: `1px solid ${F.border}` }}>
            <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
              <p className="text-xs" style={{ color: F.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Metadata</p>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: F.muted }}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description")(e.target.value)}
                  rows={3}
                  placeholder="Brief description of this system's purpose..."
                  className="w-full px-3 py-2 text-sm outline-none rounded resize-none"
                  style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}
                  onFocus={(e) => { e.target.style.borderColor = F.primary; e.target.style.boxShadow = "0 0 0 2px #0070f218"; }}
                  onBlur={(e) => { e.target.style.borderColor = F.border; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div>
                <label className="block text-xs mb-2" style={{ color: F.muted }}>Status</label>
                <div className="flex gap-3">
                  {["Active", "Inactive"].map((s) => (
                    <button
                      key={s}
                      onClick={() => set("status")(s)}
                      className="flex items-center gap-2 px-3 py-2 rounded text-sm transition-all"
                      style={{
                        border: `1px solid ${form.status === s ? (s === "Active" ? F.success : F.error) : F.border}`,
                        background: form.status === s ? (s === "Active" ? "#f1fdf6" : "#fff2f2") : F.white,
                        color: form.status === s ? (s === "Active" ? F.success : F.error) : F.text,
                      }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: s === "Active" ? F.success : F.error }} />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="flex justify-between gap-3 px-5 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${F.border}`, background: "#fafafa" }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>Cancel</button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 text-sm rounded text-white"
            style={{ background: saved ? F.success : F.primary }}
          >
            {saved ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> {mode === "add" ? "Add System" : "Save Changes"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DataManagement({ onViewDetail }: { onViewDetail?: (system: SapSystem) => void }) {
  const { systems, addSystem, updateSystem, deleteSystem, logAction } = useAppContext();
  const [search, setSearch] = useState("");
  const [envFilter, setEnvFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("All");
  const [creatorFilter, setCreatorFilter] = useState("All");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showFilters, setShowFilters] = useState(true);
  const [drawerMode, setDrawerMode] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<SapSystem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SapSystem | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Submitted filter state
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedEnv, setAppliedEnv] = useState("All");
  const [appliedStatus, setAppliedStatus] = useState("All");
  const [appliedClient, setAppliedClient] = useState("All");
  const [appliedCreator, setAppliedCreator] = useState("All");

  const handleSubmit = () => {
    setAppliedSearch(search);
    setAppliedEnv(envFilter);
    setAppliedStatus(statusFilter);
    setAppliedClient(clientFilter);
    setAppliedCreator(creatorFilter);
    setHasSubmitted(true);
  };
  const hasAnyFilter = search || envFilter !== "All" || statusFilter !== "All" || clientFilter !== "All" || creatorFilter !== "All" || hasSubmitted;
  const clearAllFilters = () => {
    setSearch("");
    setEnvFilter("All");
    setStatusFilter("All");
    setClientFilter("All");
    setCreatorFilter("All");
    setAppliedSearch("");
    setAppliedEnv("All");
    setAppliedStatus("All");
    setAppliedClient("All");
    setAppliedCreator("All");
    setHasSubmitted(false);
  };

  const uniqueClients = useMemo(() => ["All", ...Array.from(new Set(systems.map((s) => s.client).filter(Boolean)))], [systems]);
  const uniqueCreators = useMemo(() => ["All", ...Array.from(new Set(systems.map((s) => s.createdBy).filter(Boolean)))], [systems]);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    if (!hasSubmitted) return [];
    return systems
      .filter((s) => {
        const q = appliedSearch.toLowerCase();
        return (
          (s.systemId.toLowerCase().includes(q) || s.systemName.toLowerCase().includes(q) || s.host.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)) &&
          (appliedEnv === "All" || s.environment === appliedEnv) &&
          (appliedStatus === "All" || s.status === appliedStatus) &&
          (appliedClient === "All" || s.client === appliedClient) &&
          (appliedCreator === "All" || s.createdBy === appliedCreator)
        );
      })
      .sort((a, b) => {
        const va = a[sortField] ?? "";
        const vb = b[sortField] ?? "";
        return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
      });
  }, [systems, appliedSearch, appliedEnv, appliedStatus, appliedClient, appliedCreator, sortField, sortDir, hasSubmitted]);

  const handleAdd = (form: FormState) => {
    const normalized = normalizeSystemForm(form);
    addSystem(normalized as Omit<SapSystem, "id" | "createdAt" | "createdBy">);
    logAction({ module: "Data Management", action: "Add System", targetObject: normalized.systemId, system: "—", client: "—", status: "Success", durationMs: 210, details: `System ${normalized.systemId} registered. Host: ${normalized.host}`, changesAfter: `System ${normalized.systemId} added with status ${normalized.status}` });
    showToast(`System ${normalized.systemId} added successfully.`, "success");
  };

  const handleEdit = (form: FormState) => {
    if (!editTarget) return;
    const normalized = normalizeSystemForm(form);
    const before = `${editTarget.systemId} | ${editTarget.environment} | ${editTarget.status}`;
    const after = `${normalized.systemId} | ${normalized.environment} | ${normalized.status}`;
    updateSystem(editTarget.id, normalized);
    logAction({ module: "Data Management", action: "Edit System", targetObject: normalized.systemId, system: "—", client: "—", status: "Success", durationMs: 190, details: `System ${normalized.systemId} updated.`, changesBefore: before, changesAfter: after });
    showToast(`System ${normalized.systemId} updated.`, "success");
    setEditTarget(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteSystem(deleteTarget.id);
    logAction({ module: "Data Management", action: "Delete System", targetObject: deleteTarget.systemId, system: "—", client: "—", status: "Success", durationMs: 150, details: `System ${deleteTarget.systemId} removed from registry.`, changesBefore: `System ${deleteTarget.systemId} existed`, changesAfter: "System deleted" });
    showToast(`System ${deleteTarget.systemId} deleted.`, "success");
    setDeleteTarget(null);
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field
      ? sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      : <span className="w-3 inline-block" />;

  const stats = {
    total: systems.length,
    active: systems.filter((s) => s.status === "Active").length,
    development: systems.filter((s) => s.environment === "Development").length,
    inactive: systems.filter((s) => s.status === "Inactive").length,
  };

  return (
    <div>
      {/* Drawers & Dialogs */}
      {drawerMode === "add" && <SystemFormDrawer mode="add" initial={EMPTY_FORM} onSave={handleAdd} onClose={() => setDrawerMode(null)} />}
      {drawerMode === "edit" && editTarget && (
        <SystemFormDrawer
          mode="edit"
          initial={{ systemId: editTarget.systemId, systemName: editTarget.systemName, client: editTarget.client, environment: editTarget.environment, host: editTarget.host, description: editTarget.description, status: editTarget.status }}
          onSave={handleEdit}
          onClose={() => { setDrawerMode(null); setEditTarget(null); }}
        />
      )}
      {deleteTarget && <DeleteConfirmDialog system={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded shadow-lg text-sm"
          style={{ background: toast.type === "success" ? "#f1fdf6" : "#fff2f2", border: `1px solid ${toast.type === "success" ? F.success : F.error}`, color: toast.type === "success" ? F.success : F.error }}
        >
          {toast.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database size={20} style={{ color: F.primary }} />
            <h1 className="text-xl" style={{ color: F.text }}>Data Management</h1>
          </div>
          <p className="text-sm" style={{ color: F.muted }}>
            Manage SAP system registry. Systems added here appear in all module dropdowns across the application.
          </p>
        </div>
        <button
          onClick={() => setDrawerMode("add")}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded text-white flex-shrink-0"
          style={{ background: F.primary }}
        >
          <Plus size={15} /> Add System
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
<<<<<<< HEAD
          { label: "Total Systems", value: stats.total, color: F.primary, bg: "var(--app-info-surface)" },
          { label: "Active", value: stats.active, color: F.success, bg: "var(--app-success-surface)" },
          { label: "Development", value: stats.development, color: F.primary, bg: "var(--app-info-surface)" },
          { label: "Inactive", value: stats.inactive, color: F.muted, bg: "var(--app-subtle)" },
=======
          { label: "Total Systems", value: stats.total, color: F.primary, bg: "#e8f2ff" },
          { label: "Active", value: stats.active, color: F.success, bg: "#f1fdf6" },
          { label: "Development", value: stats.development, color: F.primary, bg: "#e8f2ff" },
          { label: "Inactive", value: stats.inactive, color: F.muted, bg: "#f5f6f7" },
>>>>>>> origin/main
        ].map((c) => (
          <div key={c.label} className="rounded px-4 py-3" style={{ background: c.bg, border: `1px solid ${c.color}25` }}>
            <p className="text-xs mb-1" style={{ color: F.muted }}>{c.label}</p>
            <p className="text-3xl" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
<<<<<<< HEAD
      <div className="rounded mb-4 overflow-visible" style={{ background: F.white, border: `1px solid ${F.border}` }}>
        <div className="flex flex-wrap items-center gap-3 p-3">
          <div className="flex-1 min-w-44">
            <p className="text-xs mb-1" style={{ color: F.muted }}>Search</p>
            <ValueHelpInput
              value={search}
              onChange={setSearch}
              options={systems.map((s) => ({
                value: s.systemId,
                label: s.systemName,
                secondary: `${s.environment} · Client ${s.client} · ${s.host}`,
                badge: s.status,
                badgeColor: s.status === "Active" ? "#107e3e" : "#74777a",
                badgeBg: s.status === "Active" ? "#f1fdf6" : "#f5f6f7",
              }))}
              placeholder="Search systems…"
              emptyMessage="No matching systems found."
            />
          </div>
=======
      <div className="rounded mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-3 items-end" style={{ background: F.white, border: `1px solid ${F.border}` }}>
        <div className="lg:col-span-1 min-w-44">
          <p className="text-xs mb-1" style={{ color: F.muted }}>Search</p>
          <ValueHelpInput
            value={search}
            onChange={setSearch}
            options={systems.map((s) => ({
              value: s.systemId,
              label: s.systemName,
              secondary: `${s.environment} · Client ${s.client} · ${s.host}`,
              badge: s.status,
              badgeColor: s.status === "Active" ? "#107e3e" : "#74777a",
              badgeBg: s.status === "Active" ? "#f1fdf6" : "#f5f6f7",
            }))}
            placeholder="Search systems…"
            emptyMessage="No matching systems found."
          />
        </div>
        <div>
          <SearchableFilterDropdown
            label="Environment"
            value={envFilter === "All" ? "" : envFilter}
            onChange={(v) => setEnvFilter(v || "All")}
            options={["", "Development"]}
            allLabel="All Environments"
            placeholder="Search environment…"
          />
        </div>
        <div>
          <SearchableFilterDropdown
            label="Status"
            value={statusFilter === "All" ? "" : statusFilter}
            onChange={(v) => setStatusFilter(v || "All")}
            options={["", "Active", "Inactive"]}
            allLabel="All Statuses"
            placeholder="Search status…"
          />
        </div>
        <div>
          <SearchableFilterDropdown
            label="Client"
            value={clientFilter === "All" ? "" : clientFilter}
            onChange={(v) => setClientFilter(v || "All")}
            options={uniqueClients.map((c) => c === "All" ? "" : c)}
            allLabel="All Clients"
            placeholder="Search client…"
          />
        </div>
        <div>
          <SearchableFilterDropdown
            label="Created By"
            value={creatorFilter === "All" ? "" : creatorFilter}
            onChange={(v) => setCreatorFilter(v || "All")}
            options={uniqueCreators.map((c) => c === "All" ? "" : c)}
            allLabel="All Creators"
            placeholder="Search creator…"
          />
        </div>
        <div className="lg:col-span-5 flex justify-between items-center pt-2" style={{ borderTop: `1px solid ${F.border}` }}>
>>>>>>> origin/main
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded text-white shadow-sm transition-all"
            style={{ background: F.primary }}
          >
            <Play size={12} fill="currentColor" /> Go
          </button>
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded text-xs transition-colors"
            style={{
              border: `1px solid ${hasAnyFilter ? "#bb000030" : F.border}`,
              background: hasAnyFilter ? "#fff2f2" : F.white,
              color: hasAnyFilter ? F.error : F.muted,
            }}
          >
            <X size={12} /> Clear All Filters
          </button>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs rounded"
            style={{
              border: `1px solid ${showFilters ? F.primary : F.border}`,
              background: showFilters ? "#e8f2ff" : F.white,
              color: showFilters ? F.primary : F.text,
            }}
          >
            <Filter size={13} />
            Filters
          </button>
          <span className="text-xs ml-auto" style={{ color: F.muted }}>{hasSubmitted ? `${filtered.length} of ${systems.length} systems` : "0 systems displayed"}</span>
        </div>

        {showFilters && (
          <div className="px-3 pb-3 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" style={{ borderTop: `1px solid ${F.border}` }}>
            <div className="pt-3">
              <SearchableFilterDropdown
                label="Environment"
                value={envFilter === "All" ? "" : envFilter}
                onChange={(v) => setEnvFilter(v || "All")}
                options={["", "Development"]}
                allLabel="All Environments"
                placeholder="Search environment…"
              />
            </div>
            <div className="pt-3">
              <SearchableFilterDropdown
                label="Status"
                value={statusFilter === "All" ? "" : statusFilter}
                onChange={(v) => setStatusFilter(v || "All")}
                options={["", "Active", "Inactive"]}
                allLabel="All Statuses"
                placeholder="Search status…"
              />
            </div>
            <div className="pt-3">
              <SearchableFilterDropdown
                label="Client"
                value={clientFilter === "All" ? "" : clientFilter}
                onChange={(v) => setClientFilter(v || "All")}
                options={uniqueClients.map((c) => c === "All" ? "" : c)}
                allLabel="All Clients"
                placeholder="Search client…"
              />
            </div>
            <div className="pt-3">
              <SearchableFilterDropdown
                label="Created By"
                value={creatorFilter === "All" ? "" : creatorFilter}
                onChange={(v) => setCreatorFilter(v || "All")}
                options={uniqueCreators.map((c) => c === "All" ? "" : c)}
                allLabel="All Creators"
                placeholder="Search creator…"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results / Blank State */}
      {!hasSubmitted ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded" style={{ background: F.white, border: `1px solid ${F.border}`, color: F.muted }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#e8f2ff", color: F.primary }}>
            <Filter size={24} />
          </div>
          <p className="text-sm font-medium" style={{ color: F.text }}>No Data Displayed Yet</p>
          <p className="text-xs">Select your system search criteria above, then click <strong>Go</strong> to load system entries.</p>
        </div>
      ) : (
        <div className="rounded overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}` }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#f5f6f7", borderBottom: `1px solid ${F.border}` }}>
                  {([
                    ["systemId", "System ID"],
                    ["systemName", "System Name"],
                    ["client", "Client"],
                    ["environment", "Environment"],
                    ["host", "Host / Server"],
                    ["status", "Status"],
                    ["createdAt", "Created"],
                  ] as [SortField, string][]).map(([field, label]) => (
                    <th
                      key={field}
                      onClick={() => handleSort(field)}
                      className="px-4 py-3 text-left text-xs cursor-pointer select-none"
                      style={{ color: sortField === field ? F.primary : F.muted, fontWeight: 600 }}
                    >
                      <span className="flex items-center gap-1">{label}<SortIcon field={field} /></span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs" style={{ color: F.muted, fontWeight: 600 }}>Description</th>
                  <th className="px-4 py-3 text-right text-xs" style={{ color: F.muted, fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm" style={{ color: F.muted }}>
                      No systems found. Adjust filters or add a new system.
                    </td>
                  </tr>
                )}
                {filtered.map((sys, i) => {
                  const env = ENV_META[sys.environment];
                  return (
                    <tr
                      key={sys.id}
                      onClick={() => onViewDetail?.(sys)}
                      style={{ borderBottom: `1px solid ${F.border}`, background: i % 2 === 0 ? F.white : "#fafafa", cursor: onViewDetail ? "pointer" : "default" }}
                      onMouseEnter={(e) => { if (onViewDetail) e.currentTarget.style.background = "#f0f6ff"; }}
                      onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? F.white : "#fafafa")}
                    >
                      {/* System ID */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded text-xs" style={{ background: "#e8f2ff", color: F.primary, fontWeight: 600 }}>
                          {sys.systemId}
                        </span>
                      </td>
                      {/* System Name */}
                      <td className="px-4 py-3" style={{ color: F.text }}>{sys.systemName}</td>
                      {/* Client */}
                      <td className="px-4 py-3" style={{ color: F.muted }}>{sys.client}</td>
                      {/* Environment */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs" style={{ background: env.bg, color: env.color }}>
                          {sys.environment}
                        </span>
                      </td>
                      {/* Host */}
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: F.muted }}>{sys.host}</td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 w-fit">
                          <span className="w-2 h-2 rounded-full" style={{ background: sys.status === "Active" ? F.success : F.muted }} />
                          <span className="text-xs" style={{ color: sys.status === "Active" ? F.success : F.muted }}>{sys.status}</span>
                        </span>
                      </td>
                      {/* Created */}
                      <td className="px-4 py-3">
                        <p className="text-xs" style={{ color: F.text }}>{new Date(sys.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs" style={{ color: F.muted }}>by {sys.createdBy}</p>
                      </td>
                      {/* Description */}
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-xs truncate" style={{ color: F.muted, maxWidth: "200px" }} title={sys.description}>
                          {sys.description || "—"}
                        </p>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditTarget(sys); setDrawerMode("edit"); }}
                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                            title="Edit"
                            style={{ color: F.muted }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(sys); }}
                            className="p-1.5 rounded transition-colors"
                            title="Delete"
                            style={{ color: F.muted }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = F.error)}
                            onMouseLeave={(e) => (e.currentTarget.style.color = F.muted)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: `1px solid ${F.border}`, background: "#fafafa" }}>
            <p className="text-xs" style={{ color: F.muted }}>
              Showing <strong>{filtered.length}</strong> of <strong>{systems.length}</strong> registered systems
            </p>
            <p className="text-xs" style={{ color: F.muted }}>
              System registry is shared across all provisioning modules
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
