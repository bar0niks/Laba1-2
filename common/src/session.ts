import { LoginResponseDto } from "@gym/shared-types";
import { SessionUser, StateManager } from "./types";

const TOKEN_KEY = "token";
const USER_KEY = "user";
const STATE_MANAGER_KEY = "stateManager";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getSessionUser() {
  const storedUser = localStorage.getItem(USER_KEY);
  return storedUser ? (JSON.parse(storedUser) as SessionUser) : null;
}

export function saveSession(response: LoginResponseDto) {
  localStorage.setItem(TOKEN_KEY, response.token);
  localStorage.setItem(USER_KEY, JSON.stringify(response.user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredStateManager(defaultValue: StateManager = "mobx") {
  const storedValue = localStorage.getItem(STATE_MANAGER_KEY);
  return storedValue === "redux" || storedValue === "mobx" ? storedValue : defaultValue;
}

export function setStoredStateManager(value: StateManager) {
  localStorage.setItem(STATE_MANAGER_KEY, value);
}
