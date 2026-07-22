import { useState } from "react";
import { KeyRound, AlertCircle, CheckCircle2, Server, Copy, Check, Eye, EyeOff } from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { ValueHelpInput, MOCK_SAP_USERS } from "./ValueHelpInput";

const F = {
  primary: "#0070f2",
  success: "#107e3e",
  error: "#bb0000",
  warning: "#e9730c",
  text: "#32363a",
  muted: "#74777a",
  border: "#d9d9d9",
  bg: "#f5f6f7",
  white: "#ffffff",
};

// Simulates the password generated and returned by the server in the POST response
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

function SystemSelector({
  systems,
  selectedId,
  onChange,
}: {
  systems: ReturnType<typeof useAppContext>["systems"];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  const active = systems.filter((s) => s.status === "Active");
  return (
    <div
      className="mb-5 flex items-center gap-3 p-3 rounded"
      style={{ background: "#e8f2ff", border: `1px solid #0070f230` }}
    >
      <Server size={15} style={{ color: F.primary, flexShrink: 0 }} />
      <label className="text-sm flex-shrink-0" style={{ color: F.primary }}>
        Target System:
      </label>
      <select
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-3 py-1.5 text-sm rounded outline-none"
        style={{ border: `1px solid #0070f240`, background: F.white, color: F.text }}
      >
        <option value="">— Select SAP System —</option>
        {active.map((s) => (
          <option key={s.id} value={s.id}>
            {s.systemId} – {s.systemName} (Client {s.client})
          </option>
        ))}
      </select>
      {selectedId &&
        (() => {
          const s = systems.find((x) => x.id === selectedId);
          return s ? (
            <span
              className="text-xs px-2 py-0.5 rounded flex-shrink-0"
              style={{
                background:
                  s.environment === "Production"
                    ? "#fff2f2"
                    : s.environment === "Quality"
                    ? "#fff8f0"
                    : "#e8f2ff",
                color:
                  s.environment === "Production"
                    ? F.error
                    : s.environment === "Quality"
                    ? F.warning
                    : F.primary,
              }}
            >
              {s.environment}
            </span>
          ) : null;
        })()}
    </div>
  );
}

export function PasswordReset() {
  const { systems, logAction } = useAppContext();
  const [selectedSystem, setSelectedSystem] = useState("");
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [returnedPassword, setReturnedPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!selectedSystem) e.system = "Please select a target SAP system";
    if (!username.trim()) e.username = "Username is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // POST request — password comes back in the response, not before
  const handleResetClick = async () => {
    if (!validate()) return;

    setLoading(true);
    setStatus("idle");
    setReturnedPassword("");
    setShowPassword(false);

    // Simulate POST /api/reset-password — server responds with temp password
    await new Promise((r) => setTimeout(r, 1500));

    const success = Math.random() > 0.2;
    // Password is generated server-side and returned in the POST response body
    const serverPassword = success ? generatePasswordFromServer() : "";

    setLoading(false);
    setStatus(success ? "success" : "error");
    setReturnedPassword(serverPassword);

    const sys = systems.find((s) => s.id === selectedSystem);
    logAction({
      module: "Password Reset",
      action: "Reset Password",
      targetObject: username,
      system: sys?.systemId ?? "—",
      client: sys?.client ?? "—",
      status: success ? "Success" : "Failed",
      durationMs: Math.floor(600 + Math.random() * 800),
      details: success
        ? `Temporary system-generated password assigned to ${username}. Force change on next logon enabled.`
        : `Password reset failed — ${username} not found in ${sys?.systemId ?? "system"} or authorization error.`,
      errorCode: success ? undefined : "BAPI_USER_NOT_FOUND",
      changesBefore: success ? "Password: [previous encrypted]" : undefined,
      changesAfter: success ? "Temporary password set, force change flag = TRUE" : undefined,
    });
  };

  const handleClear = () => {
    setUsername("");
    setErrors({});
    setStatus("idle");
    setSelectedSystem("");
    setReturnedPassword("");
    setShowPassword(false);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(returnedPassword).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sys = systems.find((s) => s.id === selectedSystem);

  return (
    <div>
      {/* Page heading */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound size={20} style={{ color: F.primary }} />
          <h1 className="text-xl" style={{ color: F.text }}>
            Password Reset
          </h1>
        </div>
        <p className="text-sm" style={{ color: F.muted }}>
          The system will generate a secure temporary password for the selected user.
        </p>
      </div>

      {/* Success banner — shows password returned from POST response */}
      {status === "success" && (
        <div
          className="mb-5 rounded"
          style={{ background: "#f1fdf6", border: `1px solid ${F.success}` }}
        >
          <div
            className="flex items-start gap-3 px-4 py-4"
            style={{ borderBottom: `1px solid #107e3e30` }}
          >
            <CheckCircle2
              size={18}
              style={{ color: F.success, flexShrink: 0, marginTop: "2px" }}
            />
            <div>
              <p className="text-sm" style={{ color: F.success }}>
                Password reset successfully for <strong>{username}</strong> in{" "}
                <strong>{sys?.systemId}</strong>.
              </p>
              <p className="text-xs mt-0.5" style={{ color: F.muted }}>
                User will be forced to change this password on next login. Action recorded in audit
                log.
              </p>
            </div>
          </div>

          {/* Temporary password — received in POST response body */}
          <div className="px-4 py-4">
            <p className="text-xs mb-2" style={{ color: F.muted }}>
              Temporary Password (received from server) — share securely with the user:
            </p>
            <div
              className="flex items-center gap-3 p-3 rounded"
              style={{ background: F.white, border: `1px solid ${F.success}30` }}
            >
              <code
                className="flex-1 text-base"
                style={{
                  color: F.text,
                  fontFamily: "monospace",
                  letterSpacing: showPassword ? "0.15em" : "0.3em",
                }}
              >
                {showPassword ? returnedPassword : "•".repeat(returnedPassword.length)}
              </code>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 rounded hover:bg-gray-100"
                style={{ color: F.muted }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded"
                style={{
                  background: copied ? "#f1fdf6" : F.bg,
                  border: `1px solid ${copied ? F.success : F.border}`,
                  color: copied ? F.success : F.text,
                }}
              >
                {copied ? (
                  <>
                    <Check size={12} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copy
                  </>
                )}
              </button>
            </div>

            {/* Warning note */}
            <div
              className="flex items-start gap-2 mt-3 p-3 rounded"
              style={{ background: "#fff8f0", border: `1px solid #e9730c30` }}
            >
              <AlertCircle
                size={14}
                style={{ color: F.warning, flexShrink: 0, marginTop: "2px" }}
              />
              <p className="text-xs" style={{ color: F.muted }}>
                Copy this password now. This is the only time it will be shown — it is not stored
                and will not be retrievable after leaving this page. The user must change it on
                their first logon.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {status === "error" && (
        <div
          className="mb-5 flex items-start gap-3 px-4 py-3 rounded"
          style={{ background: "#fff2f2", border: `1px solid ${F.error}` }}
        >
          <AlertCircle size={18} style={{ color: F.error, flexShrink: 0, marginTop: "2px" }} />
          <div>
            <p className="text-sm" style={{ color: F.error }}>
              Password reset failed — user not found or insufficient authorization.
            </p>
            <p className="text-xs mt-0.5" style={{ color: F.muted }}>
              Check the audit log for error code BAPI_USER_NOT_FOUND.
            </p>
          </div>
        </div>
      )}

      {/* Target system selector */}
      <SystemSelector systems={systems} selectedId={selectedSystem} onChange={setSelectedSystem} />
      {errors.system && (
        <p className="flex items-center gap-1 mb-4 text-xs" style={{ color: F.error }}>
          <AlertCircle size={11} /> {errors.system}
        </p>
      )}

      {/* User identification form */}
      <div className="max-w-2xl">
        <div className="rounded" style={{ background: F.white, border: `1px solid ${F.border}` }}>
          <div
            className="px-5 py-3"
            style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}
          >
            <h3 className="text-sm" style={{ color: F.text }}>
              User Identification
            </h3>
          </div>
          <div className="p-5" style={{ borderBottom: `1px solid ${F.border}` }}>
            <label className="block text-sm mb-1" style={{ color: F.muted }}>
              Username <span style={{ color: F.error }}>*</span>
            </label>
            <ValueHelpInput
              value={username}
              onChange={(v) => {
                setUsername(v);
                if (errors.username)
                  setErrors((e) => {
                    const n = { ...e };
                    delete n.username;
                    return n;
                  });
              }}
              options={MOCK_SAP_USERS}
              placeholder="Select or search user…"
              error={errors.username}
              emptyMessage="No matching SAP users found."
            />
            <p className="text-xs mt-1.5" style={{ color: F.muted }}>
              Click the F4 button or press F4 to browse all users with search.
            </p>
          </div>

          {/* Footer actions */}
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{ background: "#fafafa" }}
          >
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm rounded"
              style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}
            >
              Clear
            </button>
            <button
              onClick={handleResetClick}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-sm rounded text-white"
              style={{ background: loading ? "#74a8f5" : F.primary }}
            >
              {loading ? (
                <>
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-3.5 h-3.5" />
                  Resetting...
                </>
              ) : (
                <>
                  <KeyRound size={14} /> Reset Password
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
