import { useState } from "react";
import {
  ArrowLeft,
  User,
  Shield,
  Clock,
  Activity,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { getCurrentUser } from "../../../api/authApi";
import { useAppContext } from "../../contexts/AppContext";

const F = {
  primary: "#0070f2",
  success: "#107e3e",
  error: "#bb0000",
  warning: "#e9730c",
  text: "var(--app-text)",
  muted: "var(--app-muted)",
  border: "var(--app-border)",
  bg: "var(--app-bg)",
  white: "var(--app-surface)",
};

type Tab =
  | "overview"
  | "authorizations"
  | "sessions"
  | "activity";

const TABS: {
  id: Tab;
  label: string;
  icon: typeof User;
}[] = [
  {
    id: "overview",
    label: "Overview",
    icon: User,
  },
  {
    id: "authorizations",
    label: "App Permissions",
    icon: Shield,
  },
  {
    id: "sessions",
    label: "Active Sessions",
    icon: Monitor,
  },
  {
    id: "activity",
    label: "Recent Activity",
    icon: Activity,
  },
];

/* ── Role → application permission mapping ── */
const ROLE_PERMISSIONS: Record<
  string,
  {
    label: string;
    desc: string;
    allowed: boolean;
  }[]
> = {
  "Super Admin": [
    {
      label: "Single User Creation",
      desc: "Create individual SAP users",
      allowed: true,
    },
    {
      label: "Bulk User Creation",
      desc: "Import users via Excel",
      allowed: true,
    },
    {
      label: "Password Reset",
      desc: "Reset SAP user passwords",
      allowed: true,
    },
    {
      label: "Lock / Unlock User",
      desc: "Lock or unlock SAP accounts",
      allowed: true,
    },
    {
      label: "Data Management",
      desc: "Manage SAP system registry",
      allowed: true,
    },
    {
      label: "Audit Logs",
      desc: "View and export all activity logs",
      allowed: true,
    },
    {
      label: "Analytics",
      desc: "View usage analytics and charts",
      allowed: true,
    },
    {
      label: "Settings",
      desc: "Change application preferences",
      allowed: true,
    },
  ],

  "Basis Admin": [
    {
      label: "Single User Creation",
      desc: "Create individual SAP users",
      allowed: true,
    },
    {
      label: "Bulk User Creation",
      desc: "Import users via Excel",
      allowed: true,
    },
    {
      label: "Password Reset",
      desc: "Reset SAP user passwords",
      allowed: true,
    },
    {
      label: "Lock / Unlock User",
      desc: "Lock or unlock SAP accounts",
      allowed: true,
    },
    {
      label: "Data Management",
      desc: "Manage SAP system registry",
      allowed: false,
    },
    {
      label: "Audit Logs",
      desc: "View and export all activity logs",
      allowed: true,
    },
    {
      label: "Analytics",
      desc: "View usage analytics and charts",
      allowed: true,
    },
    {
      label: "Settings",
      desc: "Change application preferences",
      allowed: true,
    },
  ],

  Viewer: [
    {
      label: "Single User Creation",
      desc: "Create individual SAP users",
      allowed: false,
    },
    {
      label: "Bulk User Creation",
      desc: "Import users via Excel",
      allowed: false,
    },
    {
      label: "Password Reset",
      desc: "Reset SAP user passwords",
      allowed: false,
    },
    {
      label: "Lock / Unlock User",
      desc: "Lock or unlock SAP accounts",
      allowed: false,
    },
    {
      label: "Data Management",
      desc: "Manage SAP system registry",
      allowed: false,
    },
    {
      label: "Audit Logs",
      desc: "View and export all activity logs",
      allowed: true,
    },
    {
      label: "Analytics",
      desc: "View usage analytics and charts",
      allowed: true,
    },
    {
      label: "Settings",
      desc: "Change application preferences",
      allowed: true,
    },
  ],
};

export function ProfilePage({
  onBack,
}: {
  onBack: () => void;
}) {
  const user = getCurrentUser();
  const { auditLogs } = useAppContext();

  const username = user?.username || "Unknown";
  const email = user?.email || "—";
  const role = user?.role || "Viewer";
  const initials = username.substring(0, 2).toUpperCase();

  const [tab, setTab] = useState<Tab>("overview");

  /* ── Sessions — endpoint not available; show placeholder ── */
  const sessions: any[] = [];
  const sessionsLoading = false;
  const sessionsError = "";

  /* ── Activity from real audit logs, filtered by this user ── */
  const myActivity = auditLogs
    .filter(
      (l) =>
        l.performedBy.toLowerCase() ===
        username.toLowerCase()
    )
    .slice(0, 20);

  const todayActions = auditLogs.filter((l) => {
    const dayStart = new Date();

    dayStart.setHours(0, 0, 0, 0);

    return (
      l.performedBy.toLowerCase() ===
        username.toLowerCase() &&
      new Date(l.timestamp) >= dayStart
    );
  }).length;

  const usersManaged = auditLogs.filter(
    (l) =>
      l.performedBy.toLowerCase() ===
        username.toLowerCase() &&
      [
        "Create User",
        "Bulk Import",
        "Lock User",
        "Unlock User",
        "Reset Password",
      ].includes(l.action)
  ).length;

  /* ── Role permissions ── */
  const permissions =
    ROLE_PERMISSIONS[role] ??
    ROLE_PERMISSIONS["Viewer"];

  return (
    <div
      className="min-h-full"
      style={{ background: F.bg }}
    >
      {/* =========================================================
          PAGE HEADER
      ========================================================= */}
      <div
        className="px-6 py-3 flex items-center gap-3"
        style={{
          background: F.white,
          borderBottom: `1px solid ${F.border}`,
        }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded"
          style={{
            border: `1px solid ${F.border}`,
            background: F.white,
            color: F.text,
          }}
        >
          <ArrowLeft size={14} />
          Back to Console
        </button>

        <div
          className="h-4 w-px"
          style={{ background: F.border }}
        />

        <span
          className="text-sm"
          style={{ color: F.muted }}
        >
          SAP Basis
        </span>

        <span
          className="text-sm"
          style={{ color: F.muted }}
        >
          /
        </span>

        <span
          className="text-sm"
          style={{ color: F.text }}
        >
          My Profile
        </span>
      </div>

      {/* =========================================================
          PROFILE HERO
      ========================================================= */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #1d2d3e 0%, #0d1e2e 100%)",
          borderBottom: `1px solid ${F.border}`,
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white flex-shrink-0"
              style={{
                background: F.primary,
                fontSize: "28px",
                fontWeight: 600,
                border:
                  "3px solid rgba(255,255,255,0.15)",
              }}
            >
              {initials}
            </div>

            {/* User Information */}
            <div className="flex-1">
              <h1 className="text-2xl text-white">
                {username}
              </h1>

              <p
                className="text-sm mt-0.5"
                style={{
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                {email}
              </p>

              <p
                className="text-sm mt-0.5"
                style={{
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                {role} · SAP Basis Console
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                {permissions
                  .filter((p) => p.allowed)
                  .slice(0, 5)
                  .map((p) => (
                    <span
                      key={p.label}
                      className="px-2 py-0.5 rounded text-xs"
                      style={{
                        background:
                          "rgba(255,255,255,0.1)",
                        color:
                          "rgba(255,255,255,0.75)",
                      }}
                    >
                      {p.label}
                    </span>
                  ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-2 sm:mt-0">
              {[
                {
                  label: "Actions Today",
                  value: String(todayActions),
                },
                {
                  label: "Users Managed",
                  value: String(usersManaged),
                },
                {
                  label: "Active Sessions",
                  value: sessionsLoading
                    ? "…"
                    : String(sessions.length),
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="text-center"
                >
                  <p className="text-2xl text-white">
                    {s.value}
                  </p>

                  <p
                    className="text-xs mt-0.5"
                    style={{
                      color:
                        "rgba(255,255,255,0.45)",
                    }}
                  >
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* =========================================================
            TAB BAR
        ========================================================= */}
        <div className="max-w-6xl mx-auto px-6 flex gap-0">
          {TABS.map((t) => {
            const isActive = tab === t.id;

            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-4 py-3 text-sm transition-colors border-b-2"
                style={{
                  borderColor: isActive
                    ? F.primary
                    : "transparent",
                  color: isActive
                    ? "#fff"
                    : "rgba(255,255,255,0.5)",
                  background: isActive
                    ? "rgba(255,255,255,0.05)"
                    : "transparent",
                }}
              >
                <t.icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================
          TAB CONTENT
      ========================================================= */}
      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* =======================================================
            OVERVIEW
        ======================================================= */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ===================================================
                ACCOUNT INFORMATION
                ORIGINAL 2/3 WIDTH - UNCHANGED
            =================================================== */}
            <div className="lg:col-span-2">
              <div
                className="rounded overflow-hidden h-full"
                style={{
                  background: F.white,
                  border: `1px solid ${F.border}`,
                }}
              >
                <div
                  className="px-5 py-3 flex items-center gap-2"
                  style={{
                    borderBottom:
                      `1px solid ${F.border}`,
                    
  color: "#ffffff",
  background: "#1d2d3e",
}}
                  
                >
                  <User
                    size={14}
                    style={{ color: "white" }}
                  />

                  <h3
                    className="text-sm"
                    style={{ color: "white" }}
                  >
                    Account Information
                  </h3>
                </div>

                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    ["User ID", username],
                    ["Email Address", email],
                    ["Role", role],
                    [
                      "Account Type",
                      role === "Super Admin"
                        ? "Administrator"
                        : role === "Basis Admin"
                        ? "Operator"
                        : "Read-Only",
                    ],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="p-3 rounded"
                      style={{
                        background: F.bg,
                        border:
                          `1px solid ${F.border}`,
                      }}
                    >
                      <p
                        className="text-xs mb-0.5"
                        style={{ color: F.muted }}
                      >
                        {k}
                      </p>

                      <p
                        className="text-sm"
                        style={{ color: F.text }}
                      >
                        {v}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ===================================================
                RIGHT SIDE
                ONLY THESE TWO ARE NOW SIDE-BY-SIDE
            =================================================== */}
            <div className="lg:col-span-1 grid grid-cols-2 gap-4 min-w-135">

              {/* =================================================
                  ACCOUNT STATUS
              ================================================= */}
              <div
                className="rounded overflow-hidden h-full min-w-0"
                style={{
                  background: F.white,
                  border:
                    `1px solid ${F.border}`,
                }}
              >
                <div
                  className="px-4 py-3 flex items-center gap-2"
                  style={{
                    borderBottom:
                      `1px solid ${F.border}`,
                    background: "#fafafa",
                   
  color: "#ffffff",
  background: "#1d2d3e",
}}
                
                >
                  <Shield
                    size={14}
                    style={{ color: "white" }}
                  />

                  <h3
                    className="text-sm truncate"
                    style={{ color: "white" }}
                  >
                    Account Status
                  </h3>
                </div>

                <div className="p-4 flex flex-col gap-4">

                  <div>
                    <p
                      className="text-xs"
                      style={{ color: F.muted }}
                    >
                      Status
                    </p>

                    <p
                      className="text-sm mt-1"
                      style={{
                        color: F.success,
                      }}
                    >
                      Active
                    </p>
                  </div>

                  <div>
                    <p
                      className="text-xs"
                      style={{ color: F.muted }}
                    >
                      Role
                    </p>

                    <p
                      className="text-sm mt-1"
                      style={{
                        color: F.primary,
                      }}
                    >
                      {role}
                    </p>
                  </div>

                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "white" }}
                    >
                      Active Sessions
                    </p>

                    <p
                      className="text-sm mt-1"
                      style={{ color: F.text }}
                    >
                      {sessionsLoading
                        ? "Loading…"
                        : String(
                            sessions.length
                          )}
                    </p>
                  </div>

                </div>
              </div>

              {/* =================================================
                  RECENT LOGONS
              ================================================= */}
              <div
                className="rounded overflow-hidden h-full min-w-0"
                style={{
                  background: F.white,
                  border:
                    `1px solid ${F.border}`,
                }}
              >
                <div
                  className="px-4 py-3 flex items-center gap-2"
                  style={{
                    borderBottom:
                      `1px solid ${F.border}`,
                    background: "#fafafa",
                   
  color: "#ffffff",
  background: "#1d2d3e",

                  }}
                >
                  <Clock
                    size={14}
                    style={{ color: "white" }}
                  />

                  <h3
                    className="text-sm truncate"
                    style={{ color: "white" }}
                  >
                    Recent Logons
                  </h3>
                </div>

                <div className="p-4 flex flex-col gap-3">

                  {sessionsLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2
                        size={14}
                        className="animate-spin"
                        style={{
                          color: F.primary,
                        }}
                      />

                      <span
                        className="text-xs"
                        style={{
                          color: F.muted,
                        }}
                      >
                        Loading sessions…
                      </span>
                    </div>

                  ) : sessionsError ? (
                    <div className="flex items-center gap-2">
                      <AlertCircle
                        size={14}
                        style={{
                          color: F.error,
                        }}
                      />

                      <span
                        className="text-xs"
                        style={{
                          color: F.error,
                        }}
                      >
                        {sessionsError}
                      </span>
                    </div>

                  ) : sessions.length === 0 ? (
                    <div>
                      <p
                        className="text-xs"
                        style={{
                          color: F.muted,
                        }}
                      >
                        No active sessions
                        found.
                      </p>

                      <p
                        className="text-[11px] mt-1"
                        style={{
                          color: F.muted,
                          opacity: 0.75,
                        }}
                      >
                        Your current
                        session is active.
                      </p>
                    </div>

                  ) : (
                    sessions.map((s, i) => (
                      <div
                        key={s._id || i}
                        className="flex items-start gap-2"
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                          style={{
                            background:
                              i === 0
                                ? F.success
                                : F.border,
                          }}
                        />

                        <div className="flex-1 min-w-0">
                          <p
                            className="text-xs"
                            style={{
                              color: F.text,
                            }}
                          >
                            {s.created_at
                              ? new Date(
                                  s.created_at
                                ).toLocaleString()
                              : "Recent"}
                          </p>

                          <p
                            className="text-[11px] truncate"
                            style={{
                              color: F.muted,
                            }}
                          >
                            {s.ip_address ||
                              "—"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}

                </div>
              </div>

            </div>
          </div>
        )}

        {/* =======================================================
            APP PERMISSIONS
        ======================================================= */}
        {tab === "authorizations" && (
          <div
            className="rounded overflow-hidden"
            style={{
              background: F.white,
              border:
                `1px solid ${F.border}`,
            }}
          >
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{
                borderBottom:
                  `1px solid ${F.border}`,
                background: "#fafafa",
                color: "#ffffff",
  background: "#1d2d3e",
              }}
            >
              <div className="flex items-center gap-2">
                <Shield
                  size={14}
                  style={{ color: "white" }}
                />

                <h3
                  className="text-sm"
                  style={{ color: "white" }}
                >
                  Application Permissions —{" "}
                  {role}
                </h3>
              </div>

              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  background: "#e8f2ff",
                  color: F.primary,
                }}
              >
                {
                  permissions.filter(
                    (p) => p.allowed
                  ).length
                }{" "}
                / {permissions.length} granted
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    style={{
                      background: F.bg,
                      borderBottom:
                        `1px solid ${F.border}`,
                    }}
                  >
                    {[
                      "Module",
                      "Description",
                      "Access",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs"
                        style={{
                          color: F.muted,
                          fontWeight: 600,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {permissions.map(
                    (perm, i) => (
                      <tr
                        key={perm.label}
                        style={{
                          borderBottom:
                            `1px solid ${F.border}`,
                          background:
                            i % 2 === 0
                              ? F.white
                              : "#fafafa",
                        }}
                      >
                        <td className="px-5 py-3">
                          <span
                            className="px-2 py-0.5 rounded text-xs"
                            style={{
                              background:
                                "#e8f2ff",
                              color:
                                F.primary,
                            }}
                          >
                            {perm.label}
                          </span>
                        </td>

                        <td
                          className="px-5 py-3 text-xs"
                          style={{
                            color: F.text,
                          }}
                        >
                          {perm.desc}
                        </td>

                        <td className="px-5 py-3">
                          {perm.allowed ? (
                            <span
                              className="flex items-center gap-1.5 text-xs"
                              style={{
                                color:
                                  F.success,
                              }}
                            >
                              <CheckCircle2
                                size={13}
                              />
                              Granted
                            </span>
                          ) : (
                            <span
                              className="flex items-center gap-1.5 text-xs"
                              style={{
                                color:
                                  F.muted,
                              }}
                            >
                              <AlertCircle
                                size={13}
                              />
                              Not Granted
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =======================================================
            ACTIVE SESSIONS
        ======================================================= */}
        {tab === "sessions" && (
          <div
            className="rounded overflow-hidden"
            style={{
              background: F.white,
              border:
                `1px solid ${F.border}`,
                
            }}
          >
            <div
              className="px-5 py-3 flex items-center gap-2"
              style={{
                borderBottom:
                  `1px solid ${F.border}`,
                
                color: "#ffffff",
  background: "#1d2d3e",
              }}
            >
              <Monitor
                size={14}
                style={{ color: "white" }}
              />

              <h3
                className="text-sm"
                style={{ color: "white" }}
              >
                Active Sessions
              </h3>
            </div>

            <div className="px-5 py-8 text-center">
              <p
                className="text-sm"
                style={{ color: F.text }}
              >
                Your current session is active.
              </p>

              <p
                className="text-xs mt-1"
                style={{ color: F.muted }}
              >
                Session management via the
                console is not yet available.
              </p>
            </div>
          </div>
        )}

        {/* =======================================================
            RECENT ACTIVITY
        ======================================================= */}
        {tab === "activity" && (
          <div
            className="rounded overflow-hidden"
            style={{
              background: F.white,
              border:
                `1px solid ${F.border}`,
            }}
          >
            <div
              className="px-5 py-3 flex items-center gap-2"
              style={{
                borderBottom:
                  `1px solid ${F.border}`,
                
                color: "#ffffff",
  background: "#1d2d3e",
              }}
            >
              <Activity
                size={14}
                style={{ color: "white" }}
              />

              <h3
                className="text-sm"
                style={{ color: "white" }}
              >
                Recent Activity — {username}
              </h3>

              <span
                className="ml-auto text-xs px-2 py-0.5 rounded"
                style={{
                  background: "#e8f2ff",
                  color: F.primary,
                }}
              >
                {myActivity.length} events
              </span>
            </div>

            <div>
              {myActivity.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p
                    className="text-sm"
                    style={{ color: F.text }}
                  >
                    No activity recorded yet
                  </p>

                  <p
                    className="text-xs mt-1"
                    style={{ color: F.muted }}
                  >
                    Actions you perform will
                    appear here in real-time.
                  </p>
                </div>
              ) : (
                myActivity.map((item, i) => {
                  const isSuccess =
                    item.status ===
                    "Success";

                  const isFailed =
                    item.status === "Failed";

                  const statusColor =
                    isSuccess
                      ? F.success
                      : isFailed
                      ? F.error
                      : F.warning;

                  const statusBg =
                    isSuccess
                      ? "#f1fdf6"
                      : isFailed
                      ? "#fff2f2"
                      : "#fff8f0";

                  return (
                    <div
                      key={item.id}
                      className="px-5 py-3.5 flex items-center gap-4"
                      style={{
                        borderBottom:
                          i <
                          myActivity.length - 1
                            ? `1px solid ${F.border}`
                            : "none",
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: F.bg,
                        }}
                      >
                        {isSuccess ? (
                          <CheckCircle2
                            size={14}
                            style={{
                              color:
                                F.success,
                            }}
                          />
                        ) : (
                          <AlertCircle
                            size={14}
                            style={{
                              color:
                                statusColor,
                            }}
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm"
                          style={{
                            color: F.text,
                          }}
                        >
                          {item.action}
                        </p>

                        <p
                          className="text-xs mt-0.5 truncate"
                          style={{
                            color: F.muted,
                          }}
                        >
                          Target:{" "}
                          <span className="font-mono">
                            {
                              item.targetObject
                            }
                          </span>

                          {item.system !==
                            "—" &&
                            ` · System: ${item.system}`}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p
                          className="text-xs"
                          style={{
                            color: F.muted,
                          }}
                        >
                          {new Date(
                            item.timestamp
                          ).toLocaleString()}
                        </p>

                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            background:
                              statusBg,
                            color:
                              statusColor,
                          }}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}