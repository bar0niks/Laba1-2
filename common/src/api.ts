import {
  ClientDashboardDto,
  CreateClientDto,
  CreateVisitDto,
  LoginRequestDto,
  LoginResponseDto,
  UpdateVisitDto,
  UserDto,
  VisitDto
} from "@gym/shared-types";
import { getToken } from "./session";

const API_URL = "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message ?? "Request failed");
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  login: (payload: LoginRequestDto) =>
    request<LoginResponseDto>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  me: () => request<UserDto>("/users/me"),
  clients: () => request<UserDto[]>("/clients"),
  createClient: (payload: CreateClientDto) =>
    request<UserDto>("/clients", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  dashboard: (id: number) => request<ClientDashboardDto>(`/clients/${id}/dashboard`),
  createVisit: (payload: CreateVisitDto) =>
    request<VisitDto>("/visits", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateVisit: (id: number, payload: UpdateVisitDto) =>
    request<VisitDto>(`/visits/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteVisit: (id: number) =>
    request<void>(`/visits/${id}`, {
      method: "DELETE"
    })
};
