import { createContext, useContext, useState, useCallback, ReactNode } from "react";

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
  addSystem: (s: Omit<SapSystem, "id" | "createdAt" | "createdBy">) => void;
  updateSystem: (id: string, s: Partial<SapSystem>) => void;
  deleteSystem: (id: string) => void;
  auditLogs: AuditLog[];
  logAction: (entry: Omit<AuditLog, "id" | "timestamp" | "performedBy" | "ipAddress" | "sessionId">) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const SESSION_ID = "SES-" + Math.random().toString(36).slice(2, 10).toUpperCase();
const ADMIN_USER = "ADMIN";
const ADMIN_IP = "10.42.8.201";

const INITIAL_SYSTEMS: SapSystem[] = [
  { id: "sys-shd", systemId: "SHD", systemName: "SHD", client: "100", environment: "Development", host: "183.82.103.80:8011", description: "SHD Development (Client 100)", status: "Active", createdAt: "2026-01-10T08:00:00Z", createdBy: "ADMIN" },
  { id: "sys-emp", systemId: "EMP", systemName: "EMP", client: "100", environment: "Development", host: "49.206.197.17:8031", description: "EMP Development (Client 100)", status: "Active", createdAt: "2026-01-10T08:10:00Z", createdBy: "ADMIN" },
  { id: "sys-emq", systemId: "EMQ", systemName: "EMQ", client: "100", environment: "Development", host: "49.206.197.17:8033", description: "EMQ Development (Client 100)", status: "Active", createdAt: "2026-01-10T08:05:00Z", createdBy: "ADMIN" },
  { id: "sys-emd", systemId: "EMD", systemName: "EMD", client: "100", environment: "Development", host: "49.206.197.17:8006", description: "EMD Development (Client 100)", status: "Active", createdAt: "2026-02-14T11:30:00Z", createdBy: "ADMIN" },
];

const INITIAL_LOGS: AuditLog[] = [];

export function AppProvider({ children }: { children: ReactNode }) {
  const [systems, setSystems] = useState<SapSystem[]>(INITIAL_SYSTEMS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_LOGS);

  const addSystem = useCallback((s: Omit<SapSystem, "id" | "createdAt" | "createdBy">) => {
    const newSys: SapSystem = {
      ...s,
      id: "sys-" + Date.now(),
      createdAt: new Date().toISOString(),
      createdBy: ADMIN_USER,
    };
    setSystems((prev) => [newSys, ...prev]);
    return newSys;
  }, []);

  const updateSystem = useCallback((id: string, patch: Partial<SapSystem>) => {
    setSystems((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const deleteSystem = useCallback((id: string) => {
    setSystems((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const logAction = useCallback((entry: Omit<AuditLog, "id" | "timestamp" | "performedBy" | "ipAddress" | "sessionId">) => {
    const log: AuditLog = {
      ...entry,
      id: "log-" + Date.now(),
      timestamp: new Date().toISOString(),
      performedBy: ADMIN_USER,
      ipAddress: ADMIN_IP,
      sessionId: SESSION_ID,
    };
    setAuditLogs((prev) => [log, ...prev]);
  }, []);

  return (
    <AppContext.Provider value={{ systems, addSystem, updateSystem, deleteSystem, auditLogs, logAction }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
}
