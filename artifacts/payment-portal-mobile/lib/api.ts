const getApiBase = () => {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/api`;
  return "http://localhost:8080/api";
};

type RequestOptions = {
  token?: string;
  body?: unknown;
};

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, body } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${getApiBase()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const e = await res.json();
      errMsg = e.message || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export const api = {
  get: <T>(path: string, token?: string) =>
    request<T>("GET", path, { token }),
  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>("POST", path, { body, token }),
  put: <T>(path: string, body: unknown, token?: string) =>
    request<T>("PUT", path, { body, token }),
  patch: <T>(path: string, body: unknown, token?: string) =>
    request<T>("PATCH", path, { body, token }),
  delete: <T>(path: string, token?: string) =>
    request<T>("DELETE", path, { token }),
};
