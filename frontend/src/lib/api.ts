const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("mjc_token") : null;

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),

  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: "POST", body: JSON.stringify(data) }),

  put: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: "PUT", body: JSON.stringify(data) }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: "DELETE" }),

  upload: <T>(endpoint: string, formData: FormData) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("mjc_token") : null;
    return fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then((res) => {
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      return res.json() as Promise<T>;
    });
  },
};
