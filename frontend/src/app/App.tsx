import { useState, useRef, useEffect } from "react";
<<<<<<< Updated upstream
import { Users, UserPlus, Upload, KeyRound, Lock, ChevronRight, Bell, Settings, Menu, X, Database, ClipboardList, CheckCircle2, AlertCircle, Info, User, LogOut, LayoutDashboard, BarChart3 } from "lucide-react";
=======
import {
  UserPlus,
  Upload,
  KeyRound,
  Lock,
  ChevronRight,
  Bell,
  Settings,
  Menu,
  Database,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Info,
  User,
  LogOut,
  LayoutDashboard,
  BarChart3,
  Trash2,
  Users,
} from "lucide-react";

>>>>>>> Stashed changes
import { AppProvider } from "./contexts/AppContext";
import { AuditLog, SapSystem } from "./contexts/AppContext";
import { SingleUserCreation } from "./components/SingleUserCreation";
import { BulkUserCreation } from "./components/BulkUserCreation";
import { PasswordReset } from "./components/PasswordReset";
import { LockUnlockUser } from "./components/LockUnlockUser";
import { DataManagement } from "./components/DataManagement";
import { AuditLogs } from "./components/AuditLogs";
import { AuditDetailPage } from "./components/pages/AuditDetailPage";
import {
  SettingsPage,
  DEFAULT_SETTINGS,
  AppSettings,
} from "./components/pages/SettingsPage";
import { ProfilePage } from "./components/pages/ProfilePage";
import { SystemDetailPage } from "./components/pages/SystemDetailPage";
import { SignInPage } from "./components/pages/SignInPage";
import { Dashboard } from "./components/Dashboard";
import { Analytics } from "./components/Analytics";
<<<<<<< Updated upstream
=======
import {
  logoutApi,
  getCurrentUser,
  User as AuthUser,
} from "../api/authApi";
import logoImage from "../imports/image.png";
>>>>>>> Stashed changes

type ActiveView =
  | "dashboard"
  | "analytics"
  | "single-user"
  | "bulk-user"
  | "password-reset"
  | "lock-unlock"
  | "data-management"
  | "audit-logs";

type PageView =
  | { type: "main" }
  | { type: "settings" }
  | { type: "profile" }
  | { type: "audit-detail"; log: AuditLog }
  | { type: "system-detail"; system: SapSystem };

/* =========================================================
   NAVIGATION GROUPS
========================================================= */

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      {
        id: "dashboard" as ActiveView,
        label: "Dashboard",
        icon: LayoutDashboard,
      },
      {
        id: "analytics" as ActiveView,
        label: "Analytics",
        icon: BarChart3,
      },
    ],
  },

  {
    label: "User Management",
    items: [
<<<<<<< Updated upstream
      { id: "single-user" as ActiveView, label: "Single User Creation", icon: UserPlus },
      { id: "bulk-user" as ActiveView, label: "Bulk User Creation", icon: Upload },
      { id: "password-reset" as ActiveView, label: "Password Reset", icon: KeyRound },
      { id: "lock-unlock" as ActiveView, label: "Lock / Unlock User", icon: Lock },
=======
      {
        id: "single-user" as ActiveView,
        label: "Single User",
        icon: UserPlus,
      },
      {
        id: "bulk-user" as ActiveView,
        label: "Bulk User",
        icon: Users,
      },
      {
        id: "password-reset" as ActiveView,
        label: "Password Reset",
        icon: KeyRound,
      },
      {
        id: "lock-unlock" as ActiveView,
        label: "Lock / Unlock",
        icon: Lock,
      },
>>>>>>> Stashed changes
    ],
  },

  {
    label: "Administration",
    items: [
      {
        id: "data-management" as ActiveView,
        label: "Data Management",
        icon: Database,
      },
      {
        id: "audit-logs" as ActiveView,
        label: "Audit Logs",
        icon: ClipboardList,
      },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

<<<<<<< Updated upstream
/* ── Notification data ── */
interface Notification { id: string; type: "warning" | "info" | "success" | "error"; title: string; body: string; time: string; read: boolean; }
const INITIAL_NOTIFS: Notification[] = [
  { id: "n1", type: "warning", title: "3 users pending activation", body: "Users provisioned today are awaiting role assignment in PRD/100.", time: "2 min ago", read: false },
  { id: "n2", type: "error",   title: "Failed bulk import detected", body: "2 records failed in the last bulk user creation job (QAS/200).", time: "1 hr ago", read: false },
  { id: "n3", type: "info",    title: "System SBX: Scheduled maintenance", body: "SBX environment will be unavailable Sat 02:00–06:00 UTC.", time: "3 hrs ago", read: false },
  { id: "n4", type: "success", title: "Password policy updated", body: "Minimum length increased to 10 characters effective today.", time: "Yesterday", read: true },
  { id: "n5", type: "info",    title: "New system BW1 registered", body: "SAP BW Production system was added to the system registry.", time: "2 days ago", read: true },
];
=======
/* =========================================================
   NOTIFICATION DATA
========================================================= */

interface Notification {
  id: string;
  type: "warning" | "info" | "success" | "error";
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFS: Notification[] = [];

>>>>>>> Stashed changes
const notifIcon = (type: Notification["type"]) => {
  if (type === "warning") {
    return (
      <AlertCircle
        size={14}
        style={{ color: "#e9730c" }}
      />
    );
  }

  if (type === "error") {
    return (
      <AlertCircle
        size={14}
        style={{ color: "#bb0000" }}
      />
    );
  }

  if (type === "success") {
    return (
      <CheckCircle2
        size={14}
        style={{ color: "#107e3e" }}
      />
    );
  }

  return (
    <Info
      size={14}
      style={{ color: "#0070f2" }}
    />
  );
};

/* =========================================================
   OUTSIDE CLICK
========================================================= */

function useOutsideClick(
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void
) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node)
      ) {
        handler();
      }
    };

    document.addEventListener(
      "mousedown",
      listener
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        listener
      );
  }, [ref, handler]);
}

