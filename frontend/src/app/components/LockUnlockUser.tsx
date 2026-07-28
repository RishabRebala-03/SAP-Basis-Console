import { useState, useMemo } from "react";
import {
  Lock, Unlock, AlertCircle, CheckCircle2, ShieldAlert, X,
  Server, History, Clock, Search, Filter, ChevronUp, ChevronDown, Play,
} from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { SearchableFilterDropdown } from "./SearchableFilterDropdown";
import type { AuditLog } from "../contexts/AppContext";
import { lockUserApi, unlockUserApi, searchUsersApi } from "../../api/sapApi";

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
        const s = systems.find((x) => x.id === selectedId || x.systemId === selectedId);
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
          <div className="flex items-center gap-2"><ShieldAlert size={18} style={{ color: isLock ? F.error : F.warning }} /><h3 className="text-base font-semibold" style={{ color: F.text }}>Confirm {isLock ? "Lock" : "Wrong Password Unlock"}</h3></div>
          <button onClick={onCancel} className="p-1 rounded hover:bg-gray-100" style={{ color: F.muted }}><X size={16} /></button>
        </div>
        <div className="px-5 py-5">
          <div className="flex items-start gap-3 p-3 rounded mb-4" style={{ background: isLock ? "#fff2f2" : "#fff8f0", border: `1px solid ${isLock ? "#bb000030" : "#e9730c30"}` }}>
            {isLock ? <Lock size={16} style={{ color: F.error, flexShrink: 0, marginTop: "2px" }} /> : <Unlock size={16} style={{ color: F.warning, flexShrink: 0, marginTop: "2px" }} />}
            <p className="text-sm" style={{ color: F.text }}>{isLock ? "You are about to lock" : "You are about to unlock"} user <strong>{username}</strong> in <strong>{system}</strong>.{isLock ? " This will only run after this confirmation." : " Use unlock only for accounts locked by wrong password attempts."}</p>
          </div>
          <p className="text-xs" style={{ color: F.muted }}>This action will execute directly against the live SAP OData Gateway and will be recorded in the security audit log.</p>
        </div>
        <div className="flex justify-end gap-3 px-5 py-4" style={{ borderTop: `1px solid ${F.border}`, background: "#fafafa" }}>
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded text-white font-medium" style={{ background: isLock ? F.error : F.success }}>{isLock ? "Lock User" : "Unlock User"}</button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = status === "Success" ? { bg: "#f1fdf6", color: F.success, border: "#107e3e40" } : status === "Failed" ? { bg: "#fff2f2", color: F.error, border: "#bb000040" } : { bg: "#fff8f0", color: F.warning, border: "#e9730c40" };
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{status === "Success" ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}{status}</span>;
}

function HistoryTabMini() {
  const { auditLogs } = useAppContext();
  const lockLogs = useMemo(() => auditLogs.filter((l) => l.module === "Lock/Unlock").slice(0, 5), [auditLogs]);
  if (lockLogs.length === 0) return <div className="p-4 text-xs text-center" style={{ color: F.muted }}>No recent lock/unlock activity.</div>;
  return (
    <div className="divide-y" style={{ borderColor: F.border }}>
      {lockLogs.map((l) => (
        <div key={l.id} className="p-3 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold" style={{ color: F.text }}>{l.targetObject}</span>
            <StatusBadge status={l.status} />
          </div>
          <p style={{ color: F.muted }}>{l.action} in {l.system}</p>
          <p className="text-[11px] mt-0.5" style={{ color: F.muted }}>{new Date(l.timestamp).toLocaleTimeString()}</p>
        </div>
      ))}
    </div>
  );
}

