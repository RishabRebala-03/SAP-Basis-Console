import { useState, useRef, useEffect } from "react";
import { UserPlus, Upload, KeyRound, Lock, ChevronRight, Bell, Settings, Menu, X, Database, ClipboardList, CheckCircle2, AlertCircle, Info, User, LogOut, LayoutDashboard, BarChart3 } from "lucide-react";
import { AppProvider } from "./contexts/AppContext";
import { AuditLog, SapSystem } from "./contexts/AppContext";
import { SingleUserCreation } from "./components/SingleUserCreation";
import { BulkUserCreation } from "./components/BulkUserCreation";
import { PasswordReset } from "./components/PasswordReset";
import { LockUnlockUser } from "./components/LockUnlockUser";
import { DataManagement } from "./components/DataManagement";
import { AuditLogs } from "./components/AuditLogs";
import { AuditDetailPage } from "./components/pages/AuditDetailPage";
import { SettingsPage, DEFAULT_SETTINGS, AppSettings } from "./components/pages/SettingsPage";
import { ProfilePage } from "./components/pages/ProfilePage";
import { SystemDetailPage } from "./components/pages/SystemDetailPage";
import { SignInPage } from "./components/pages/SignInPage";
import { SystemFormPage } from "./components/DataManagement";
import { Dashboard } from "./components/Dashboard";
import { Analytics } from "./components/Analytics";
import { logoutApi, getCurrentUser, User as AuthUser } from "../api/authApi";
import logoImage from "../imports/image.png";

