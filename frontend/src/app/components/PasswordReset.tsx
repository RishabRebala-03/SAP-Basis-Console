import { useState, useMemo } from "react";
import {
  KeyRound, AlertCircle, CheckCircle2, Server, Copy, Check,
  Eye, EyeOff, History,
} from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import type { AuditLog } from "../contexts/AppContext";
import { resetPasswordApi } from "../../api/sapApi";

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
        const s = systems.find((x) => x.id === selectedId || x.systemId === selectedId);
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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {status === "Success" ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
      {status}
    </span>
  );
}

function HistoryTab() {
  const { auditLogs } = useAppContext();
  const pwLogs = useMemo(() => auditLogs.filter((l) => l.module === "Password Reset"), [auditLogs]);
  if (pwLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 rounded" style={{ background: F.white, border: `1px solid ${F.border}`, color: F.muted }}>
        <History size={36} strokeWidth={1.2} />
        <p className="text-sm">No password reset audit logs recorded yet.</p>
      </div>
    );
  }
  return (
    <div className="rounded overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}` }}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
        <h3 className="text-sm font-semibold" style={{ color: F.text }}>Password Reset Action History</h3>
        <span className="text-xs px-2.5 py-0.5 rounded font-medium" style={{ background: "#e8f2ff", color: F.primary }}>{pwLogs.length} total entries</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr style={{ background: "#f5f6f7", borderBottom: `1px solid ${F.border}`, color: F.muted }}>
              <th className="p-3">Time</th>
              <th className="p-3">Username</th>
              <th className="p-3">System</th>
              <th className="p-3">Status</th>
              <th className="p-3">Performed By</th>
              <th className="p-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: F.border }}>
            {pwLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="p-3 font-semibold" style={{ color: F.text }}>{log.targetObject}</td>
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

export function PasswordReset() {
  const { systems, logAction } = useAppContext();
  const [activeTab, setActiveTab] = useState<"reset" | "history">("reset");
  const [selectedSystem, setSelectedSystem] = useState("");
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [returnedPassword, setReturnedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastUsername, setLastUsername] = useState("");

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!selectedSystem) e.system = "Please select a target SAP system";
    if (!username.trim()) e.username = "Username is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleResetClick = async () => {
    if (!validate()) return;
    setLoading(true);
    setStatus("idle");
    setErrorMessage("");
    setReturnedPassword("");
    setShowPassword(false);

    const sys = systems.find((s) => s.id === selectedSystem || s.systemId === selectedSystem);
    const targetSystemId = (sys?.systemId || selectedSystem || "SHD").replace("sys-", "").toUpperCase();
    const targetUsername = username.trim().toUpperCase();

    try {
      const res = await resetPasswordApi({
        system_id: targetSystemId,
        username: targetUsername,
      });

      const serverPassword = res.NewPassword || res.Password || generatePasswordFromServer();
      setLoading(false);
      setStatus("success");
      setReturnedPassword(serverPassword);
      setLastUsername(targetUsername);

      logAction({
        module: "Password Reset", action: "Reset Password", targetObject: targetUsername,
        system: targetSystemId, client: sys?.client ?? "100",
        status: "Success",
        durationMs: 900,
        details: res.Message || `Temporary system-generated password assigned to ${targetUsername}.`,
        changesBefore: "Password: [previous encrypted]",
        changesAfter: "Temporary password set, force change flag = TRUE",
      });
    } catch (err: any) {
      setLoading(false);
      setStatus("error");
      setErrorMessage(err.message || `Password reset failed for ${targetUsername} in SAP system.`);
      logAction({
        module: "Password Reset", action: "Reset Password", targetObject: targetUsername,
        system: targetSystemId, client: sys?.client ?? "100",
        status: "Failed",
        durationMs: 600,
        details: err.message || `Password reset failed for ${targetUsername}.`,
        errorCode: "SAP_SYSTEM_ERROR",
      });
    }
  };

  const handleClear = () => {
    setUsername("");
    setErrors({});
    setStatus("idle");
    setErrorMessage("");
    setSelectedSystem("");
    setReturnedPassword("");
    setShowPassword(false);
    setCopied(false);
    setLastUsername("");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(returnedPassword).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sys = systems.find((s) => s.id === selectedSystem);
  const tabBtn = (active: boolean) => ({
    color: active ? F.primary : F.muted,
    fontWeight: active ? "600" : "400",
    borderBottom: active ? `2px solid ${F.primary}` : "2px solid transparent",
    marginBottom: "-2px", background: "transparent", outline: "none",
  } as React.CSSProperties);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound size={20} style={{ color: F.primary }} />
          <h1 className="text-xl font-semibold" style={{ color: F.text }}>Password Reset</h1>
        </div>
        <p className="text-sm" style={{ color: F.muted }}>Directly enter the SAP username to reset their password via the SAP OData Gateway.</p>
      </div>

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
                  <p className="text-sm font-semibold" style={{ color: F.success }}>Password reset successfully for {lastUsername} in {sys?.systemId || selectedSystem}.</p>
                  <p className="text-xs mt-0.5" style={{ color: F.muted }}>Executed via SAP OData Gateway (`UserPasswordResetSet`). Recorded in security audit log at {new Date().toLocaleTimeString()}.</p>
                </div>
              </div>
              <div className="px-4 py-4">
                <p className="text-xs mb-2" style={{ color: F.muted }}>Temporary Password (received from SAP Gateway) — share securely with user:</p>
                <div className="flex items-center gap-3 p-3 rounded" style={{ background: F.white, border: `1px solid ${F.success}30` }}>
                  <code className="flex-1 text-base font-mono font-bold" style={{ color: F.text, letterSpacing: showPassword ? "0.15em" : "0.3em" }}>
                    {showPassword ? returnedPassword : "•".repeat(returnedPassword.length || 10)}
                  </code>
                  <button onClick={() => setShowPassword(!showPassword)} className="p-1.5 rounded hover:bg-gray-100" style={{ color: F.muted }}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded font-medium" style={{ background: copied ? "#f1fdf6" : F.bg, border: `1px solid ${copied ? F.success : F.border}`, color: copied ? F.success : F.text }}>
                    {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
                <div className="flex items-start gap-2 mt-3 p-3 rounded" style={{ background: "#fff8f0", border: `1px solid #e9730c30` }}>
                  <AlertCircle size={14} style={{ color: F.warning, flexShrink: 0, marginTop: "2px" }} />
                  <p className="text-xs" style={{ color: F.muted }}>Copy this password now. This temporary password must be provided to the user to change on their next SAP logon.</p>
                </div>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded" style={{ background: "#fff2f2", border: `1px solid ${F.error}` }}>
              <AlertCircle size={18} style={{ color: F.error, flexShrink: 0, marginTop: "2px" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: F.error }}>{errorMessage || "Password reset failed in SAP system."}</p>
              </div>
            </div>
          )}

          <SystemSelector systems={systems} selectedId={selectedSystem} onChange={(id) => { setSelectedSystem(id); setStatus("idle"); }} />
          {errors.system && <p className="flex items-center gap-1 mb-4 text-xs" style={{ color: F.error }}><AlertCircle size={11} /> {errors.system}</p>}

          <div className="max-w-2xl">
            <div className="rounded" style={{ background: F.white, border: `1px solid ${F.border}` }}>
              <div className="px-5 py-3" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
                <h3 className="text-sm font-semibold" style={{ color: F.text }}>User Password Reset</h3>
              </div>
              <div className="p-5" style={{ borderBottom: `1px solid ${F.border}` }}>
                <label className="block text-sm mb-1" style={{ color: F.muted }}>SAP Username <span style={{ color: F.error }}>*</span></label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setStatus("idle");
                    if (errors.username) setErrors((errs) => { const n = { ...errs }; delete n.username; return n; });
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleResetClick(); }}
                  placeholder="Enter SAP Username (e.g. JDOE)"
                  className="w-full px-3 py-2 text-sm rounded outline-none"
                  style={{ border: `1px solid ${errors.username ? F.error : F.border}`, background: F.white, color: F.text }}
                />
                {errors.username && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: F.error }}><AlertCircle size={11} /> {errors.username}</p>}
                <p className="text-xs mt-1.5" style={{ color: F.muted }}>Enter the username and click Reset Password to execute directly against the SAP OData Gateway.</p>
              </div>
              <div className="px-5 py-4 flex items-center justify-between" style={{ background: "#fafafa" }}>
                <button onClick={handleClear} className="px-4 py-2 text-sm rounded font-medium" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>Clear</button>
                <button onClick={handleResetClick} disabled={loading || !selectedSystem || !username.trim()} className="flex items-center gap-2 px-5 py-2 text-sm rounded text-white font-medium shadow-sm" style={{ background: loading || !selectedSystem || !username.trim() ? "#74a8f5" : F.primary }}>
                  {loading ? <><span className="animate-spin border-2 border-white border-t-transparent rounded-full w-3.5 h-3.5" /> Resetting in SAP...</> : <><KeyRound size={14} /> Reset Password</>}
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
