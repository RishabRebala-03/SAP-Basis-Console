import { useState } from "react";
import { Database, Plus, Pencil, Trash2, X, CheckCircle2, AlertCircle, ChevronUp, ChevronDown, Save, ServerCrash, Server } from "lucide-react";
import { useAppContext, SapSystem } from "../contexts/AppContext";
import { ValueHelpInput } from "./ValueHelpInput";

const F = {
  primary: "#0070f2", success: "#107e3e", error: "#bb0000",
  warning: "#e9730c", text: "#32363a", muted: "#74777a",
  border: "#d9d9d9", bg: "#f5f6f7", white: "#ffffff",
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
  systemId: "", systemName: "", client: "", environment: "Development", host: "", description: "", status: "Active",
};

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
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  };

  const validate = () => {
    const e: Partial<FormState> = {};
    if (!form.systemId.trim()) e.systemId = "Required";
    else if (!/^[A-Z0-9]{2,10}$/.test(form.systemId)) e.systemId = "2–10 uppercase alphanumeric chars";
    if (!form.systemName.trim()) e.systemName = "Required";
    if (!form.client.trim()) e.client = "Required";
    else if (!/^\d{3}$/.test(form.client)) e.client = "Must be a 3-digit number (e.g. 100)";
    if (!form.host.trim()) e.host = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaved(true);
    setTimeout(() => { onSave(form); onClose(); }, 600);
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
              <FioriInput label="System ID" value={form.systemId} onChange={(v) => set("systemId")(v.toUpperCase())} placeholder="e.g. PRD" error={errors.systemId} required maxLength={10} />
              <FioriInput label="System Name" value={form.systemName} onChange={set("systemName")} placeholder="e.g. Production" error={errors.systemName} required />
              <FioriInput label="Client Number" value={form.client} onChange={set("client")} placeholder="e.g. 100" error={errors.client} required maxLength={3} />
              <div>
                <label className="block text-xs mb-1" style={{ color: F.muted }}>Environment <span style={{ color: F.error }}>*</span></label>
                <select
                  value={form.environment}
                  onChange={(e) => set("environment")(e.target.value)}
                  className="w-full px-3 py-2 text-sm outline-none rounded"
                  style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}
                >
                  {["Production", "Quality", "Development", "Sandbox"].map((e) => <option key={e}>{e}</option>)}
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
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [drawerMode, setDrawerMode] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<SapSystem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SapSystem | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const filtered = systems
    .filter((s) => {
      const q = search.toLowerCase();
      return (
        (s.systemId.toLowerCase().includes(q) || s.systemName.toLowerCase().includes(q) || s.host.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)) &&
        (envFilter === "All" || s.environment === envFilter) &&
        (statusFilter === "All" || s.status === statusFilter)
      );
    })
    .sort((a, b) => {
      const va = a[sortField] ?? "";
      const vb = b[sortField] ?? "";
      return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

  const handleAdd = (form: FormState) => {
    addSystem(form as Omit<SapSystem, "id" | "createdAt" | "createdBy">);
    logAction({ module: "Data Management", action: "Add System", targetObject: form.systemId, system: "—", client: "—", status: "Success", durationMs: 210, details: `System ${form.systemId} (${form.systemName}) registered. Host: ${form.host}`, changesAfter: `System ${form.systemId} added with status ${form.status}` });
    showToast(`System ${form.systemId} added successfully.`, "success");
  };

  const handleEdit = (form: FormState) => {
    if (!editTarget) return;
    const before = `${editTarget.systemId} | ${editTarget.environment} | ${editTarget.status}`;
    const after = `${form.systemId} | ${form.environment} | ${form.status}`;
    updateSystem(editTarget.id, form);
    logAction({ module: "Data Management", action: "Edit System", targetObject: form.systemId, system: "—", client: "—", status: "Success", durationMs: 190, details: `System ${form.systemId} updated.`, changesBefore: before, changesAfter: after });
    showToast(`System ${form.systemId} updated.`, "success");
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
    production: systems.filter((s) => s.environment === "Production").length,
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
          { label: "Total Systems", value: stats.total, color: F.primary, bg: "#e8f2ff" },
          { label: "Active", value: stats.active, color: F.success, bg: "#f1fdf6" },
          { label: "Production", value: stats.production, color: "#bb0000", bg: "#fff2f2" },
          { label: "Inactive", value: stats.inactive, color: F.muted, bg: "#f5f6f7" },
        ].map((c) => (
          <div key={c.label} className="rounded px-4 py-3" style={{ background: c.bg, border: `1px solid ${c.color}25` }}>
            <p className="text-xs mb-1" style={{ color: F.muted }}>{c.label}</p>
            <p className="text-3xl" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded mb-4 flex flex-wrap items-center gap-3 p-3" style={{ background: F.white, border: `1px solid ${F.border}` }}>
        <div className="flex-1 min-w-52">
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
            placeholder="Search systems… (F4 for value help)"
            emptyMessage="No matching systems found."
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: F.muted }}>Environment:</label>
          <select value={envFilter} onChange={(e) => setEnvFilter(e.target.value)} className="text-sm px-2 py-1.5 rounded outline-none" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>
            {["All", "Production", "Quality", "Development", "Sandbox"].map((e) => <option key={e}>{e}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: F.muted }}>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm px-2 py-1.5 rounded outline-none" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>
            {["All", "Active", "Inactive"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <span className="text-xs ml-auto" style={{ color: F.muted }}>{filtered.length} of {systems.length} systems</span>
      </div>

      {/* Table */}
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
    </div>
  );
}
