import { useState } from "react";
import { Lock, Unlock, AlertCircle, CheckCircle2, ShieldAlert, X, Server } from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { ValueHelpInput, MOCK_SAP_USERS } from "./ValueHelpInput";

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
            <p className="text-sm" style={{ color: F.text }}>
              You are about to <strong>{action}</strong> user <strong>{username}</strong> in <strong>{system}</strong>.
              {isLock ? " The user will immediately lose system access." : " The user will regain system access."}
            </p>
          </div>
          <p className="text-sm" style={{ color: F.muted }}>This action will be recorded in the security audit log.</p>
        </div>
        <div className="flex justify-end gap-3 px-5 py-4" style={{ borderTop: `1px solid ${F.border}`, background: "#fafafa" }}>
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded text-white" style={{ background: isLock ? F.error : F.success }}>
            {isLock ? "Lock User" : "Unlock User"}
          </button>
        </div>
      </div>
    </div>
  );
}

const RECENT_ACTIONS = [
  { user: "ALICE.SMITH", action: "locked" as const, time: "Today 10:32", by: "ADMIN", system: "PRD" },
  { user: "BOB.JONES", action: "unlocked" as const, time: "Today 09:15", by: "ADMIN", system: "PRD" },
  { user: "CAROL.WHITE", action: "locked" as const, time: "Yesterday 17:44", by: "BASIS01", system: "PRD" },
  { user: "DAVID.BROWN", action: "unlocked" as const, time: "Yesterday 14:20", by: "ADMIN", system: "QAS" },
];

