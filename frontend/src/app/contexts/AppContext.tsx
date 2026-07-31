import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { createAuditLogApi, getAuditLogsApi } from "../../api/auditApi";
import { getSystemsApi } from "../../api/sapApi";
import { getCurrentUser } from "../../api/authApi";

export interface SapSystem {
  id: string;
  systemId: string;
  systemName: string;
  client: string;
  environment: "Production" | "Quality" | "Development" | "Sandbox";
  host: string;
  description: string;
  status: "Active" | "Inactive";
  createdAt: string;
  createdBy: string;
}

export type AuditModule = "Single User" | "Bulk User" | "Password Reset" | "Lock/Unlock" | "Data Management" | "System";
export type AuditStatus = "Success" | "Failed" | "Warning";

export interface AuditLog {
  id: string;
  timestamp: string;
  module: AuditModule;
  action: string;
  targetObject: string;
  system: string;
  client: string;
  performedBy: string;
  status: AuditStatus;
  ipAddress: string;
  sessionId: string;
  durationMs: number;
  details: string;
  errorCode?: string;
  changesBefore?: string;
  changesAfter?: string;
}

interface AppContextValue {
  systems: SapSystem[];
  systemsLoading: boolean;
  refreshSystems: () => Promise<void>;
  addSystem: (s: Omit<SapSystem, "id" | "createdAt" | "createdBy">) => void;
  updateSystem: (id: string, s: Partial<SapSystem>) => void;
  deleteSystem: (id: string) => void;
  auditLogs: AuditLog[];
  logAction: (entry: Omit<AuditLog, "id" | "timestamp" | "performedBy" | "ipAddress" | "sessionId">) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const SESSION_ID = "SES-" + Math.random().toString(36).slice(2, 10).toUpperCase();

const ACTION_LABELS: Record<string, { module: AuditModule; action: string }> = {
  create_user:      { module: "Single User",    action: "Create User" },
  bulk_create:      { module: "Bulk User",      action: "Bulk Import" },
  reset_password:   { module: "Password Reset", action: "Reset Password" },
  lock_user:        { module: "Lock/Unlock",    action: "Lock User" },
  unlock_user:      { module: "Lock/Unlock",    action: "Unlock User" },
  assign_roles:     { module: "Single User",    action: "Assign Roles" },
  assign_profiles:  { module: "Single User",    action: "Assign Profiles" },
  extend_validity:  { module: "Single User",    action: "Extend Validity" },
};

/** Maps a raw backend system document (from /api/sap/systems) to the frontend SapSystem shape. */
function mapSystem(raw: any): SapSystem {
  // The original list_systems returns _normalized_system() format (system_id, name, description, client, environment, url)
  const systemId = (raw.system_id || raw.systemId || "").toUpperCase();
  return {
    id:          raw._id || raw.id || `sys-${systemId.toLowerCase()}`,
    systemId,
    systemName:  raw.name || raw.system_name || raw.systemName || systemId,
    client:      raw.client || "100",
    environment: (raw.environment as SapSystem["environment"]) || "Development",
    host:        raw.host || raw.url || "",
    description: raw.description || `${systemId} Development`,
    status:      (raw.status as SapSystem["status"]) || "Active",
    createdAt:   raw.created_at || raw.createdAt || new Date().toISOString(),
    createdBy:   raw.created_by || raw.createdBy || "System",
  };
}

function mapAuditLog(raw: any): AuditLog {
  const mapped = ACTION_LABELS[raw.action] || { module: raw.module || "System", action: raw.action || "System Action" };
  const payload = raw.payload || {};
  const response = raw.response || {};
  const timestamp = raw.timestamp || new Date().toISOString();
  return {
    id:            raw.id || raw._id || `log-${timestamp}`,
    timestamp,
    module:        mapped.module as AuditModule,
    action:        raw.displayAction || mapped.action,
    targetObject:  raw.target_object || raw.targetObject || payload.targetObject || payload.username || payload.Username || "—",
    system:        raw.sap_system || raw.system || "—",
    client:        raw.client || payload.client || "100",
    performedBy:   raw.username || raw.performedBy || "Unknown",
    status:        raw.status === "Warning" ? "Warning" : raw.status === "Failed" ? "Failed" : "Success",
    ipAddress:     raw.ip_address || raw.ipAddress || "Unavailable",
    sessionId:     raw.session_id || raw.sessionId || "—",
    durationMs:    raw.durationMs ?? Math.round(Number(raw.duration || 0) * 1000),
    details:       raw.details || response.Message || response.message || response.error || "",
    errorCode:     raw.error_code || raw.errorCode,
    changesBefore: raw.changes_before || raw.changesBefore,
    changesAfter:  raw.changes_after || raw.changesAfter,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [systems, setSystems] = useState<SapSystem[]>([]);
  const [systemsLoading, setSystemsLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  /* ── Audit Logs ── */
  const refreshAuditLogs = useCallback(async () => {
    if (!localStorage.getItem("token")) return;
    try {
      const data = await getAuditLogsApi();
      setAuditLogs((data.logs || []).map(mapAuditLog));
    } catch {
      // Keep current view when audit service is temporarily unavailable.
    }
  }, []);

  /* ── Systems — loaded from backend on mount, mutated locally thereafter ── */
  const refreshSystems = useCallback(async () => {
    if (!localStorage.getItem("token")) return;
    setSystemsLoading(true);
    try {
      const data = await getSystemsApi();
      setSystems(data.map(mapSystem));
    } catch {
      // Keep current state on failure.
    } finally {
      setSystemsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAuditLogs();
    void refreshSystems();
    const handleAuthChanged = () => {
      void refreshAuditLogs();
      void refreshSystems();
    };
    window.addEventListener("auth:changed", handleAuthChanged);
    return () => window.removeEventListener("auth:changed", handleAuthChanged);
  }, [refreshAuditLogs, refreshSystems]);

  /* ── Systems CRUD — local state only (no backend CRUD endpoints) ── */

  const addSystem = useCallback((s: Omit<SapSystem, "id" | "createdAt" | "createdBy">) => {
    const newSys: SapSystem = {
      ...s,
      id: "sys-" + Date.now(),
      createdAt: new Date().toISOString(),
      createdBy: getCurrentUser()?.username || "Unknown",
    };
    setSystems((prev) => [newSys, ...prev]);
  }, []);

  const updateSystem = useCallback((id: string, patch: Partial<SapSystem>) => {
    setSystems((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const deleteSystem = useCallback((id: string) => {
    setSystems((prev) => prev.filter((s) => s.id !== id));
  }, []);

  /* ── Audit Logging ── */
  const logAction = useCallback((entry: Omit<AuditLog, "id" | "timestamp" | "performedBy" | "ipAddress" | "sessionId">) => {
    const log: AuditLog = {
      ...entry,
      id:          "log-" + Date.now(),
      timestamp:   new Date().toISOString(),
      performedBy: getCurrentUser()?.username || "Unknown",
      ipAddress:   "Unavailable",
      sessionId:   SESSION_ID,
    };
    setAuditLogs((prev) => [log, ...prev]);
    const clientOnlyAction = entry.module === "Data Management" || entry.module === "System";
    if (clientOnlyAction) {
      void createAuditLogApi(entry).then(() => refreshAuditLogs()).catch(() => {});
    } else {
      void refreshAuditLogs();
    }
  }, [refreshAuditLogs]);

  return (
    <AppContext.Provider value={{ systems, systemsLoading, refreshSystems, addSystem, updateSystem, deleteSystem, auditLogs, logAction }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
}
