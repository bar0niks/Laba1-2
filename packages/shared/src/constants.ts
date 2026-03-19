export const API_ROUTES = {
  auth: {
    register: "/api/auth/register",
    login: "/api/auth/login",
    me: "/api/auth/me"
  },
  clients: {
    me: "/api/clients/me",
    membership: "/api/clients/me/membership",
    visits: "/api/clients/me/visits"
  }
} as const;

export const USER_ROLES = {
  ADMIN: "admin",
  CLIENT: "client"
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