export function LockUnlockUser() {
  const { systems, logAction } = useAppContext();
  const [selectedSystem, setSelectedSystem] = useState("");
  const [username, setUsername] = useState("");
  const [action, setAction] = useState<Action>("lock");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState<{ username: string; action: Action; system: string } | null>(null);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!selectedSystem) e.system = "Please select a target SAP system";
    if (!username.trim()) e.username = "Username is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmitClick = () => { if (validate()) setShowConfirmDialog(true); };

  const handleConfirm = async () => {
    setShowConfirmDialog(false);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    const success = Math.random() > 0.15;
    setLoading(false);
    setStatus(success ? "success" : "error");
    const sys = systems.find((s) => s.id === selectedSystem);
    if (success) setLastAction({ username, action, system: sys?.systemId ?? "—" });
    logAction({
      module: "Lock/Unlock", action: action === "lock" ? "Lock User" : "Unlock User",
      targetObject: username, system: sys?.systemId ?? "—", client: sys?.client ?? "—",
      status: success ? "Success" : "Failed",
      durationMs: Math.floor(500 + Math.random() * 700),
      details: success
        ? action === "lock" ? `User ${username} locked in ${sys?.systemId}/${sys?.client}. All active sessions terminated.` : `User ${username} unlocked in ${sys?.systemId}/${sys?.client}. Logon access restored.`
        : `${action === "lock" ? "Lock" : "Unlock"} failed — ${username} not found or insufficient authorization (S_USR_ADM).`,
      errorCode: success ? undefined : "AUTH_FAILURE_S_USR_ADM",
      changesBefore: success ? `Status: ${action === "lock" ? "Active" : "Locked"}` : undefined,
      changesAfter: success ? `Status: ${action === "lock" ? "Locked" : "Active"}` : undefined,
    });
  };

  const handleReset = () => { setUsername(""); setAction("lock"); setErrors({}); setStatus("idle"); setSelectedSystem(""); };
  const sys = systems.find((s) => s.id === selectedSystem);

  return (
    <div>
      {showConfirmDialog && <ConfirmDialog username={username} action={action} system={sys ? `${sys.systemId} / Client ${sys.client}` : "—"} onConfirm={handleConfirm} onCancel={() => setShowConfirmDialog(false)} />}

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1"><Lock size={20} style={{ color: F.primary }} /><h1 className="text-xl" style={{ color: F.text }}>Lock / Unlock User</h1></div>
        <p className="text-sm" style={{ color: F.muted }}>Control SAP user account access by locking or unlocking accounts.</p>
      </div>

      {status === "success" && lastAction && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded" style={{ background: "#f1fdf6", border: `1px solid ${F.success}` }}>
          <CheckCircle2 size={18} style={{ color: F.success, flexShrink: 0, marginTop: "2px" }} />
          <div>
            <p className="text-sm" style={{ color: F.success }}>User <strong>{lastAction.username}</strong> successfully <strong>{lastAction.action}ed</strong> in <strong>{lastAction.system}</strong>.</p>
            <p className="text-xs mt-0.5" style={{ color: F.muted }}>Action recorded in security audit log at {new Date().toLocaleTimeString()}.</p>
          </div>
        </div>
      )}
      {status === "error" && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded" style={{ background: "#fff2f2", border: `1px solid ${F.error}` }}>
          <AlertCircle size={18} style={{ color: F.error, flexShrink: 0, marginTop: "2px" }} />
          <div>
            <p className="text-sm" style={{ color: F.error }}>Operation failed. User not found or insufficient authorization.</p>
            <p className="text-xs mt-0.5" style={{ color: F.muted }}>Check audit log for error code AUTH_FAILURE_S_USR_ADM.</p>
          </div>
        </div>
      )}

      <SystemSelector systems={systems} selectedId={selectedSystem} onChange={setSelectedSystem} />
      {errors.system && <p className="flex items-center gap-1 mb-4 text-xs" style={{ color: F.error }}><AlertCircle size={11} /> {errors.system}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded" style={{ background: F.white, border: `1px solid ${F.border}` }}>
            <div className="px-5 py-3" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}><h3 className="text-sm" style={{ color: F.text }}>User Account Control</h3></div>
            <div className="p-5">
              {/* Username with Value Help */}
              <div className="mb-5">
                <label className="block text-sm mb-1" style={{ color: F.muted }}>Username <span style={{ color: F.error }}>*</span></label>
                <ValueHelpInput
                  value={username}
                  onChange={(v) => { setUsername(v); if (errors.username) setErrors((e) => { const n = { ...e }; delete n.username; return n; }); }}
                  options={MOCK_SAP_USERS}
                  placeholder="Select or search user…"
                  error={errors.username}
                  emptyMessage="No matching SAP users found."
                />
                <p className="text-xs mt-1.5" style={{ color: F.muted }}>Click F4 to browse all users. Locked users are marked in the list.</p>
              </div>

              {/* Action Cards */}
              <div className="mb-6">
                <label className="block text-sm mb-2" style={{ color: F.muted }}>Action <span style={{ color: F.error }}>*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setAction("lock")} className="flex items-center gap-3 p-4 rounded text-left transition-all" style={{ border: `2px solid ${action === "lock" ? F.error : F.border}`, background: action === "lock" ? "#fff2f2" : F.white }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: action === "lock" ? F.error : "#f5f6f7" }}>
                      <Lock size={16} style={{ color: action === "lock" ? "#fff" : F.muted }} />
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: action === "lock" ? F.error : F.text }}>Lock User</p>
                      <p className="text-xs mt-0.5" style={{ color: F.muted }}>Revoke system access</p>
                    </div>
                  </button>
                  <button onClick={() => setAction("unlock")} className="flex items-center gap-3 p-4 rounded text-left transition-all" style={{ border: `2px solid ${action === "unlock" ? F.success : F.border}`, background: action === "unlock" ? "#f1fdf6" : F.white }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: action === "unlock" ? F.success : "#f5f6f7" }}>
                      <Unlock size={16} style={{ color: action === "unlock" ? "#fff" : F.muted }} />
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: action === "unlock" ? F.success : F.text }}>Unlock User</p>
                      <p className="text-xs mt-0.5" style={{ color: F.muted }}>Restore system access</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded" style={{ background: "#f0f6ff", border: `1px solid #0070f230` }}>
                <AlertCircle size={15} style={{ color: F.primary, flexShrink: 0, marginTop: "2px" }} />
                <p className="text-xs" style={{ color: F.muted }}>
                  {action === "lock" ? "Locking a user will immediately terminate active sessions and prevent further logon. The user remains locked until manually unlocked." : "Unlocking a user restores logon access. Ensure the user's validity period is still active and roles are correctly assigned."}
                </p>
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

        {/* Recent Activity Panel */}
        <div>
          <div className="rounded" style={{ background: F.white, border: `1px solid ${F.border}` }}>
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}><h3 className="text-sm" style={{ color: F.text }}>Recent Activity</h3></div>
            <div className="divide-y" style={{ borderColor: F.border }}>
              {RECENT_ACTIONS.map((item, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    {item.action === "locked" ? <Lock size={12} style={{ color: F.error }} /> : <Unlock size={12} style={{ color: F.success }} />}
                    <span className="text-sm" style={{ color: F.text }}>{item.user}</span>
                    <span className="ml-auto px-2 py-0.5 text-xs rounded" style={{ background: item.action === "locked" ? "#fff2f2" : "#f1fdf6", color: item.action === "locked" ? F.error : F.success }}>{item.action}</span>
                  </div>
                  <p className="text-xs" style={{ color: F.muted }}>{item.time} · {item.by} · {item.system}</p>
                </div>
              ))}
            </div>
            <div className="px-4 py-3" style={{ borderTop: `1px solid ${F.border}` }}>
              <button className="text-xs w-full text-center" style={{ color: F.primary }}>View Full Audit Log →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
