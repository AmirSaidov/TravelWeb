import axios from "axios";

const TOKEN_KEY = "kg_travel_token";

const envBaseUrl = (process.env.NEXT_PUBLIC_API_URL as string | undefined)?.trim();

// Prefer same-origin "/api" (Next rewrites can proxy to the real backend).
const defaultBaseUrl = process.env.NODE_ENV === "development" ? "http://localhost:8000/api" : "/api";

export const tokenStorage = {
  get() {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

export const api = axios.create({
  baseURL: envBaseUrl || defaultBaseUrl,
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers = config.headers ?? ({} as any);
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
