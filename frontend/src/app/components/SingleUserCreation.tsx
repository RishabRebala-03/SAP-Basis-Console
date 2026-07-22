import { useState } from "react";
import { Eye, EyeOff, CheckCircle2, AlertCircle, RotateCcw, Save, UserPlus, Server } from "lucide-react";
import { useAppContext } from "../contexts/AppContext";

interface FormData {
  username: string; lastName: string; firstName: string; email: string;
  tempPassword: string; validFrom: string; validTo: string; roles: string; userType: string;
}
interface FormErrors { [key: string]: string; }

const AVAILABLE_ROLES = ["Z_BASIS_ADMIN","Z_FI_ACCOUNTANT","Z_MM_PURCHASER","Z_SD_SALES","Z_HR_MANAGER","Z_PP_PLANNER","Z_QM_INSPECTOR","Z_CO_CONTROLLER","SAP_ALL","SAP_NEW"];
const USER_TYPES = ["Dialog","System","Communication","Service","Reference"];

const F = {
  primary: "#0070f2", success: "#107e3e", error: "#bb0000", warning: "#e9730c",
  text: "#32363a", muted: "#74777a", border: "#d9d9d9", bg: "#f5f6f7", white: "#ffffff",
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
      <select
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-3 py-1.5 text-sm rounded outline-none"
        style={{ border: `1px solid #0070f240`, background: F.white, color: F.text }}
      >
        <option value="">— Select SAP System —</option>
        {active.map((s) => (
          <option key={s.id} value={s.id}>{s.systemId} – {s.systemName} (Client {s.client})</option>
        ))}
      </select>
      {selectedId && (() => {
        const s = systems.find((x) => x.id === selectedId);
        return s ? (
          <span className="text-xs px-2 py-0.5 rounded flex-shrink-0" style={{ background: s.environment === "Production" ? "#fff2f2" : s.environment === "Quality" ? "#fff8f0" : "#e8f2ff", color: s.environment === "Production" ? F.error : s.environment === "Quality" ? F.warning : F.primary }}>
            {s.environment}
          </span>
        ) : null;
      })()}
    </div>
  );
}

