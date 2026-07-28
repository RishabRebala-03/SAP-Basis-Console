export interface LoginPayload {
  username: string;
  password?: string;
}

export interface User {
  username: string;
  email: string;
  role: string;
}

export async function loginApi(payload: LoginPayload) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data: any = {};
  if (text && text.trim()) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    throw new Error(data.message || data.error || `Login failed (HTTP ${res.status})`);
  }

  if (data.access_token) {
    localStorage.setItem("token", data.access_token);
    if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
    if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
  }

  return data;
}

export async function refreshTokenApi(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    return null;
  }

  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${refreshToken}`,
      },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem("token", data.access_token);
      return data.access_token as string;
    }
  } catch {
    // Network or server error
  }

  return null;
}

export async function logoutApi() {
  const token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refresh_token");

  if (token) {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
    } catch {
      // Ignore network errors on logout
    }
  }

  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export async function forgotPasswordApi(email: string) {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const text = await res.text();
  let data: any = {};
  if (text && text.trim()) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    throw new Error(data.message || data.error || `Forgot password request failed (HTTP ${res.status})`);
  }

  return data;
}

export async function resetPasswordAuthApi(token: string, new_password: string) {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password }),
  });

  const text = await res.text();
  let data: any = {};
  if (text && text.trim()) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    throw new Error(data.message || data.error || `Password reset failed (HTTP ${res.status})`);
  }

  return data;
}
