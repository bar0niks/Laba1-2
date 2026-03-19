import type { UserRole } from "./constants";
export interface ApiError {
    message: string;
}
export interface AuthUser {
    id: number;
    email: string;
    fullName: string;
    role: UserRole;
}
export interface RegisterRequest {
    email: string;
    password: string;
    fullName: string;
    phone: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface AuthResponse {
    token: string;
    user: AuthUser;
}
export interface ClientProfile {
    userId: number;
    phone: string;
    emergencyContact: string;
    goals: string;
}
export interface Membership {
    id: number;
    userId: number;
    planName: string;
    validUntil: string;
    visitsLeft: number;
}
export interface VisitEntry {
    id: number;
    userId: number;
    visitedAt: string;
    trainer: string;
    notes: string;
}
export interface DashboardResponse {
    user: AuthUser;
    profile: ClientProfile;
    membership: Membership | null;
    visits: VisitEntry[];
}
