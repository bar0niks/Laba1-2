import { makeAutoObservable, runInAction } from "mobx";
import { ClientDashboardDto, UserDto } from "@gym/shared-types";
import { api } from "../../api";

const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

export class GymStore {
  token: string | null = localStorage.getItem("token");
  currentUser: UserDto | null = null;
  clients: UserDto[] = [];
  dashboards = new Map<number, ClientDashboardDto>();
  cache = new Map<string, CacheEntry<unknown>>();
  loading = false;
  error = "";

  constructor() {
    const storedUser = localStorage.getItem("user");
    this.currentUser = storedUser ? (JSON.parse(storedUser) as UserDto) : null;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get isAuthenticated() {
    return Boolean(this.token && this.currentUser);
  }

  get currentDashboard() {
    if (!this.currentUser) {
      return null;
    }

    return this.dashboards.get(this.currentUser.id) ?? null;
  }

  get allDashboards() {
    return Array.from(this.dashboards.values());
  }

  private getCached<T>(key: string) {
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;

    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    return null;
  }

  private setCached<T>(key: string, data: T) {
    this.cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  private invalidateDashboard(userId: number) {
    this.cache.delete(`dashboard:${userId}`);
    this.dashboards.delete(userId);
  }

  async login(email: string, password: string) {
    this.loading = true;
    this.error = "";

    try {
      const response = await api.login({ email, password });
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      runInAction(() => {
        this.token = response.token;
        this.currentUser = response.user;
        this.setCached("me", response.user);
      });

      await this.loadCurrentUser(true);
    } catch (error) {
      runInAction(() => {
        this.error = (error as Error).message;
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  logout() {
    this.token = null;
    this.currentUser = null;
    this.clients = [];
    this.dashboards.clear();
    this.cache.clear();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  async loadCurrentUser(force = false) {
    if (!this.token) {
      return null;
    }

    const cached = this.getCached<UserDto>("me");

    if (cached && !force) {
      this.currentUser = cached;
      return cached;
    }

    const user = await api.me();

    runInAction(() => {
      this.currentUser = user;
      this.setCached("me", user);
      localStorage.setItem("user", JSON.stringify(user));
    });

    return user;
  }

  async loadClients(force = false) {
    const cached = this.getCached<UserDto[]>("clients");

    if (cached && !force) {
      this.clients = cached;
      return cached;
    }

    const clients = await api.clients();

    runInAction(() => {
      this.clients = clients.filter((client) => client.role === "client");
      this.setCached("clients", this.clients);
    });

    return this.clients;
  }

  async loadDashboard(userId: number, force = false) {
    const cached = this.getCached<ClientDashboardDto>(`dashboard:${userId}`);

    if (cached && !force) {
      this.dashboards.set(userId, cached);
      return cached;
    }

    const dashboard = await api.dashboard(userId);

    runInAction(() => {
      this.dashboards.set(userId, dashboard);
      this.setCached(`dashboard:${userId}`, dashboard);
    });

    return dashboard;
  }

  async loadAdminData(force = false) {
    const clients = await this.loadClients(force);
    await Promise.all(clients.map((client) => this.loadDashboard(client.id, force)));
  }

  async createVisit(userId: number, visitDate: string, notes: string) {
    await api.createVisit({ userId, visitDate, notes });
    this.invalidateDashboard(userId);
    await this.loadDashboard(userId, true);
  }

  async updateVisit(visitId: number, userId: number, visitDate: string, notes: string) {
    await api.updateVisit(visitId, { visitDate, notes });
    this.invalidateDashboard(userId);
    await this.loadDashboard(userId, true);
  }

  async deleteVisit(visitId: number, userId: number) {
    await api.deleteVisit(visitId);
    this.invalidateDashboard(userId);
    await this.loadDashboard(userId, true);
  }
}

export const mobxStore = new GymStore();
