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
  { id: "sys-1", systemId: "PRD", systemName: "Production", client: "100", environment: "Production", host: "sap-prd.corp.local", description: "Live production environment — handle with care", status: "Active", createdAt: "2026-01-10T08:00:00Z", createdBy: "ADMIN" },
  { id: "sys-2", systemId: "QAS", systemName: "Quality Assurance", client: "200", environment: "Quality", host: "sap-qas.corp.local", description: "Pre-production testing and UAT environment", status: "Active", createdAt: "2026-01-10T08:05:00Z", createdBy: "ADMIN" },
  { id: "sys-3", systemId: "DEV", systemName: "Development", client: "300", environment: "Development", host: "sap-dev.corp.local", description: "Developer sandbox for customizations and transports", status: "Active", createdAt: "2026-01-10T08:10:00Z", createdBy: "ADMIN" },
  { id: "sys-4", systemId: "SBX", systemName: "Sandbox", client: "400", environment: "Sandbox", host: "sap-sbx.corp.local", description: "Free-form exploration and training environment", status: "Inactive", createdAt: "2026-02-14T11:30:00Z", createdBy: "BASIS01" },
  { id: "sys-5", systemId: "BW1", systemName: "BW Production", client: "100", environment: "Production", host: "sap-bw1.corp.local", description: "SAP BW/BI reporting production system", status: "Active", createdAt: "2026-03-01T09:00:00Z", createdBy: "ADMIN" },
];

const INITIAL_LOGS: AuditLog[] = [
  { id: "log-001", timestamp: "2026-07-22T09:15:42Z", module: "Single User", action: "Create User", targetObject: "ALICE.SMITH", system: "PRD", client: "100", performedBy: "ADMIN", status: "Success", ipAddress: "10.42.8.201", sessionId: SESSION_ID, durationMs: 1240, details: "User created with roles Z_FI_ACCOUNTANT. Valid 2026-01-01 to 2026-12-31.", changesAfter: "User ALICE.SMITH provisioned in PRD/100" },
  { id: "log-002", timestamp: "2026-07-22T09:02:11Z", module: "Lock/Unlock", action: "Lock User", targetObject: "BOB.JONES", system: "PRD", client: "100", performedBy: "ADMIN", status: "Success", ipAddress: "10.42.8.201", sessionId: SESSION_ID, durationMs: 820, details: "User locked due to security policy violation.", changesBefore: "Status: Active", changesAfter: "Status: Locked" },
  { id: "log-003", timestamp: "2026-07-22T08:47:05Z", module: "Bulk User", action: "Bulk Import", targetObject: "6 records", system: "QAS", client: "200", performedBy: "ADMIN", status: "Warning", ipAddress: "10.42.8.201", sessionId: SESSION_ID, durationMs: 4520, details: "4 users created, 2 failed. Failures: duplicate username (row 2), missing last name (row 6).", changesAfter: "4 users provisioned in QAS/200" },
  { id: "log-004", timestamp: "2026-07-22T08:30:19Z", module: "Password Reset", action: "Reset Password", targetObject: "CAROL.WHITE", system: "PRD", client: "100", performedBy: "BASIS01", status: "Success", ipAddress: "10.42.9.88", sessionId: "SES-AB12CD34", durationMs: 1050, details: "Temporary password assigned. User must change on next login.", changesBefore: "Password: ****", changesAfter: "Temporary password set" },
  { id: "log-005", timestamp: "2026-07-21T17:44:00Z", module: "Lock/Unlock", action: "Lock User", targetObject: "CAROL.WHITE", system: "PRD", client: "100", performedBy: "BASIS01", status: "Success", ipAddress: "10.42.9.88", sessionId: "SES-AB12CD34", durationMs: 790, details: "Account locked — multiple failed login attempts detected.", changesBefore: "Status: Active", changesAfter: "Status: Locked" },
  { id: "log-006", timestamp: "2026-07-21T14:20:33Z", module: "Lock/Unlock", action: "Unlock User", targetObject: "DAVID.BROWN", system: "QAS", client: "200", performedBy: "ADMIN", status: "Success", ipAddress: "10.42.8.201", sessionId: "SES-EF56GH78", durationMs: 680, details: "Account unlocked after security review approval.", changesBefore: "Status: Locked", changesAfter: "Status: Active" },
  { id: "log-007", timestamp: "2026-07-21T11:05:17Z", module: "Single User", action: "Create User", targetObject: "EVE.TAYLOR", system: "DEV", client: "300", performedBy: "ADMIN", status: "Failed", ipAddress: "10.42.8.201", sessionId: "SES-EF56GH78", durationMs: 350, details: "User creation failed — username already exists in target system.", errorCode: "RFC_SYSFAIL_USREXIST", changesBefore: undefined, changesAfter: undefined },
  { id: "log-008", timestamp: "2026-07-21T09:30:00Z", module: "Data Management", action: "Add System", targetObject: "BW1", system: "—", client: "—", performedBy: "ADMIN", status: "Success", ipAddress: "10.42.8.201", sessionId: "SES-IJ90KL12", durationMs: 210, details: "New SAP BW Production system entry added to the system registry.", changesAfter: "System BW1 registered with host sap-bw1.corp.local" },
  { id: "log-009", timestamp: "2026-07-20T16:12:44Z", module: "Bulk User", action: "Bulk Import", targetObject: "12 records", system: "PRD", client: "100", performedBy: "BASIS01", status: "Success", ipAddress: "10.42.9.88", sessionId: "SES-MN34OP56", durationMs: 8910, details: "All 12 records processed successfully. No validation errors.", changesAfter: "12 users provisioned in PRD/100" },
  { id: "log-010", timestamp: "2026-07-20T10:00:00Z", module: "Password Reset", action: "Reset Password", targetObject: "FRANK.LEE", system: "PRD", client: "100", performedBy: "ADMIN", status: "Failed", ipAddress: "10.42.8.201", sessionId: "SES-MN34OP56", durationMs: 280, details: "User FRANK.LEE not found in system PRD/100.", errorCode: "BAPI_USER_NOT_FOUND" },
  { id: "log-011", timestamp: "2026-07-19T14:55:22Z", module: "Data Management", action: "Edit System", targetObject: "SBX", system: "—", client: "—", performedBy: "ADMIN", status: "Success", ipAddress: "10.42.8.201", sessionId: "SES-QR78ST90", durationMs: 190, details: "System status changed from Active to Inactive.", changesBefore: "Status: Active", changesAfter: "Status: Inactive" },
  { id: "log-012", timestamp: "2026-07-19T09:20:10Z", module: "Single User", action: "Create User", targetObject: "GRACE.HO", system: "QAS", client: "200", performedBy: "BASIS01", status: "Success", ipAddress: "10.42.9.88", sessionId: "SES-QR78ST90", durationMs: 1380, details: "User provisioned with roles Z_SD_SALES, Z_MM_PURCHASER.", changesAfter: "User GRACE.HO provisioned in QAS/200" },
];

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
