export interface CreateUserPayload {
  system_id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  init_password?: string;
  user_type?: string;
  email?: string;
  phone?: string;
  valid_from?: string;
  valid_to?: string;
  roles?: string[];
  profiles?: string[];
}

export interface ResetPasswordPayload {
  system_id: string;
  username: string;
  password?: string;
}

export interface LockUserPayload {
  system_id: string;
  username: string;
  reason?: string;
}

export interface UnlockUserPayload {
  system_id: string;
  username: string;
  reason?: string;
}

export interface BulkCreatePayload {
  system_id: string;
  users: Array<{
    username: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    department?: string;
    company?: string;
    user_type?: string;
    init_password?: string;
    valid_from?: string;
    valid_to?: string;
    language?: string;
    profiles?: string[];
    roles?: string[];
    phone?: string;
    is_valid?: boolean;
    errors?: string[];
  }>;
}

const BASE_URL = "/api/sap";

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function safeParseResponse(res: Response, fallbackMsg: string) {
  const text = await res.text();
  let data: any = {};
  if (text && text.trim()) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  } else {
    data = { message: fallbackMsg };
  }

  if (!res.ok) {
    const errMsg = typeof data === "object" ? (data.message || data.msg || data.error || `${fallbackMsg} (HTTP ${res.status})`) : String(data);
    throw new Error(errMsg);
  }
  return data;
}

export async function createSingleUserApi(payload: CreateUserPayload) {
  const res = await fetch(`${BASE_URL}/create-user`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return await safeParseResponse(res, "User creation completed");
}

export async function resetPasswordApi(payload: ResetPasswordPayload) {
  const res = await fetch(`${BASE_URL}/reset-password`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return await safeParseResponse(res, "Password reset completed");
}

export async function lockUserApi(payload: LockUserPayload) {
  const res = await fetch(`${BASE_URL}/lock`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return await safeParseResponse(res, "Lock user operation completed");
}

export async function unlockUserApi(payload: UnlockUserPayload) {
  const res = await fetch(`${BASE_URL}/unlock`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return await safeParseResponse(res, "Unlock user operation completed");
}

export async function processBulkCreateApi(payload: BulkCreatePayload) {
  const res = await fetch(`${BASE_URL}/bulk-create/process`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return await safeParseResponse(res, "Bulk user creation completed");
}

export async function searchUsersApi(systemId: string, username?: string) {
  const params = new URLSearchParams({ system_id: systemId });
  if (username) params.append("username", username);
  const res = await fetch(`${BASE_URL}/user-search?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  return await safeParseResponse(res, "User search completed");
}
