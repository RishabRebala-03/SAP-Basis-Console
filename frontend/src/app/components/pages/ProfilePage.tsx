import { useState } from "react";
import { ArrowLeft, User, Shield, Clock, Activity, Key, Monitor, ChevronRight, CheckCircle2, AlertCircle, Lock } from "lucide-react";

const F = {
  primary: "#0070f2", success: "#107e3e", error: "#bb0000",
  warning: "#e9730c", text: "var(--app-text)", muted: "var(--app-muted)",
  border: "var(--app-border)", bg: "var(--app-bg)", white: "var(--app-surface)",
};

type Tab = "overview" | "authorizations" | "sessions" | "activity";

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "overview",       label: "Overview",        icon: User     },
  { id: "authorizations", label: "Authorizations",  icon: Shield   },
  { id: "sessions",       label: "Active Sessions", icon: Monitor  },
  { id: "activity",       label: "Recent Activity", icon: Activity },
];

const AUTH_OBJECTS = [
  { object: "S_USER_GRP",  desc: "User Maintenance: Assign Auth Group",  activities: ["01 Create", "02 Change", "06 Delete"] },
  { object: "S_USR_ADM",   desc: "Central User Administration",           activities: ["01 Create", "02 Change", "05 Lock/Unlock"] },
  { object: "S_TCODE",     desc: "Transaction Code Check",               activities: ["SU01", "SU10", "SM30", "SM50"] },
  { object: "S_RFC",       desc: "RFC Access",                           activities: ["FUGR RFC_METADATA", "FUNC RFC_READ"] },
  { object: "S_ADMI_FCD",  desc: "System Administration Functions",      activities: ["SP01 Spool", "SM21 Log"] },
  { object: "S_CTS_ADMI",  desc: "Administration for Change & Transport", activities: ["CTS_ADMIN"] },
];

const INITIAL_SESSIONS = [
  { id: "SES-A4B7C2D1", type: "Current", client: "100", system: "EMP", ip: "10.42.8.201", logon: "Today 08:30", terminal: "WIN-CORP-001", status: "active" as const },
  { id: "SES-9F3D1A88", type: "Remote", client: "100", system: "SHD", ip: "10.42.8.214", logon: "Today 07:55", terminal: "WIN-CORP-014", status: "active" as const },
];

const ACTIVITY = [
  { action: "Create User",    target: "ALICE.SMITH",  system: "PRD", time: "09:15", status: "success" as const },
  { action: "Lock User",      target: "BOB.JONES",    system: "PRD", time: "09:02", status: "success" as const },
  { action: "Bulk Import",    target: "6 records",    system: "QAS", time: "08:47", status: "warning" as const },
  { action: "Reset Password", target: "CAROL.WHITE",  system: "PRD", time: "08:30", status: "success" as const },
  { action: "Create User",    target: "EVE.TAYLOR",   system: "DEV", time: "Yesterday", status: "error" as const },
];