export function SingleUserCreation() {
  const { systems, logAction } = useAppContext();
  const [selectedSystem, setSelectedSystem] = useState("");
  const [form, setForm] = useState<FormData>({ username: "", lastName: "", firstName: "", email: "", tempPassword: "", validFrom: "", validTo: "", roles: "", userType: "Dialog" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);

  const set = (field: keyof FormData) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!selectedSystem) e.system = "Please select a target SAP system";
    if (!form.username.trim()) e.username = "Username is required";
    else if (!/^[A-Z0-9_.]{3,12}$/.test(form.username)) e.username = "3–12 chars, uppercase letters/numbers/dots only";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.tempPassword) e.tempPassword = "Temporary password is required";
    else if (form.tempPassword.length < 8) e.tempPassword = "Minimum 8 characters";
    if (!form.validFrom) e.validFrom = "Valid From date is required";
    if (!form.validTo) e.validTo = "Valid To date is required";
    if (form.validFrom && form.validTo && form.validFrom >= form.validTo) e.validTo = "Valid To must be after Valid From";
    if (selectedRoles.length === 0) e.roles = "At least one role or profile is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    const success = Math.random() > 0.2;
    setLoading(false);
    setStatus(success ? "success" : "error");
    const sys = systems.find((s) => s.id === selectedSystem);
    logAction({
      module: "Single User",
      action: "Create User",
      targetObject: form.username,
      system: sys?.systemId ?? "—",
      client: sys?.client ?? "—",
      status: success ? "Success" : "Failed",
      durationMs: Math.floor(800 + Math.random() * 1200),
      details: success
        ? `User ${form.username} (${form.lastName}, ${form.firstName}) created. Type: ${form.userType}. Roles: ${selectedRoles.join(", ")}. Valid ${form.validFrom} to ${form.validTo}.`
        : `User creation failed — ${form.username} may already exist in ${sys?.systemId ?? "system"}.`,
      errorCode: success ? undefined : "BAPI_USER_EXIST",
      changesAfter: success ? `User ${form.username} provisioned in ${sys?.systemId}/${sys?.client} with roles ${selectedRoles.join(", ")}` : undefined,
    });
  };

  const handleReset = () => {
    setForm({ username: "", lastName: "", firstName: "", email: "", tempPassword: "", validFrom: "", validTo: "", roles: "", userType: "Dialog" });
    setSelectedRoles([]); setErrors({}); setStatus("idle"); setSelectedSystem("");
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);
    if (errors.roles) setErrors((e) => { const n = { ...e }; delete n.roles; return n; });
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UserPlus size={20} style={{ color: F.primary }} />
            <h1 className="text-xl" style={{ color: F.text }}>Single User Creation</h1>
          </div>
          <p className="text-sm" style={{ color: F.muted }}>Create a new SAP user account with roles and validity periods.</p>
        </div>
      </div>

      {/* Status */}
      {status === "success" && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded" style={{ background: "#f1fdf6", border: `1px solid ${F.success}` }}>
          <CheckCircle2 size={18} style={{ color: F.success, flexShrink: 0, marginTop: "2px" }} />
          <div>
            <p className="text-sm" style={{ color: F.success }}>User <strong>{form.username}</strong> created successfully in <strong>{systems.find((s) => s.id === selectedSystem)?.systemId}</strong>.</p>
            <p className="text-xs mt-0.5" style={{ color: F.muted }}>The user has been provisioned. Action recorded in audit log.</p>
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

      {/* System Selector */}
      <SystemSelector systems={systems} selectedId={selectedSystem} onChange={setSelectedSystem} />
      {errors.system && <p className="flex items-center gap-1 mb-4 text-xs" style={{ color: F.error }}><AlertCircle size={11} /> {errors.system}</p>}

      {/* Form Card */}
      <div className="rounded" style={{ background: F.white, border: `1px solid ${F.border}` }}>
        {/* Basic Info */}
        <div className="px-5 py-3" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
          <h3 className="text-sm" style={{ color: F.text }}>Basic Information</h3>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" style={{ borderBottom: `1px solid ${F.border}` }}>
          <div>
            <FioriLabel label="Username" required />
            <FioriInput value={form.username} onChange={(v) => set("username")(v.toUpperCase())} placeholder="e.g. JOHN.DOE" error={errors.username} />
            <p className="text-xs mt-1" style={{ color: F.muted }}>Max 12 characters, uppercase</p>
          </div>
          <div>
            <FioriLabel label="Last Name" required />
            <FioriInput value={form.lastName} onChange={set("lastName")} placeholder="Family name" error={errors.lastName} />
          </div>
          <div>
            <FioriLabel label="First Name" />
            <FioriInput value={form.firstName} onChange={set("firstName")} placeholder="Given name" />
          </div>
          <div>
            <FioriLabel label="Email Address" />
            <FioriInput value={form.email} onChange={set("email")} placeholder="user@company.com" type="email" error={errors.email} />
          </div>
          <div>
            <FioriLabel label="User Type" required />
            <select value={form.userType} onChange={(e) => set("userType")(e.target.value)} className="w-full px-3 py-2 text-sm outline-none" style={{ border: `1px solid ${F.border}`, borderRadius: "4px", background: F.white, color: F.text }}>
              {USER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Security */}
        <div className="px-5 py-3" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
          <h3 className="text-sm" style={{ color: F.text }}>Security</h3>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5" style={{ borderBottom: `1px solid ${F.border}` }}>
          <div>
            <FioriLabel label="Temporary Password" required />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} value={form.tempPassword}
                onChange={(e) => set("tempPassword")(e.target.value)} placeholder="Minimum 8 characters"
                className="w-full px-3 py-2 pr-10 text-sm outline-none transition-all"
                style={{ border: `1px solid ${errors.tempPassword ? F.error : F.border}`, borderRadius: "4px", background: F.white, color: F.text }}
                onFocus={(e) => { e.target.style.borderColor = F.primary; e.target.style.boxShadow = `0 0 0 2px #0070f220`; }}
                onBlur={(e) => { e.target.style.borderColor = errors.tempPassword ? F.error : F.border; e.target.style.boxShadow = "none"; }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: F.muted }}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.tempPassword && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: F.error }}><AlertCircle size={11} /> {errors.tempPassword}</p>}
            <div className="mt-2 flex gap-1">
              {[1,2,3,4].map((i) => (
                <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ background: form.tempPassword.length === 0 ? "#d9d9d9" : i === 1 ? (form.tempPassword.length < 6 ? F.error : F.success) : i === 2 ? (form.tempPassword.length < 8 ? F.warning : F.success) : i === 3 ? (form.tempPassword.length < 10 ? (form.tempPassword.length >= 8 ? "#f0ab00" : "#d9d9d9") : F.success) : form.tempPassword.length >= 12 ? F.success : "#d9d9d9" }} />
              ))}
            </div>
          </div>
        </div>

        {/* Validity */}
        <div className="px-5 py-3" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
          <h3 className="text-sm" style={{ color: F.text }}>Validity Period</h3>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5" style={{ borderBottom: `1px solid ${F.border}` }}>
          <div><FioriLabel label="Valid From" required /><FioriInput value={form.validFrom} onChange={set("validFrom")} type="date" error={errors.validFrom} /></div>
          <div><FioriLabel label="Valid To" required /><FioriInput value={form.validTo} onChange={set("validTo")} type="date" error={errors.validTo} /></div>
        </div>

        {/* Roles */}
        <div className="px-5 py-3" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
          <h3 className="text-sm" style={{ color: F.text }}>Roles & Profiles</h3>
        </div>
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

        {/* Footer */}
        <div className="px-5 py-4 flex items-center justify-between gap-3" style={{ background: "#fafafa" }}>
          <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 text-sm rounded transition-colors" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>
            <RotateCcw size={14} /> Reset
          </button>
          <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-5 py-2 text-sm rounded text-white" style={{ background: loading ? "#74a8f5" : F.primary }}>
            {loading ? <><span className="animate-spin border-2 border-white border-t-transparent rounded-full w-3.5 h-3.5" /> Processing...</> : <><Save size={14} /> Create User</>}
          </button>
        </div>
      </div>
    </div>
  );
}
