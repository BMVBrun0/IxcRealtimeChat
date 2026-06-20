import { ApiEnvelope, AuthSession, ChatMessage, UserSummary } from "@/types";
import { API_BASE_URL, AUTH_COOKIE_NAME } from "./constants";
import { getCookie } from "./cookies";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const buildHeaders = (initHeaders?: HeadersInit, body?: BodyInit | null) => {
  const headers = new Headers(initHeaders);
  const token = getCookie(AUTH_COOKIE_NAME);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
};

const request = async <T>(path: string, init?: RequestInit) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(init?.headers, init?.body),
    cache: "no-store"
  });

  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | { message?: string } | null;

  if (!response.ok || !body || !("success" in body) || !body.success) {
    throw new ApiError(body?.message ?? "A requisição falhou.", response.status);
  }

  return body.data;
};

export const api = {
  login: (payload: { username: string; password: string }) =>
    request<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  register: (payload: { name: string; username: string; password: string }) =>
    request<AuthSession>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  me: () => request<UserSummary>("/auth/me"),
  logout: () =>
    request<null>("/auth/logout", {
      method: "POST"
    }),
  users: () => request<UserSummary[]>("/users"),
  conversation: (userId: string) => request<ChatMessage[]>(`/messages/${userId}`),
  updateAvatar: (file: File) => {
    const body = new FormData();
    body.append("avatar", file);

    return request<UserSummary>("/users/profile/avatar", {
      method: "POST",
      body
    });
  }
};