export function ProfilePage({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [sessionActionMessage, setSessionActionMessage] = useState("");

  const handleTerminateAllOtherSessions = () => {
    const currentSession = sessions.find((s) => s.type === "Current");
    const remainingSessions = currentSession ? [currentSession] : sessions.slice(0, 1);
    setSessions(remainingSessions);
    setSessionActionMessage("All other sessions have been terminated.");
  };

  const handleTerminateSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setSessionActionMessage(`Session ${id} terminated.`);
  };

  return (
    <div className="min-h-full" style={{ background: F.bg }}>
      {/* Page Header */}
      <div className="px-6 py-3 flex items-center gap-3" style={{ background: F.white, borderBottom: `1px solid ${F.border}` }}>
        <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded" style={{ border: `1px solid ${F.border}`, background: F.white, color: F.text }}>
          <ArrowLeft size={14} /> Back to Console
        </button>
        <div className="h-4 w-px" style={{ background: F.border }} />
        <span className="text-sm" style={{ color: F.muted }}>SAP Basis</span>
        <span className="text-sm" style={{ color: F.muted }}>/</span>
        <span className="text-sm" style={{ color: F.text }}>My Profile</span>
      </div>

      {/* Profile Hero */}
      <div style={{ background: "linear-gradient(135deg, #1d2d3e 0%, #0d1e2e 100%)", borderBottom: `1px solid ${F.border}` }}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ background: F.primary, fontSize: "28px", fontWeight: 600, border: "3px solid rgba(255,255,255,0.15)" }}>
              AD
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl text-white">ADMIN</h1>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>admin@corp.local</p>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>SAP Basis Administrator · All Systems</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {["S_USER_GRP", "S_USR_ADM", "S_TCODE", "S_RFC", "S_ADMI_FCD"].map((r) => (
                  <span key={r} className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.75)" }}>{r}</span>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-2 sm:mt-0">
              {[
                { label: "Actions Today", value: "0" },
                { label: "Users Managed", value: "0" },
                { label: "Sessions", value: String(sessions.length) },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl text-white">{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="max-w-6xl mx-auto px-6 flex gap-0">
          {TABS.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-4 py-3 text-sm transition-colors border-b-2"
                style={{
                  borderColor: isActive ? F.primary : "transparent",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                  background: isActive ? "rgba(255,255,255,0.05)" : "transparent",
                }}
              >
                <t.icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Overview */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Personal Details */}
            <div className="lg:col-span-2">
              <div className="rounded overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}` }}>
                <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
                  <User size={14} style={{ color: F.muted }} />
                  <h3 className="text-sm" style={{ color: F.text }}>Personal Details</h3>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    ["User ID",      "ADMIN"],
                    ["Full Name",    "System Administrator"],
                    ["Email",        "admin@corp.local"],
                    ["Department",   "IT / SAP Basis"],
                    ["Job Title",    "SAP Basis Administrator"],
                    ["Employee No.", "EMP-001"],
                    ["Cost Centre",  "CC-IT-8801"],
                    ["Location",     "London, UK"],
                  ].map(([k, v]) => (
                    <div key={k} className="p-3 rounded" style={{ background: F.bg, border: `1px solid ${F.border}` }}>
                      <p className="text-xs mb-0.5" style={{ color: F.muted }}>{k}</p>
                      <p className="text-sm" style={{ color: F.text }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar info */}
            <div className="flex flex-col gap-4">
              {/* Account Status */}
              <div className="rounded overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}` }}>
                <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
                  <Shield size={14} style={{ color: F.muted }} />
                  <h3 className="text-sm" style={{ color: F.text }}>Account Status</h3>
                </div>
                <div className="p-5 flex flex-col gap-3">
                  {[
                    { label: "Account Status",   value: "Active",    color: F.success },
                    { label: "User Type",         value: "Dialog",    color: F.primary },
                    { label: "Valid From",         value: "01/01/2026", color: F.text },
                    { label: "Valid To",           value: "31/12/2026", color: F.text },
                    { label: "Password Expires",  value: "90 days",  color: F.warning },
                    { label: "Failed Logins",     value: "0",         color: F.success },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: F.muted }}>{item.label}</span>
                      <span className="text-xs" style={{ color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Last Logons */}
              <div className="rounded overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}` }}>
                <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
                  <Clock size={14} style={{ color: F.muted }} />
                  <h3 className="text-sm" style={{ color: F.text }}>Last Logons</h3>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  {sessions.map((l, i) => (
                    <div key={l.id} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: i === 0 ? F.success : F.border }} />
                      <div className="flex-1">
                        <p className="text-xs" style={{ color: F.text }}>{l.time}</p>
                        <p className="text-xs" style={{ color: F.muted }}>{l.ip} · {l.system}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Authorizations */}
        {tab === "authorizations" && (
          <div className="rounded overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}` }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
              <div className="flex items-center gap-2"><Shield size={14} style={{ color: F.muted }} /><h3 className="text-sm" style={{ color: F.text }}>Assigned Authorization Objects</h3></div>
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#e8f2ff", color: F.primary }}>{AUTH_OBJECTS.length} objects</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: F.bg, borderBottom: `1px solid ${F.border}` }}>
                    {["Authorization Object", "Description", "Permitted Activities"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs" style={{ color: F.muted, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AUTH_OBJECTS.map((obj, i) => (
                    <tr key={obj.object} style={{ borderBottom: `1px solid ${F.border}`, background: i % 2 === 0 ? F.white : "#fafafa" }}>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ background: "#e8f2ff", color: F.primary }}>{obj.object}</span>
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: F.text }}>{obj.desc}</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {obj.activities.map((a) => (
                            <span key={a} className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#f1fdf6", color: F.success }}>{a}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sessions */}
        {tab === "sessions" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm" style={{ color: F.muted }}>{sessions.length} active session(s)</p>
              <button
                type="button"
                onClick={handleTerminateAllOtherSessions}
                disabled={sessions.length <= 1}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded transition-colors"
                style={{
                  border: `1px solid ${sessions.length > 1 ? F.error : F.border}`,
                  color: sessions.length > 1 ? F.error : F.muted,
                  background: sessions.length > 1 ? F.white : F.bg,
                  cursor: sessions.length > 1 ? "pointer" : "not-allowed",
                }}
              >
                <Lock size={13} /> Terminate All Other Sessions
              </button>
            </div>
            {sessionActionMessage && (
              <div className="rounded px-4 py-3 text-sm" style={{ background: "#f1fdf6", border: `1px solid ${F.success}25`, color: F.success }}>
                {sessionActionMessage}
              </div>
            )}
            {sessions.map((s) => (
              <div key={s.id} className="rounded overflow-hidden" style={{ background: F.white, border: `1px solid ${s.status === "active" ? F.success : F.border}` }}>
                <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${F.border}`, background: s.status === "active" ? "#f1fdf6" : "#fafafa" }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: s.status === "active" ? F.success : F.warning }} />
                  <span className="text-sm" style={{ color: F.text }}>{s.type} Session</span>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded" style={{ background: s.status === "active" ? "#f1fdf6" : "#fff8f0", color: s.status === "active" ? F.success : F.warning }}>
                    {s.status === "active" ? "Active" : "Idle"}
                  </span>
                  {s.type !== "Current" && (
                    <button
                      type="button"
                      onClick={() => handleTerminateSession(s.id)}
                      className="text-xs px-2 py-0.5 rounded transition-colors"
                      style={{ border: `1px solid ${F.error}`, color: F.error, background: F.white }}
                    >
                      Terminate
                    </button>
                  )}
                </div>
                <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    ["Session ID",  s.id],
                    ["System",      `${s.system} / ${s.client}`],
                    ["IP Address",  s.ip],
                    ["Logged In",   s.logon],
                    ["Terminal",    s.terminal],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-xs mb-0.5" style={{ color: F.muted }}>{k}</p>
                      <p className="text-sm font-mono" style={{ color: F.text }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Activity */}
        {tab === "activity" && (
          <div className="rounded overflow-hidden" style={{ background: F.white, border: `1px solid ${F.border}` }}>
            <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${F.border}`, background: "#fafafa" }}>
              <Activity size={14} style={{ color: F.muted }} />
              <h3 className="text-sm" style={{ color: F.text }}>Recent Actions (Today)</h3>
            </div>
            <div className="divide-y" style={{ borderColor: F.border }}>
              {ACTIVITY.map((item, i) => {
                const statusMap = { success: { icon: <CheckCircle2 size={14} style={{ color: F.success }} />, color: F.success }, warning: { icon: <AlertCircle size={14} style={{ color: F.warning }} />, color: F.warning }, error: { icon: <AlertCircle size={14} style={{ color: F.error }} />, color: F.error } };
                const s = statusMap[item.status];
                return (
                  <div key={i} className="px-5 py-3.5 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: F.bg }}>{s.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: F.text }}>{item.action}</p>
                      <p className="text-xs mt-0.5" style={{ color: F.muted }}>
                        Target: <span className="font-mono">{item.target}</span> · System: {item.system}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs" style={{ color: F.muted }}>{item.time}</p>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: item.status === "success" ? "#f1fdf6" : item.status === "warning" ? "#fff8f0" : "#fff2f2", color: s.color }}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