/* =========================================================
   NOTIFICATIONS PANEL
========================================================= */

function NotificationsPanel({
  notifs,
  onRead,
  onReadAll,
  onClose,
}: {
  notifs: Notification[];
  onRead: (id: string) => void;
  onReadAll: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useOutsideClick(ref, onClose);

  const unread = notifs.filter(
    (n) => !n.read
  ).length;

  return (
<<<<<<< Updated upstream
    <div ref={ref} className="absolute right-0 rounded shadow-2xl overflow-hidden z-50" style={{ width: "360px", background: "#fff", border: "1px solid #d9d9d9", top: "44px" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #d9d9d9", background: "#fafafa" }}>
        <div className="flex items-center gap-2">
          <Bell size={15} style={{ color: "#0070f2" }} />
          <span className="text-sm" style={{ color: "#32363a" }}>Notifications</span>
          {unread > 0 && <span className="px-1.5 py-0.5 rounded-full text-xs text-white" style={{ background: "#bb0000" }}>{unread}</span>}
=======
    <div
      ref={ref}
      className="absolute right-0 rounded shadow-2xl overflow-hidden z-50"
      style={{
        width: "360px",
        background: "var(--app-surface)",
        border: "1px solid var(--app-border)",
        top: "44px",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          borderBottom:
            "1px solid var(--app-border)",
          background: "var(--app-subtle)",
        }}
      >
        <div className="flex items-center gap-2">
          <Bell
            size={15}
            style={{ color: "#0070f2" }}
          />

          <span
            className="text-sm"
            style={{
              color: "var(--app-text)",
            }}
          >
            Notifications
          </span>

          {unread > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full text-xs text-white"
              style={{
                background: "#bb0000",
              }}
            >
              {unread}
            </span>
          )}
>>>>>>> Stashed changes
        </div>

        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button
              onClick={onReadAll}
              className="text-xs"
              style={{
                color: "#0070f2",
              }}
            >
              Mark all read
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100"
            style={{
              color: "#74777a",
            }}
          >
            ×
          </button>
        </div>
      </div>
<<<<<<< Updated upstream
      <div className="overflow-y-auto" style={{ maxHeight: "360px" }}>
        {notifs.map((n) => (
          <button
            key={n.id}
            onClick={() => onRead(n.id)}
            className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
            style={{ borderBottom: "1px solid #e4e4e4", background: n.read ? "#fafafa" : "#f0f6ff" }}
          >
            <div className="mt-0.5 flex-shrink-0">{notifIcon(n.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm" style={{ color: "#32363a" }}>{n.title}</p>
                {!n.read && <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#0070f2" }} />}
              </div>
              <p className="text-xs mt-0.5" style={{ color: "#74777a" }}>{n.body}</p>
              <p className="text-xs mt-1" style={{ color: "#a0a0a8" }}>{n.time}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="px-4 py-2.5 text-center" style={{ borderTop: "1px solid #d9d9d9", background: "#fafafa" }}>
        <span className="text-xs" style={{ color: "#74777a" }}>{notifs.length} notifications · {unread} unread</span>
=======

      <div
        className="overflow-y-auto"
        style={{
          maxHeight: "360px",
        }}
      >
        {notifs.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p
              className="text-sm"
              style={{
                color: "var(--app-text)",
              }}
            >
              No notifications
            </p>

            <p
              className="text-xs mt-1"
              style={{
                color: "var(--app-muted)",
              }}
            >
              Real system events will appear here.
            </p>
          </div>
        ) : (
          notifs.map((n) => (
            <button
              key={n.id}
              onClick={() => onRead(n.id)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
              style={{
                borderBottom:
                  "1px solid #e4e4e4",
                background: n.read
                  ? "#fafafa"
                  : "#f0f6ff",
              }}
            >
              <div className="mt-0.5 flex-shrink-0">
                {notifIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-sm"
                    style={{
                      color: "var(--app-text)",
                    }}
                  >
                    {n.title}
                  </p>

                  {!n.read && (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                      style={{
                        background: "#0070f2",
                      }}
                    />
                  )}
                </div>

                <p
                  className="text-xs mt-0.5"
                  style={{
                    color: "var(--app-muted)",
                  }}
                >
                  {n.body}
                </p>

                <p
                  className="text-xs mt-1"
                  style={{
                    color: "#a0a0a8",
                  }}
                >
                  {n.time}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      <div
        className="px-4 py-2.5 text-center"
        style={{
          borderTop:
            "1px solid var(--app-border)",
          background: "var(--app-subtle)",
        }}
      >
        <span
          className="text-xs"
          style={{
            color: "var(--app-muted)",
          }}
        >
          {notifs.length} notifications ·{" "}
          {unread} unread
        </span>
>>>>>>> Stashed changes
      </div>
    </div>
  );
}

<<<<<<< Updated upstream
/* ── Profile Menu Dropdown ── */
function ProfileMenu({ onProfile, onLogout }: { onProfile: () => void; onLogout: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => {/* handled by parent toggle */});
  return (
    <div ref={ref} className="absolute right-0 rounded shadow-2xl overflow-hidden z-50" style={{ top: "48px", width: "200px", background: "#fff", border: "1px solid #d9d9d9" }}>
      <div className="px-4 py-3" style={{ background: "linear-gradient(135deg, #1d2d3e 0%, #0d1e2e 100%)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0" style={{ background: "#0070f2" }}>AD</div>
          <div>
            <p className="text-sm text-white">ADMIN</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>admin@corp.local</p>
=======
/* =========================================================
   PROFILE MENU
========================================================= */

function ProfileMenu({
  user,
  onProfile,
  onLogout,
}: {
  user: AuthUser | null;
  onProfile: () => void;
  onLogout: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useOutsideClick(ref, () => {});

  const uname =
    user?.username || "ADMIN";

  const email =
    user?.email || "admin@corp.local";

  const role =
    user?.role || "Super Admin";

  const initials = uname
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      ref={ref}
      className="absolute right-0 rounded shadow-2xl overflow-hidden z-50"
      style={{
        top: "48px",
        width: "220px",
        background: "var(--app-surface)",
        border: "1px solid var(--app-border)",
      }}
    >
      <div
        className="px-4 py-3"
        style={{
          background:
            "linear-gradient(135deg, #1d2d3e 0%, #0d1e2e 100%)",
          borderBottom:
            "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 font-semibold"
            style={{
              background: "#0070f2",
            }}
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">
              {uname}
            </p>

            <p
              className="text-xs truncate"
              style={{
                color:
                  "rgba(255,255,255,0.6)",
              }}
            >
              {email}
            </p>

            <span
              className="inline-block text-[10px] px-1.5 py-0.2 rounded mt-0.5 text-white/90"
              style={{
                background:
                  "rgba(0,112,242,0.4)",
              }}
            >
              {role}
            </span>
>>>>>>> Stashed changes
          </div>
        </div>
      </div>

      <div className="py-1">
        <button
          onClick={onProfile}
<<<<<<< Updated upstream
          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
        >
          <User size={14} style={{ color: "#74777a" }} />
          <span className="text-sm" style={{ color: "#32363a" }}>My Profile</span>
=======
          className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
          style={{
            color: "var(--app-text)",
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              "rgba(255,255,255,0.04)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              "transparent";
          }}
        >
          <User
            size={14}
            style={{
              color: "var(--app-muted)",
            }}
          />

          <span
            className="text-sm font-medium"
            style={{
              color: "var(--app-text)",
            }}
          >
            My Profile
          </span>
>>>>>>> Stashed changes
        </button>

        <div
          style={{
            borderTop:
              "1px solid #f0f0f0",
          }}
        >
          <button
            onClick={onLogout}
<<<<<<< Updated upstream
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-red-50 transition-colors"
          >
            <LogOut size={14} style={{ color: "#bb0000" }} />
            <span className="text-sm" style={{ color: "#bb0000" }}>Log Out</span>
=======
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
            style={{
              color: "#bb0000",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "rgba(187,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "transparent";
            }}
          >
            <LogOut
              size={14}
              style={{
                color: "#bb0000",
              }}
            />

            <span
              className="text-sm font-medium"
              style={{
                color: "#bb0000",
              }}
            >
              Log Out
            </span>
>>>>>>> Stashed changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   LIVE CLOCK
========================================================= */

function LiveClock() {
  const [now, setNow] =
    useState(new Date());

  useEffect(() => {
    const id = setInterval(
      () => setNow(new Date()),
      1000
    );

    return () => clearInterval(id);
  }, []);

  const dateStr =
    now.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const timeStr =
    now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  return (
    <span
      className="text-xs hidden md:block"
      style={{
        color:
          "rgba(255,255,255,0.55)",
        fontVariantNumeric:
          "tabular-nums",
        letterSpacing: "0.01em",
      }}
    >
      {dateStr} · {timeStr}
    </span>
  );
}

<<<<<<< Updated upstream
/* ── Shell ── */
function Shell({ onLogout }: { onLogout: () => void }) {
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [pageView, setPageView] = useState<PageView>({ type: "main" });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL_NOTIFS);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const profileRef = useRef<HTMLDivElement>(null);
  useOutsideClick(profileRef, () => setProfileOpen(false));
=======
/* =========================================================
   OPERATION TAB
========================================================= */

function OperationTab({
  active,
  icon: Icon,
  label,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 rounded px-4 py-3 text-left transition-all"
      style={{
        background: active
          ? "var(--app-active)"
          : "var(--app-surface)",

        border: active
          ? "1px solid #0070f2"
          : "1px solid var(--app-border)",

        boxShadow: active
          ? "0 1px 3px rgba(0,112,242,0.12)"
          : "none",
      }}
    >
      <span
        className="mt-0.5 flex h-8 w-8 items-center justify-center rounded"
        style={{
          background: active
            ? "#0070f2"
            : "var(--app-bg)",

          color: active
            ? "#fff"
            : "var(--app-muted)",
        }}
      >
        <Icon size={16} />
      </span>

      <span className="min-w-0">
        <span
          className="block text-sm font-semibold"
          style={{
            color: active
              ? "#0070f2"
              : "var(--app-text)",
          }}
        >
          {label}
        </span>

        <span
          className="mt-0.5 block text-xs"
          style={{
            color: "var(--app-muted)",
          }}
        >
          {description}
        </span>
      </span>
    </button>
  );
}

/* =========================================================
   SINGLE USER MANAGEMENT
========================================================= */

function SingleUserManagement() {
  const [operation, setOperation] =
    useState<"create" | "delete">(
      "create"
    );

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
           

            <h1
              className="text-xl"
              style={{
                color: "var(--app-text)",
                fontWeight:700,
              }}
            >
              Single User
            </h1>
          </div>

          <p
            className="text-sm"
            style={{
              color: "var(--app-muted)",
            }}
          >
            Create or delete one SAP user
            account at a time.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-2">
        <OperationTab
          active={
            operation === "create"
          }
          icon={UserPlus}
          label="Create User"
          description="Add one SAP account with roles and validity."
          onClick={() =>
            setOperation("create")
          }
        />

        <OperationTab
          active={
            operation === "delete"
          }
          icon={Trash2}
          label="Delete User"
          description="Remove one SAP account from a selected system."
          onClick={() =>
            setOperation("delete")
          }
        />
      </div>

      {operation === "create" ? (
        <SingleUserCreation
          embedded
        />
      ) : (
        <UserDeletion
          variant="single"
          embedded
        />
      )}
    </div>
  );
}

/* =========================================================
   BULK USER MANAGEMENT
========================================================= */

function BulkUserManagement() {
  const [operation, setOperation] =
    useState<"create" | "delete">(
      "create"
    );

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            
            <h1
              className="text-xl"
              style={{
                color: "var(--app-text)",
                fontWeight:700 
              }}
            >
              Bulk User
            </h1>
          </div>

          <p
            className="text-sm"
            style={{
              color: "var(--app-muted)",
            }}
          >
            Create or delete multiple SAP
            users in batch workflows.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-2">
        <OperationTab
          active={
            operation === "create"
          }
          icon={Upload}
          label="Bulk Create"
          description="Upload a template to provision multiple users."
          onClick={() =>
            setOperation("create")
          }
        />

        <OperationTab
          active={
            operation === "delete"
          }
          icon={Trash2}
          label="Bulk Delete"
          description="Upload or enter a list to remove users in batch."
          onClick={() =>
            setOperation("delete")
          }
        />
      </div>

      {operation === "create" ? (
        <BulkUserCreation
          embedded
        />
      ) : (
        <UserDeletion
          variant="bulk"
          embedded
        />
      )}
    </div>
  );
}

/* =========================================================
   SHELL
========================================================= */
>>>>>>> Stashed changes

function Shell({
  user,
  onLogout,
}: {
  user: AuthUser | null;
  onLogout: () => void;
}) {
  const [activeView, setActiveView] =
    useState<ActiveView>(
      "dashboard"
    );

  const [pageView, setPageView] =
    useState<PageView>({
      type: "main",
    });

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

<<<<<<< Updated upstream
  const isSubPage = pageView.type !== "main";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f5f6f7", fontFamily: "'72', '72full', Arial, Helvetica, sans-serif" }}>
      {/* Shell Bar */}
      <header style={{ background: "#1d2d3e", height: "44px", position: "relative", zIndex: 30 }} className="flex items-center px-4 gap-3 flex-shrink-0 shadow-md">
=======
  const [notifOpen, setNotifOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [notifs, setNotifs] =
    useState<Notification[]>(
      INITIAL_NOTIFS
    );

  const [appSettings, setAppSettings] =
    useState<AppSettings>(
      DEFAULT_SETTINGS
    );

  const profileRef =
    useRef<HTMLDivElement>(null);

  useOutsideClick(
    profileRef,
    () => setProfileOpen(false)
  );

  const activeItem =
    ALL_ITEMS.find(
      (n) => n.id === activeView
    )!;

  const activeGroup =
    NAV_GROUPS.find((g) =>
      g.items.some(
        (i) => i.id === activeView
      )
    )!;

  const unreadCount =
    notifs.filter(
      (n) => !n.read
    ).length;

  const readNotif = (id: string) =>
    setNotifs((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              read: true,
            }
          : n
      )
    );

  const readAll = () =>
    setNotifs((prev) =>
      prev.map((n) => ({
        ...n,
        read: true,
      }))
    );

  const goMain = () =>
    setPageView({
      type: "main",
    });

  const isSubPage =
    pageView.type !== "main";

  const displayUser =
    user?.username || "ADMIN";

  const initials = displayUser
    .substring(0, 2)
    .toUpperCase();

  /* =======================================================
     THEME / DENSITY
  ======================================================= */

  useEffect(() => {
    const root =
      document.documentElement;

    const density =
      appSettings.density.toLowerCase();

    const isDark =
      appSettings.theme === "Dark";

    root.dataset.theme =
      isDark ? "dark" : "light";

    root.classList.toggle(
      "dark",
      isDark
    );

    root.dataset.density =
      density;

    root.style.setProperty(
      "--font-size",
      density === "compact"
        ? "15px"
        : density === "spacious"
        ? "17px"
        : "16px"
    );
  }, [
    appSettings.density,
    appSettings.theme,
  ]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "var(--app-bg)",
        fontFamily:
          "'72', '72full', Arial, Helvetica, sans-serif",
      }}
    >
      {/* =====================================================
          SHELL BAR
      ===================================================== */}

      <header
        style={{
          background: "#1d2d3e",
          height: "44px",
          position: "relative",
          zIndex: 30,
        }}
        className="flex items-center px-4 gap-3 flex-shrink-0 shadow-md"
      >
>>>>>>> Stashed changes
        {!isSubPage && (
          <button
            onClick={() =>
              setSidebarOpen(
                !sidebarOpen
              )
            }
            className="text-white/80 hover:text-white transition-colors p-1 rounded"
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <Menu
              size={20}
              strokeWidth={2}
            />
          </button>
        )}

        <div className="h-5 w-px bg-white/20" />

        <div className="flex items-center gap-2">
<<<<<<< Updated upstream
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "#0070f2" }}>
            <Users size={13} className="text-white" />
          </div>
          <span className="text-white text-sm">SAP Basis Provisioning Console</span>
=======
          <img
            src={logoImage}
            alt="Naxrita"
            className="h-7 w-7 object-contain"
          />

          <span
            className="text-white text-sm"
            style={{
              fontWeight: 750,
            }}
          >
            SAP Basis Provisioning Console
          </span>
>>>>>>> Stashed changes
        </div>

        <div className="flex-1" />

        <LiveClock />

        <div className="flex items-center gap-1 ml-3">

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          <div className="relative">
            <button
<<<<<<< Updated upstream
              onClick={() => { setNotifOpen((o) => !o); }}
              className="p-2 rounded hover:bg-white/10 transition-colors relative"
              style={{ color: notifOpen ? "#fff" : "rgba(255,255,255,0.7)" }}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ background: "#bb0000", fontSize: "9px" }}>
                  {unreadCount}
                </span>
              )}
            </button>
            {notifOpen && <NotificationsPanel notifs={notifs} onRead={readNotif} onReadAll={readAll} onClose={() => setNotifOpen(false)} />}
          </div>

          {/* Settings — full page */}
          <button
            onClick={() => setPageView({ type: "settings" })}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            style={{ color: pageView.type === "settings" ? "#fff" : "rgba(255,255,255,0.7)" }}
=======
              onClick={() =>
                setNotifOpen(
                  (o) => !o
                )
              }
              className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors relative"
            >
              <Bell size={16} />

              {unreadCount > 0 && (
                <span
                  className="absolute top-1 right-1 w-2 h-2 rounded-full"
                  style={{
                    background:
                      "#0070f2",
                  }}
                />
              )}
            </button>

            {notifOpen && (
              <NotificationsPanel
                notifs={notifs}
                onRead={readNotif}
                onReadAll={readAll}
                onClose={() =>
                  setNotifOpen(false)
                }
              />
            )}
          </div>

          {/* =================================================
              SETTINGS
          ================================================= */}

          <button
            onClick={() =>
              setPageView({
                type: "settings",
              })
            }
            className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors"
>>>>>>> Stashed changes
          >
            <Settings size={16} />
          </button>

<<<<<<< Updated upstream
          <div className="h-5 w-px bg-white/20 mx-1" />

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
=======
          {/* =================================================
              PROFILE
          ================================================= */}

          <div
            className="relative"
            ref={profileRef}
          >
>>>>>>> Stashed changes
            <button
              onClick={() =>
                setProfileOpen(
                  (o) => !o
                )
              }
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded hover:bg-white/10 transition-colors"
              style={{
                background:
                  profileOpen
                    ? "rgba(255,255,255,0.1)"
                    : "transparent",
              }}
            >
<<<<<<< Updated upstream
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs" style={{ background: "#0070f2" }}>AD</div>
              <span className="text-white/80 text-sm hidden sm:block">Admin</span>
=======
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                style={{
                  background:
                    "#0070f2",
                }}
              >
                {initials}
              </div>

              <span className="text-white/80 text-sm hidden sm:block">
                {displayUser}
              </span>
>>>>>>> Stashed changes
            </button>

            {profileOpen && (
              <ProfileMenu
<<<<<<< Updated upstream
                onProfile={() => { setProfileOpen(false); setPageView({ type: "profile" }); }}
                onLogout={() => { setProfileOpen(false); onLogout(); }}
=======
                user={user}
                onProfile={() => {
                  setProfileOpen(false);

                  setPageView({
                    type: "profile",
                  });
                }}
                onLogout={() => {
                  setProfileOpen(false);
                  onLogout();
                }}
>>>>>>> Stashed changes
              />
            )}
          </div>
        </div>
      </header>

      {/* =====================================================
          SETTINGS PAGE
      ===================================================== */}

      {pageView.type ===
        "settings" && (
        <div className="flex-1 overflow-auto">
<<<<<<< Updated upstream
          <SettingsPage settings={appSettings} onChange={(p) => setAppSettings((s) => ({ ...s, ...p }))} onBack={goMain} />
=======
          <SettingsPage
            settings={appSettings}
            onChange={(p) =>
              setAppSettings((s) => ({
                ...s,
                ...p,
              }))
            }
            onBack={goMain}
          />
>>>>>>> Stashed changes
        </div>
      )}

      {/* =====================================================
          PROFILE PAGE
      ===================================================== */}

      {pageView.type ===
        "profile" && (
        <div className="flex-1 overflow-auto">
          <ProfilePage
            onBack={goMain}
          />
        </div>
      )}

      {/* =====================================================
          AUDIT DETAIL PAGE
      ===================================================== */}

      {pageView.type ===
        "audit-detail" && (
        <div className="flex-1 overflow-auto">
          <AuditDetailPage
            log={pageView.log}
            onBack={goMain}
          />
        </div>
      )}

      {/* =====================================================
          SYSTEM DETAIL PAGE
      ===================================================== */}

      {pageView.type ===
        "system-detail" && (
        <div className="flex-1 overflow-auto">
          <SystemDetailPage
            system={pageView.system}
            onBack={goMain}
          />
        </div>
      )}

<<<<<<< Updated upstream
      {/* Main layout (sidebar + content) */}
      {pageView.type === "main" && (
        <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 44px)" }}>
          {/* Side Navigation */}
          <aside
            style={{ width: sidebarOpen ? "260px" : "0px", background: "#ffffff", borderRight: "1px solid #d9d9d9", transition: "width 0.2s ease", overflow: "hidden", flexShrink: 0 }}
            className="flex flex-col"
          >
            <div style={{ minWidth: "260px", overflowY: "auto" }}>
              <div className="px-4 py-3" style={{ borderBottom: "1px solid #e4e4e4", background: "#f5f6f7" }}>
                <p className="text-xs" style={{ color: "#74777a" }}>Current Session</p>
                <p className="text-sm" style={{ color: "#32363a" }}>ADMIN · 10.42.8.201</p>
              </div>
              <div className="px-3 py-3 flex flex-col gap-5">
                {NAV_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="text-xs px-2 pb-2" style={{ color: "#74777a", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      {group.label}
                    </p>
                    <nav className="flex flex-col gap-0.5">
                      {group.items.map((item) => {
                        const isActive = activeView === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded text-left w-full transition-colors"
                            style={{ background: isActive ? "#e8f2ff" : "transparent", borderLeft: isActive ? "3px solid #0070f2" : "3px solid transparent" }}
                          >
                            <item.icon size={15} style={{ color: isActive ? "#0070f2" : "#74777a", flexShrink: 0 }} />
                            <span className="text-sm" style={{ color: isActive ? "#0070f2" : "#32363a" }}>{item.label}</span>
                            {isActive && <ChevronRight size={13} className="ml-auto" style={{ color: "#0070f2" }} />}
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                ))}
=======
      {/* =====================================================
          ADD SYSTEM PAGE
      ===================================================== */}

      {pageView.type ===
        "add-system" && (
        <div className="flex-1 overflow-auto">
          <SystemFormPage
            initial={{
              systemId: "",
              systemName: "",
              client: "100",
              environment:
                "Development",
              host: "",
              description: "",
              status: "Active",
            }}
            onSave={() =>
              setPageView({
                type: "main",
              })
            }
            onBack={goMain}
          />
        </div>
      )}

      {/* =====================================================
          MAIN LAYOUT
      ===================================================== */}

      {pageView.type ===
        "main" && (
        <div
          className="flex flex-1 overflow-hidden"
          style={{
            height:
              "calc(100vh - 44px)",
          }}
        >

          {/* =================================================
              NAVY BLUE SIDE NAVIGATION
          ================================================= */}

          <aside
            style={{
              width: sidebarOpen
                ? "260px"
                : "0px",

              background:
                "#0B1F3A",

              borderRight:
                "1px solid #1D3A5C",

              transition:
                "width 0.2s ease",

              overflow: "hidden",

              flexShrink: 0,

              boxShadow:
                sidebarOpen
                  ? "4px 0 12px rgba(0,0,0,0.12)"
                  : "none",
            }}
            className="flex flex-col"
          >
            <div
              style={{
                minWidth: "260px",
                overflowY: "auto",
              }}
              className="navy-sidebar-scroll"
            >
              <div className="px-3 py-4 flex flex-col gap-6">

                {NAV_GROUPS.map(
                  (group) => (
                    <div
                      key={
                        group.label
                      }
                    >

                      {/* =================================================
                          SECTION TITLE
                          LIGHT SKY BLUE + BOLD
                      ================================================= */}

                      <p
                        className="text-sm px-3 pb-3"
                        style={{
                          color:
                            "#7CCBFF",

                          fontWeight: 800,

                          letterSpacing:
                            "0.08em",

                          textTransform:
                            "uppercase",
                        }}
                      >
                        {
                          group.label
                        }
                      </p>

                      {/* =================================================
                          NAVIGATION ITEMS
                          WHITE + BOLD
                      ================================================= */}

                      <nav className="flex flex-col gap-1">
                        {group.items.map(
                          (item) => {
                            const isActive =
                              activeView ===
                              item.id;

                            return (
                              <button
                                key={
                                  item.id
                                }
                                onClick={() =>
                                  setActiveView(
                                    item.id
                                  )
                                }
                                className="navy-nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full transition-all duration-200"
                                style={{
                                  background:
                                    isActive
                                      ? "#163A63"
                                      : "transparent",

                                  borderLeft:
                                    isActive
                                      ? "3px solid #4DA3FF"
                                      : "3px solid transparent",

                                  boxShadow:
                                    isActive
                                      ? "inset 0 0 0 1px rgba(77,163,255,0.12)"
                                      : "none",

                                  minHeight:
                                    "46px",
                                }}
                                onMouseEnter={(
                                  e
                                ) => {
                                  if (
                                    !isActive
                                  ) {
                                    e.currentTarget.style.background =
                                      "#122F50";
                                  }
                                }}
                                onMouseLeave={(
                                  e
                                ) => {
                                  if (
                                    !isActive
                                  ) {
                                    e.currentTarget.style.background =
                                      "transparent";
                                  }
                                }}
                              >

                                {/* =================================================
                                    ICON
                                ================================================= */}

                                <item.icon
                                  size={18}
                                  strokeWidth={
                                    2
                                  }
                                  style={{
                                    color:
                                      isActive
                                        ? "#4DA3FF"
                                        : "#FFFFFF",

                                    flexShrink:
                                      0,
                                  }}
                                />

                                {/* =================================================
                                    MODULE LABEL
                                    WHITE + BOLD
                                ================================================= */}

                                <span
                                  className="text-base"
                                  style={{
                                    color:
                                      "#FFFFFF",

                                    fontWeight:
                                      700,

                                    lineHeight:
                                      "1.4",
                                  }}
                                >
                                  {
                                    item.label
                                  }
                                </span>

                                {/* =================================================
                                    ACTIVE ARROW
                                ================================================= */}

                                {isActive && (
                                  <ChevronRight
                                    size={
                                      15
                                    }
                                    strokeWidth={
                                      2.5
                                    }
                                    className="ml-auto"
                                    style={{
                                      color:
                                        "#4DA3FF",
                                    }}
                                  />
                                )}
                              </button>
                            );
                          }
                        )}
                      </nav>
                    </div>
                  )
                )}
>>>>>>> Stashed changes
              </div>
            </div>
          </aside>

          {/* =================================================
              MAIN CONTENT
          ================================================= */}

          <main className="flex-1 overflow-auto">
<<<<<<< Updated upstream
            <div className="px-6 py-2 flex items-center gap-1.5 text-sm flex-shrink-0" style={{ borderBottom: "1px solid #d9d9d9", background: "#ffffff" }}>
              <button onClick={() => setActiveView("dashboard")} className="hover:underline transition-colors" style={{ color: "#0070f2" }}>SAP Basis</button>
              <ChevronRight size={12} style={{ color: "#74777a" }} />
              <button onClick={() => setActiveView(activeGroup.items[0].id)} className="hover:underline transition-colors" style={{ color: "#0070f2" }}>{activeGroup.label}</button>
              <ChevronRight size={12} style={{ color: "#74777a" }} />
              <span style={{ color: "#32363a" }}>{activeItem.label}</span>
=======

            {/* =================================================
                BREADCRUMB
            ================================================= */}

            <div
              className="px-6 py-2 flex items-center gap-1.5 text-sm flex-shrink-0"
              style={{
                borderBottom:
                  "1px solid var(--app-border)",

                background:
                  "var(--app-surface)",
              }}
            >
              <button
                onClick={() =>
                  setActiveView(
                    "dashboard"
                  )
                }
                className="hover:underline transition-colors"
                style={{
                  color:
                    "#0070f2",
                }}
              >
                SAP Basis
              </button>

              <ChevronRight
                size={12}
                style={{
                  color:
                    "var(--app-muted)",
                }}
              />

              <button
                onClick={() =>
                  setActiveView(
                    activeGroup
                      .items[0].id
                  )
                }
                className="hover:underline transition-colors"
                style={{
                  color:
                    "#0070f2",
                }}
              >
                {
                  activeGroup.label
                }
              </button>

              <ChevronRight
                size={12}
                style={{
                  color:
                    "var(--app-muted)",
                }}
              />

              <span
                style={{
                  color:
                    "var(--app-text)",
                }}
              >
                {activeItem.label}
              </span>
>>>>>>> Stashed changes
            </div>

            {/* =================================================
                PAGE CONTENT
            ================================================= */}

            <div className="p-6">

              {/* DASHBOARD */}

              {activeView ===
                "dashboard" && (
                <Dashboard
                  onNavigate={(v) =>
                    setActiveView(
                      v as ActiveView
                    )
                  }
                  onViewAudit={(log) =>
                    setPageView({
                      type:
                        "audit-detail",
                      log,
                    })
                  }
                  username={
                    user?.username
                  }
                />
              )}

              {/* ANALYTICS */}

              {activeView ===
                "analytics" && (
                <Analytics
                  onNavigate={(v) =>
                    setActiveView(
                      v as ActiveView
                    )
                  }
                />
              )}
<<<<<<< Updated upstream
              {activeView === "single-user" && <SingleUserCreation />}
              {activeView === "bulk-user" && <BulkUserCreation />}
              {activeView === "password-reset" && <PasswordReset />}
              {activeView === "lock-unlock" && <LockUnlockUser />}
              {activeView === "data-management" && (
                <DataManagement onViewDetail={(sys) => setPageView({ type: "system-detail", system: sys })} />
              )}
              {activeView === "audit-logs" && (
                <AuditLogs onViewDetail={(log) => setPageView({ type: "audit-detail", log })} />
=======

              {/* SINGLE USER */}

              {activeView ===
                "single-user" && (
                <SingleUserManagement />
              )}

              {/* BULK USER */}

              {activeView ===
                "bulk-user" && (
                <BulkUserManagement />
              )}

              {/* PASSWORD RESET */}

              {activeView ===
                "password-reset" && (
                <PasswordReset
                  displayPreferences={
                    appSettings.displayPreferences
                  }
                />
              )}

              {/* LOCK / UNLOCK */}

              {activeView ===
                "lock-unlock" && (
                <LockUnlockUser
                  displayPreferences={
                    appSettings.displayPreferences
                  }
                />
              )}

              {/* DATA MANAGEMENT */}

              {activeView ===
                "data-management" && (
                <DataManagement
                  displayPreferences={
                    appSettings.displayPreferences
                  }
                  onViewDetail={(sys) =>
                    setPageView({
                      type:
                        "system-detail",
                      system: sys,
                    })
                  }
                  onAddSystem={() =>
                    setPageView({
                      type:
                        "add-system",
                    })
                  }
                />
              )}

              {/* AUDIT LOGS */}

              {activeView ===
                "audit-logs" && (
                <AuditLogs
                  displayPreferences={
                    appSettings.displayPreferences
                  }
                  onViewDetail={(log) =>
                    setPageView({
                      type:
                        "audit-detail",
                      log,
                    })
                  }
                />
>>>>>>> Stashed changes
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   APP ROOT
========================================================= */

function AppRoot() {
<<<<<<< Updated upstream
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <SignInPage onSignIn={() => setIsLoggedIn(true)} />;
  }

  return <Shell onLogout={() => setIsLoggedIn(false)} />;
=======
  const [currentUser, setCurrentUser] =
    useState<AuthUser | null>(() =>
      getCurrentUser()
    );

  const [isLoggedIn, setIsLoggedIn] =
    useState<boolean>(() => {
      return !!localStorage.getItem(
        "token"
      );
    });

  useEffect(() => {
    const handleSessionExpired =
      async () => {
        await logoutApi();

        setCurrentUser(null);
        setIsLoggedIn(false);
      };

    window.addEventListener(
      "auth:session-expired",
      handleSessionExpired
    );

    return () =>
      window.removeEventListener(
        "auth:session-expired",
        handleSessionExpired
      );
  }, []);

  const handleSignIn = (
    user?: AuthUser
  ) => {
    if (user) {
      setCurrentUser(user);
    }

    setIsLoggedIn(true);
  };

  const handleLogout =
    async () => {
      await logoutApi();

      setCurrentUser(null);
      setIsLoggedIn(false);
    };

  if (!isLoggedIn) {
    return (
      <SignInPage
        onSignIn={handleSignIn}
      />
    );
  }

  return (
    <Shell
      user={currentUser}
      onLogout={handleLogout}
    />
  );
>>>>>>> Stashed changes
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  return (
    <AppProvider>
      <AppRoot />
    </AppProvider>
  );
}