// API 호출 시 인증 헤더를 자동으로 붙여주는 헬퍼
export function getHeaders(): Record<string, string> {
  const stored = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const headers: Record<string, string> = {};
  if (stored) {
    const user = JSON.parse(stored);
    headers["x-user-id"] = String(user.id);
  }
  return headers;
}

export async function apiFetch(url: string, options: RequestInit = {}) {
  const authHeaders = getHeaders();
  const res = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...(options.headers || {}),
    },
  });
  return res;
}

export async function apiJson(url: string, options: RequestInit = {}) {
  const res = await apiFetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  return res;
}

// FormData 전송 (Content-Type 자동 설정)
export async function apiForm(url: string, body: FormData) {
  const authHeaders = getHeaders();
  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders,
    body,
  });
  return res;
}
