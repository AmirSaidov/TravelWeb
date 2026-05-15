import { api, tokenStorage } from "./client";
import type { User } from "@/store/app";

type ApiUser = { id: number; name: string; email: string; created_at?: string | null };

const mapUser = (u: ApiUser): User => ({
  id: String(u.id),
  name: u.name,
  email: u.email,
  avatar: "",
  createdAt: u.created_at ?? undefined,
});

export const authApi = {
  async login(input: { email: string; password: string }) {
    const { data } = await api.post<{ token: string; user: ApiUser }>("/auth/login/", input);
    tokenStorage.set(data.token);
    return { token: data.token, user: mapUser(data.user) };
  },
  async register(input: { name: string; email: string; password: string }) {
    const { data } = await api.post<{ token: string; user: ApiUser }>("/auth/register/", input);
    tokenStorage.set(data.token);
    return { token: data.token, user: mapUser(data.user) };
  },
  async profile() {
    const { data } = await api.get<ApiUser>("/profile/");
    return mapUser(data);
  },
  logout() {
    tokenStorage.clear();
  },
};

