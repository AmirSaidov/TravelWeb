import axios from "axios";

const TOKEN_KEY = "kg_travel_token";

const envBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim();

// In production, prefer same-origin `/api` (reverse proxy) unless configured otherwise.
const defaultBaseUrl = process.env.NODE_ENV === "development" ? "http://localhost:8000/api" : "/api";

export const tokenStorage = {
  get() {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore
    }
  },
  clear() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

export const api = axios.create({
  baseURL: envBaseUrl || defaultBaseUrl,
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) tokenStorage.clear();
    return Promise.reject(err);
  }
);