function HistoryTab() {
  const { auditLogs } = useAppContext();
  const lockLogs = useMemo(() => auditLogs.filter((l) => l.module === "Lock/Unlock"), [auditLogs]);
  if (lockLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 rounded" style={{ background: F.white, border: `1px solid ${F.border}`, color: F.muted }}>
        <History size={36} strokeWidth={1.2} />
        <p className="text-sm">No lock / unlock audit logs recorded yet.</p>
      </div>
    );
  }
  return (
    <div className="rounded overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}` }}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
        <h3 className="text-sm font-semibold" style={{ color: F.text }}>Lock / Unlock Audit History</h3>
        <span className="text-xs px-2.5 py-0.5 rounded font-medium" style={{ background: "#e8f2ff", color: F.primary }}>{lockLogs.length} total entries</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr style={{ background: "#f5f6f7", borderBottom: `1px solid ${F.border}`, color: F.muted }}>
              <th className="p-3">Time</th>
              <th className="p-3">Username</th>
              <th className="p-3">Action</th>
              <th className="p-3">System</th>
              <th className="p-3">Status</th>
              <th className="p-3">Performed By</th>
              <th className="p-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: F.border }}>
            {lockLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="p-3 font-semibold" style={{ color: F.text }}>{log.targetObject}</td>
                <td className="p-3">{log.action}</td>
                <td className="p-3">{log.system}</td>
                <td className="p-3"><StatusBadge status={log.status} /></td>
                <td className="p-3 text-gray-600">{log.performedBy}</td>
                <td className="p-3 text-gray-500">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LockUnlockUser() {
  const { systems, logAction } = useAppContext();
  const [activeTab, setActiveTab] = useState<"control" | "history">("control");
  const [selectedSystem, setSelectedSystem] = useState("");
  const [username, setUsername] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<any | null>(null);
  const [action, setAction] = useState<Action>("unlock");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState<{ username: string; action: Action; system: string; verifiedAt?: string } | null>(null);

  const handleLookup = async () => {
    if (!selectedSystem) {
      setErrors({ system: "Please select a target SAP system first" });
      return;
    }
    if (!username.trim()) {
      setErrors({ username: "Username is required for lookup" });
      return;
    }
    setErrors({});
    setSearching(true);
    setStatus("idle");
    setErrorMessage("");

    const sys = systems.find((s) => s.id === selectedSystem || s.systemId === selectedSystem);
    const targetSystemId = (sys?.systemId || selectedSystem || "SHD").replace("sys-", "").toUpperCase();

    try {
      const results = await searchUsersApi(targetSystemId, username.trim());
      setSearching(false);
      if (results && results.length > 0) {
        const u = results[0];
        setFoundUser(u);
        const isLocked = (u.LockStatus || "").toLowerCase() === "locked";
        setAction(isLocked ? "unlock" : "lock");
      } else {
        setFoundUser(null);
        setStatus("error");
        setErrorMessage(`User '${username.trim().toUpperCase()}' does not exist on SAP system ${targetSystemId}`);
      }
    } catch (err: any) {
      setSearching(false);
      setFoundUser(null);
      setStatus("error");
      setErrorMessage(err.message || `User '${username.trim().toUpperCase()}' was not found in SAP system ${targetSystemId}`);
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!selectedSystem) e.system = "Please select a target SAP system";
    if (!username.trim()) e.username = "Username is required";
    if (!foundUser) e.username = "Please lookup and verify user before proceeding";
    if (action === "unlock" && foundUser && (foundUser.LockStatus || "").toLowerCase() !== "locked") {
      e.username = "This user is not locked in SAP. Unlock is only available for locked users.";
    }
    if (action === "lock" && foundUser && (foundUser.LockStatus || "").toLowerCase() === "locked") {
      e.username = "This user is already locked in SAP. Choose Unlock if this was caused by wrong password attempts.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmitClick = () => {
    if (validate()) setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    setShowConfirmDialog(false); setLoading(true); setStatus("idle"); setErrorMessage("");
    const sys = systems.find((s) => s.id === selectedSystem || s.systemId === selectedSystem);
    const targetSystemId = (sys?.systemId || selectedSystem || "SHD").replace("sys-", "").toUpperCase();

    try {
      const res = action === "lock"
        ? await lockUserApi({ system_id: targetSystemId, username: username.trim().toUpperCase(), reason: "Locked via BASIS Console" })
        : await unlockUserApi({ system_id: targetSystemId, username: username.trim().toUpperCase(), reason: "Wrong Password Attempts" });

      const verifiedTime = res.VerifiedAt || new Date().toLocaleTimeString();

      const newStatus = res.LockStatus || (action === "lock" ? "Locked" : "Unlocked");
      setFoundUser((prev) => prev ? { ...prev, LockStatus: newStatus } : null);
      setAction(newStatus === "Locked" ? "unlock" : "lock");

      setLoading(false);
      setLastAction({ username: username.trim().toUpperCase(), action, system: targetSystemId, verifiedAt: verifiedTime });

      if (action === "unlock" && newStatus === "Locked") {
        setStatus("error");
        setErrorMessage(res.Message || "Wrong-password unlock was submitted, but SAP still reports the user as locked. Check for a remaining system-manager lock.");
      } else {
        setStatus("success");
      }

      logAction({
        module: "Lock/Unlock", action: action === "lock" ? "Lock User" : "Unlock User",
        targetObject: username.trim().toUpperCase(), system: targetSystemId, client: sys?.client ?? "100",
        status: action === "unlock" && newStatus === "Locked" ? "Warning" : "Success",
        durationMs: 850,
        details: res.Message || (action === "lock" ? `User ${username} locked in ${targetSystemId}` : `User ${username} unlocked after wrong password attempts in ${targetSystemId}`),
        changesBefore: `Status: ${action === "lock" ? "Active" : "Locked"}`,
        changesAfter: `Status: ${newStatus === "Locked" ? "Locked" : "Active"}`,
      });
    } catch (err: any) {
      setLoading(false);
      setStatus("error");
      setErrorMessage(err.message || `${action === "lock" ? "Lock" : "Unlock"} failed in SAP system.`);
      logAction({
        module: "Lock/Unlock", action: action === "lock" ? "Lock User" : "Unlock User",
        targetObject: username.trim().toUpperCase(), system: targetSystemId, client: sys?.client ?? "100",
        status: "Failed",
        durationMs: 550,
        details: err.message || `${action === "lock" ? "Lock" : "Unlock"} failed in SAP system.`,
        errorCode: "SAP_SYSTEM_ERROR",
      });
    }
  };

  const handleReset = () => {
    setUsername("");
    setFoundUser(null);
    setAction("unlock");
    setErrors({});
    setStatus("idle");
    setErrorMessage("");
    setSelectedSystem("");
    setLastAction(null);
  };

  const sys = systems.find((s) => s.id === selectedSystem);
  const tabBtn = (active: boolean) => ({ color: active ? F.primary : F.muted, fontWeight: active ? "600" : "400", borderBottom: active ? `2px solid ${F.primary}` : "2px solid transparent", marginBottom: "-2px", background: "transparent", outline: "none" } as React.CSSProperties);

  return (
    <div className="max-w-6xl mx-auto">
      {showConfirmDialog && <ConfirmDialog username={username} action={action} system={sys ? `${sys.systemId} / Client ${sys.client}` : "—"} onConfirm={handleConfirm} onCancel={() => setShowConfirmDialog(false)} />}

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1"><Lock size={20} style={{ color: F.primary }} /><h1 className="text-xl font-semibold" style={{ color: F.text }}>Lock / Unlock User</h1></div>
        <p className="text-sm" style={{ color: F.muted }}>Lookup users directly from SAP. Lock runs only after pressing Lock and confirming; unlock is for wrong password lockouts.</p>
      </div>

      <div className="flex gap-0 mb-6" style={{ borderBottom: `2px solid ${F.border}` }}>
        <button id="tab-lock-control" onClick={() => setActiveTab("control")} className="flex items-center gap-2 px-5 py-2.5 text-sm transition-all" style={tabBtn(activeTab === "control")}><Lock size={15} /> User Control</button>
        <button id="tab-lock-history" onClick={() => setActiveTab("history")} className="flex items-center gap-2 px-5 py-2.5 text-sm transition-all" style={tabBtn(activeTab === "history")}><History size={15} /> History</button>
      </div>

      {activeTab === "control" && (
        <>
          {status === "success" && lastAction && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3.5 rounded" style={{ background: "#f1fdf6", border: `1px solid ${F.success}` }}>
              <CheckCircle2 size={18} style={{ color: F.success, flexShrink: 0, marginTop: "2px" }} />
              <div>
                <p className="text-sm" style={{ color: F.success }}>User <strong>{lastAction.username}</strong> successfully <strong>{lastAction.action === "lock" ? "locked" : "unlocked"}</strong> in <strong>{lastAction.system}</strong>.</p>
                <p className="text-xs mt-0.5" style={{ color: F.muted }}>Verified in SAP system and recorded in audit log at {lastAction.verifiedAt || new Date().toLocaleTimeString()}.</p>
              </div>
            </div>
          )}
          {status === "error" && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded" style={{ background: "#fff2f2", border: `1px solid ${F.error}` }}>
              <AlertCircle size={18} style={{ color: F.error, flexShrink: 0, marginTop: "2px" }} />
              <div><p className="text-sm font-medium" style={{ color: F.error }}>{errorMessage || "Operation failed in SAP system."}</p></div>
            </div>
          )}

          <SystemSelector systems={systems} selectedId={selectedSystem} onChange={(id) => { setSelectedSystem(id); setFoundUser(null); setStatus("idle"); }} />
          {errors.system && <p className="flex items-center gap-1 mb-4 text-xs" style={{ color: F.error }}><AlertCircle size={11} /> {errors.system}</p>}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="rounded" style={{ background: F.white, border: `1px solid ${F.border}` }}>
                <div className="px-5 py-3" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}><h3 className="text-sm font-semibold" style={{ color: F.text }}>User Account Control</h3></div>
                <div className="p-5">
                  <div className="mb-5">
                    <label className="block text-sm mb-1" style={{ color: F.muted }}>SAP Username <span style={{ color: F.error }}>*</span></label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          setFoundUser(null);
                          setStatus("idle");
                          if (errors.username) setErrors((errs) => { const n = { ...errs }; delete n.username; return n; });
                        }}
                        onKeyDown={(e) => { if (e.key === "Enter") handleLookup(); }}
                        placeholder="Enter SAP Username"
                        className="flex-1 px-3 py-2 text-sm rounded outline-none"
                        style={{ border: `1px solid ${errors.username ? F.error : F.border}`, background: F.white, color: F.text }}
                      />
                      <button
                        type="button"
                        onClick={handleLookup}
                        disabled={searching || !username.trim()}
                        className="px-4 py-2 text-sm rounded text-white font-medium flex items-center gap-1.5 transition-all shadow-sm"
                        style={{ background: searching ? "#74a8f5" : F.primary, opacity: searching || !username.trim() ? 0.7 : 1 }}
                      >
                        {searching ? (
                          <><span className="animate-spin border-2 border-white border-t-transparent rounded-full w-3.5 h-3.5" /> Searching...</>
                        ) : (
                          <><Search size={15} /> Lookup User</>
                        )}
                      </button>
                    </div>
                    {errors.username && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: F.error }}><AlertCircle size={11} /> {errors.username}</p>}
                    <p className="text-xs mt-1.5" style={{ color: F.muted }}>Lookup only reads SAP status. It will not lock or unlock anything.</p>
                  </div>

                  {foundUser && (
                    <div className="mb-6 p-4 rounded" style={{ background: "#f8fbff", border: `1px solid #0070f230` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm" style={{ color: F.text }}>{foundUser.UserName}</span>
                          <span className="text-xs px-2.5 py-0.5 rounded font-semibold" style={{
                            background: (foundUser.LockStatus || "").toLowerCase() === "locked" ? "#fff2f2" : "#f1fdf6",
                            color: (foundUser.LockStatus || "").toLowerCase() === "locked" ? F.error : F.success,
                            border: `1px solid ${(foundUser.LockStatus || "").toLowerCase() === "locked" ? "#bb000040" : "#107e3e40"}`
                          }}>
                            {(foundUser.LockStatus || "").toLowerCase() === "locked" ? "● Locked in SAP" : "● Unlocked in SAP"}
                          </span>
                        </div>
                        <span className="text-xs font-medium" style={{ color: F.muted }}>System: {foundUser.SystemId || selectedSystem}</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{foundUser.Message || "User verified in live SAP OData Gateway"}</p>
                      <div className="grid grid-cols-2 gap-2 pt-2 text-xs border-t border-blue-100 text-gray-500">
                        <div><span className="font-medium text-gray-700">Department:</span> {foundUser.Department || "N/A"}</div>
                        <div><span className="font-medium text-gray-700">Email:</span> {foundUser.Email || "N/A"}</div>
                      </div>
                    </div>
                  )}

                  {foundUser && (
                    <>
                      <div className="mb-6">
                        <label className="block text-sm mb-2" style={{ color: F.muted }}>Action <span style={{ color: F.error }}>*</span></label>
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => setAction("lock")} className="flex items-center gap-3 p-4 rounded text-left transition-all" style={{ border: `2px solid ${action === "lock" ? F.error : F.border}`, background: action === "lock" ? "#fff2f2" : F.white }}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: action === "lock" ? F.error : "#f5f6f7" }}><Lock size={16} style={{ color: action === "lock" ? "#fff" : F.muted }} /></div>
                            <div><p className="text-sm font-semibold" style={{ color: action === "lock" ? F.error : F.text }}>Lock User</p><p className="text-xs mt-0.5" style={{ color: F.muted }}>Requires clicking Lock and confirming</p></div>
                          </button>
                          <button onClick={() => setAction("unlock")} className="flex items-center gap-3 p-4 rounded text-left transition-all" style={{ border: `2px solid ${action === "unlock" ? F.success : F.border}`, background: action === "unlock" ? "#f1fdf6" : F.white }}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: action === "unlock" ? F.success : "#f5f6f7" }}><Unlock size={16} style={{ color: action === "unlock" ? "#fff" : F.muted }} /></div>
                            <div><p className="text-sm font-semibold" style={{ color: action === "unlock" ? F.success : F.text }}>Unlock User</p><p className="text-xs mt-0.5" style={{ color: F.muted }}>For locked users from wrong password attempts</p></div>
                          </button>
                        </div>
                      </div>

                    </>
                  )}
                </div>
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderTop: `1px solid ${F.border}`, background: "#fafafa" }}>
                  <button onClick={handleReset} className="px-4 py-2 text-sm rounded font-medium" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>Clear</button>
                  <button onClick={handleSubmitClick} disabled={loading || !foundUser} className="flex items-center gap-2 px-5 py-2 text-sm rounded text-white font-medium shadow-sm" style={{ background: loading || !foundUser ? "#a0c4f8" : action === "lock" ? F.error : F.success }}>
                    {loading ? <><span className="animate-spin border-2 border-white border-t-transparent rounded-full w-3.5 h-3.5" /> Applying in SAP...</> : action === "lock" ? <><Lock size={14} /> Lock User</> : <><Unlock size={14} /> Unlock User</>}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <div className="rounded" style={{ background: F.white, border: `1px solid ${F.border}` }}>
                <div className="px-4 py-3" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}><h3 className="text-sm font-semibold" style={{ color: F.text }}>Recent Activity</h3></div>
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
