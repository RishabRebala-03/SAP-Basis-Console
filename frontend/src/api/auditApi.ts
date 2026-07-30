import { refreshTokenApi } from "./authApi";

type AuditRequest = Record<string, unknown>;

async function request(url: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  const token = localStorage.getItem("token");
  if (token) headers.Authorization = `Bearer ${token}`;

  let response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    const refreshed = await refreshTokenApi();
    if (refreshed) {
      headers.Authorization = `Bearer ${refreshed}`;
      response = await fetch(url, { ...options, headers });
    }
  }
  return response;
}

export async function getAuditLogsApi() {
  const response = await request("/api/audit?limit=5000");
  if (!response.ok) throw new Error(`Unable to load audit logs (HTTP ${response.status})`);
  return await response.json();
}

export async function createAuditLogApi(payload: AuditRequest) {
  const response = await request("/api/audit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Unable to save audit log (HTTP ${response.status})`);
  return await response.json();
}
