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

import { refreshTokenApi } from "./authApi";

const BASE_URL = "/api/sap";

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    // Only attempt refresh if we actually have a refresh token
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      const newToken = await refreshTokenApi();
      if (newToken) {
        // Retry with the new access token
        headers["Authorization"] = `Bearer ${newToken}`;
        res = await fetch(url, { ...options, headers });
      } else {
        // Refresh token is also expired/invalid — force logout
        window.dispatchEvent(new Event("auth:session-expired"));
      }
    }
    // If no refresh token existed, just return the 401 response
    // so safeParseResponse can throw a meaningful error instead of logging the user out
  }

  return res;
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
  const res = await fetchWithAuth(`${BASE_URL}/create-user`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return await safeParseResponse(res, "User creation completed");
}

export async function resetPasswordApi(payload: ResetPasswordPayload) {
  const res = await fetchWithAuth(`${BASE_URL}/reset-password`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return await safeParseResponse(res, "Password reset completed");
}

export async function lockUserApi(payload: LockUserPayload) {
  const res = await fetchWithAuth(`${BASE_URL}/lock`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return await safeParseResponse(res, "Lock user operation completed");
}

export async function unlockUserApi(payload: UnlockUserPayload) {
  const res = await fetchWithAuth(`${BASE_URL}/unlock`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return await safeParseResponse(res, "Unlock user operation completed");
}

export async function processBulkCreateApi(payload: BulkCreatePayload) {
  const res = await fetchWithAuth(`${BASE_URL}/bulk-create/process`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return await safeParseResponse(res, "Bulk user creation completed");
}

/**
 * Uploads an Excel file to the backend for parsing and validation preview.
 * Returns an array of parsed row records with validation status.
 * NOTE: Uses raw fetch (not fetchWithAuth) because FormData must NOT set Content-Type manually.
 */
export async function bulkPreviewApi(file: File): Promise<any[]> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const formData = new FormData();
  formData.append("file", file);

  let res = await fetch(`${BASE_URL}/bulk-create/preview`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (res.status === 401) {
    const storedRefresh = localStorage.getItem("refresh_token");
    if (storedRefresh) {
      const newToken = await refreshTokenApi();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        res = await fetch(`${BASE_URL}/bulk-create/preview`, {
          method: "POST",
          headers,
          body: formData,
        });
      } else {
        window.dispatchEvent(new Event("auth:session-expired"));
      }
    }
  }

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text || "Failed to parse server response");
  }
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Preview failed (HTTP ${res.status})`);
  }
  return data;
}
