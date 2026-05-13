import axios from "axios";

const TOKEN_KEY = "kg_travel_token";

const envBaseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

// In production, never default to localhost; prefer same-origin "/api" (reverse proxy) unless configured otherwise.
const defaultBaseUrl = import.meta.env.DEV ? "http://localhost:8000/api" : "/api";

if (!envBaseUrl && import.meta.env.PROD) {
  // eslint-disable-next-line no-console
  console.warn(
    "[api] VITE_API_URL is not set; defaulting to '/api'. Set VITE_API_URL at build time to your backend origin (e.g. https://api.example.com/api)."
  );
}

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
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
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