type ActiveView = "dashboard" | "analytics" | "single-user" | "bulk-user" | "password-reset" | "lock-unlock" | "data-management" | "audit-logs";
type PageView =
  | { type: "main" }
  | { type: "settings" }
  | { type: "profile" }
  | { type: "audit-detail"; log: AuditLog }
  | { type: "system-detail"; system: SapSystem }
  | { type: "add-system" };

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { id: "dashboard" as ActiveView, label: "Dashboard", icon: LayoutDashboard },
      { id: "analytics" as ActiveView, label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "User Management",
    items: [
      { id: "single-user" as ActiveView, label: "Single User Creation", icon: UserPlus },
      { id: "bulk-user" as ActiveView, label: "Bulk User Creation", icon: Upload },
      { id: "password-reset" as ActiveView, label: "Password Reset", icon: KeyRound },
      { id: "lock-unlock" as ActiveView, label: "Lock / Unlock User", icon: Lock },
    ],
  },
  {
    label: "Administration",
    items: [
      { id: "data-management" as ActiveView, label: "Data Management", icon: Database },
      { id: "audit-logs" as ActiveView, label: "Audit Logs", icon: ClipboardList },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

/* ── Notification data ── */
interface Notification { id: string; type: "warning" | "info" | "success" | "error"; title: string; body: string; time: string; read: boolean; }
const INITIAL_NOTIFS: Notification[] = [];
const notifIcon = (type: Notification["type"]) => {
  if (type === "warning") return <AlertCircle size={14} style={{ color: "#e9730c" }} />;
  if (type === "error")   return <AlertCircle size={14} style={{ color: "#bb0000" }} />;
  if (type === "success") return <CheckCircle2 size={14} style={{ color: "#107e3e" }} />;
  return <Info size={14} style={{ color: "#0070f2" }} />;
};

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

/* ── Notifications Panel ── */
function NotificationsPanel({ notifs, onRead, onReadAll, onClose }: { notifs: Notification[]; onRead: (id: string) => void; onReadAll: () => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, onClose);
  const unread = notifs.filter((n) => !n.read).length;
  return (
    <div ref={ref} className="absolute right-0 rounded shadow-2xl overflow-hidden z-50" style={{ width: "360px", background: "var(--app-surface)", border: "1px solid var(--app-border)", top: "44px" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--app-border)", background: "var(--app-subtle)" }}>
        <div className="flex items-center gap-2">
          <Bell size={15} style={{ color: "#0070f2" }} />
          <span className="text-sm" style={{ color: "var(--app-text)" }}>Notifications</span>
          {unread > 0 && <span className="px-1.5 py-0.5 rounded-full text-xs text-white" style={{ background: "#bb0000" }}>{unread}</span>}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && <button onClick={onReadAll} className="text-xs" style={{ color: "#0070f2" }}>Mark all read</button>}
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100" style={{ color: "#74777a" }}><X size={13} /></button>
        </div>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: "360px" }}>
        {notifs.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm" style={{ color: "var(--app-text)" }}>No notifications</p>
            <p className="text-xs mt-1" style={{ color: "var(--app-muted)" }}>Real system events will appear here.</p>
          </div>
        ) : notifs.map((n) => (
          <button
            key={n.id}
            onClick={() => onRead(n.id)}
            className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
            style={{ borderBottom: "1px solid #e4e4e4", background: n.read ? "#fafafa" : "#f0f6ff" }}
          >
            <div className="mt-0.5 flex-shrink-0">{notifIcon(n.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
              <p className="text-sm" style={{ color: "var(--app-text)" }}>{n.title}</p>
                {!n.read && <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#0070f2" }} />}
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--app-muted)" }}>{n.body}</p>
              <p className="text-xs mt-1" style={{ color: "#a0a0a8" }}>{n.time}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="px-4 py-2.5 text-center" style={{ borderTop: "1px solid var(--app-border)", background: "var(--app-subtle)" }}>
        <span className="text-xs" style={{ color: "var(--app-muted)" }}>{notifs.length} notifications · {unread} unread</span>
      </div>
    </div>
  );
}

/* ── Profile Menu Dropdown ── */
function ProfileMenu({ user, onProfile, onLogout }: { user: AuthUser | null; onProfile: () => void; onLogout: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => {/* handled by parent toggle */});
  const uname = user?.username || "ADMIN";
  const email = user?.email || "admin@corp.local";
  const role = user?.role || "Super Admin";
  const initials = uname.substring(0, 2).toUpperCase();

  return (
    <div ref={ref} className="absolute right-0 rounded shadow-2xl overflow-hidden z-50" style={{ top: "48px", width: "220px", background: "var(--app-surface)", border: "1px solid var(--app-border)" }}>
      <div className="px-4 py-3" style={{ background: "linear-gradient(135deg, #1d2d3e 0%, #0d1e2e 100%)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 font-semibold" style={{ background: "#0070f2" }}>{initials}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{uname}</p>
            <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.6)" }}>{email}</p>
            <span className="inline-block text-[10px] px-1.5 py-0.2 rounded mt-0.5 text-white/90" style={{ background: "rgba(0,112,242,0.4)" }}>{role}</span>
          </div>
        </div>
      </div>
      <div className="py-1">
        <button
          onClick={onProfile}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
          style={{
            color: "var(--app-text)",
            background: "transparent",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <User size={14} style={{ color: "var(--app-muted)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--app-text)" }}>My Profile</span>
        </button>
        <div style={{ borderTop: "1px solid #f0f0f0" }}>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
            style={{ color: "#bb0000", background: "transparent" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(187,0,0,0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut size={14} style={{ color: "#bb0000" }} />
            <span className="text-sm font-medium" style={{ color: "#bb0000" }}>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Live Clock ── */
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return (
    <span className="text-xs hidden md:block" style={{ color: "rgba(255,255,255,0.55)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.01em" }}>
      {dateStr} · {timeStr}
    </span>
  );
}

/* ── Shell ── */
function Shell({ user, onLogout }: { user: AuthUser | null; onLogout: () => void }) {
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [pageView, setPageView] = useState<PageView>({ type: "main" });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL_NOTIFS);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const profileRef = useRef<HTMLDivElement>(null);
  useOutsideClick(profileRef, () => setProfileOpen(false));

  const activeItem = ALL_ITEMS.find((n) => n.id === activeView)!;
  const activeGroup = NAV_GROUPS.find((g) => g.items.some((i) => i.id === activeView))!;
  const unreadCount = notifs.filter((n) => !n.read).length;

  const readNotif = (id: string) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  const readAll = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));

  const goMain = () => setPageView({ type: "main" });

  const isSubPage = pageView.type !== "main";
  const displayUser = user?.username || "ADMIN";
  const initials = displayUser.substring(0, 2).toUpperCase();

  useEffect(() => {
    const root = document.documentElement;
    const density = appSettings.density.toLowerCase();
    const isDark = appSettings.theme === "Dark";
    root.dataset.theme = isDark ? "dark" : "light";
    root.classList.toggle("dark", isDark);
    root.dataset.density = density;
    root.style.setProperty("--font-size", density === "compact" ? "15px" : density === "spacious" ? "17px" : "16px");
  }, [appSettings.density, appSettings.theme]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--app-bg)", fontFamily: "'72', '72full', Arial, Helvetica, sans-serif" }}>
      {/* Shell Bar */}
      <header style={{ background: "#1d2d3e", height: "44px", position: "relative", zIndex: 30 }} className="flex items-center px-4 gap-3 flex-shrink-0 shadow-md">
        {!isSubPage && (
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/80 hover:text-white transition-colors p-1 rounded">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}
        <div className="h-5 w-px bg-white/20" />
        <div className="flex items-center gap-2">
          <img src={logoImage} alt="Naxrita" className="h-7 w-7 object-contain" />
          <span className="text-white text-sm">SAP Basis Provisioning Console</span>
        </div>
        <div className="flex-1" />
        <LiveClock />
        <div className="flex items-center gap-1 ml-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors relative"
            >
              <Bell size={16} />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "#0070f2" }} />}
            </button>
            {notifOpen && (
              <NotificationsPanel
                notifs={notifs}
                onRead={readNotif}
                onReadAll={readAll}
                onClose={() => setNotifOpen(false)}
              />
            )}
          </div>

          <button onClick={() => setPageView({ type: "settings" })} className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors">
            <Settings size={16} />
          </button>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded hover:bg-white/10 transition-colors"
              style={{ background: profileOpen ? "rgba(255,255,255,0.1)" : "transparent" }}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ background: "#0070f2" }}>{initials}</div>
              <span className="text-white/80 text-sm hidden sm:block">{displayUser}</span>
            </button>
            {profileOpen && (
              <ProfileMenu
                user={user}
                onProfile={() => { setProfileOpen(false); setPageView({ type: "profile" }); }}
                onLogout={() => { setProfileOpen(false); onLogout(); }}
              />
            )}
          </div>
        </div>
      </header>

      {/* Sub-page views (full page, no sidebar) */}
      {pageView.type === "settings" && (
        <div className="flex-1 overflow-auto">
          <SettingsPage
            settings={appSettings}
            onChange={(p) => setAppSettings((s) => ({ ...s, ...p }))}
            onBack={goMain}
          />
        </div>
      )}

      {pageView.type === "profile" && (
        <div className="flex-1 overflow-auto">
          <ProfilePage onBack={goMain} />
        </div>
      )}

      {pageView.type === "audit-detail" && (
        <div className="flex-1 overflow-auto">
          <AuditDetailPage log={pageView.log} onBack={goMain} />
        </div>
      )}

      {pageView.type === "system-detail" && (
        <div className="flex-1 overflow-auto">
          <SystemDetailPage system={pageView.system} onBack={goMain} />
        </div>
      )}

      {pageView.type === "add-system" && (
        <div className="flex-1 overflow-auto">
          <SystemFormPage
            initial={{
              systemId: "",
              systemName: "",
              client: "100",
              environment: "Development",
              host: "",
              description: "",
              status: "Active",
            }}
            onSave={() => setPageView({ type: "main" })}
            onBack={goMain}
          />
        </div>
      )}

      {/* Main layout (sidebar + content) */}
      {pageView.type === "main" && (
        <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 44px)" }}>
          {/* Side Navigation */}
          <aside
            style={{ width: sidebarOpen ? "260px" : "0px", background: "var(--app-surface)", borderRight: "1px solid var(--app-border)", transition: "width 0.2s ease", overflow: "hidden", flexShrink: 0 }}
            className="flex flex-col"
          >
            <div style={{ minWidth: "260px", overflowY: "auto" }}>
              <div className="px-3 py-3 flex flex-col gap-5">
                {NAV_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="text-xs px-2 pb-2" style={{ color: "var(--app-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
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
                            style={{ background: isActive ? "var(--app-active)" : "transparent", borderLeft: isActive ? "3px solid #0070f2" : "3px solid transparent" }}
                          >
                            <item.icon size={15} style={{ color: isActive ? "#0070f2" : "var(--app-muted)", flexShrink: 0 }} />
                            <span className="text-sm" style={{ color: isActive ? "#0070f2" : "var(--app-text)" }}>{item.label}</span>
                            {isActive && <ChevronRight size={13} className="ml-auto" style={{ color: "#0070f2" }} />}
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="px-6 py-2 flex items-center gap-1.5 text-sm flex-shrink-0" style={{ borderBottom: "1px solid var(--app-border)", background: "var(--app-surface)" }}>
              <button onClick={() => setActiveView("dashboard")} className="hover:underline transition-colors" style={{ color: "#0070f2" }}>SAP Basis</button>
              <ChevronRight size={12} style={{ color: "var(--app-muted)" }} />
              <button onClick={() => setActiveView(activeGroup.items[0].id)} className="hover:underline transition-colors" style={{ color: "#0070f2" }}>{activeGroup.label}</button>
              <ChevronRight size={12} style={{ color: "var(--app-muted)" }} />
              <span style={{ color: "var(--app-text)" }}>{activeItem.label}</span>
            </div>
            <div className="p-6">
              {activeView === "dashboard" && (
                <Dashboard
                  onNavigate={(v) => setActiveView(v as ActiveView)}
                  onViewAudit={(log) => setPageView({ type: "audit-detail", log })}
                />
              )}
              {activeView === "analytics" && (
                <Analytics onNavigate={(v) => setActiveView(v as ActiveView)} />
              )}
              {activeView === "single-user" && <SingleUserCreation />}
              {activeView === "bulk-user" && <BulkUserCreation />}
              {activeView === "password-reset" && (
                <PasswordReset displayPreferences={appSettings.displayPreferences} />
              )}
              {activeView === "lock-unlock" && (
                <LockUnlockUser displayPreferences={appSettings.displayPreferences} />
              )}
              {activeView === "data-management" && (
                <DataManagement
                  displayPreferences={appSettings.displayPreferences}
                  onViewDetail={(sys) => setPageView({ type: "system-detail", system: sys })}
                  onAddSystem={() => setPageView({ type: "add-system" })}
                />
              )}
              {activeView === "audit-logs" && (
                <AuditLogs
                  displayPreferences={appSettings.displayPreferences}
                  onViewDetail={(log) => setPageView({ type: "audit-detail", log })}
                />
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

function AppRoot() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return !!localStorage.getItem("token");
  });

  useEffect(() => {
    const handleSessionExpired = async () => {
      await logoutApi();
      setCurrentUser(null);
      setIsLoggedIn(false);
    };
    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, []);

  const handleSignIn = (user?: AuthUser) => {
    if (user) setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    await logoutApi();
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <SignInPage onSignIn={handleSignIn} />;
  }

  return <Shell user={currentUser} onLogout={handleLogout} />;
}

export default function App() {
  return (
    <AppProvider>
      <AppRoot />
    </AppProvider>
  );
}
