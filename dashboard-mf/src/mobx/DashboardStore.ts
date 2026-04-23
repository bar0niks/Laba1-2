import { makeAutoObservable, runInAction } from "mobx";
import { ClientDashboardDto, UserDto } from "@gym/shared-types";
import { api, SessionUser } from "@gym/frontend-common";

export class DashboardStore {
  user: SessionUser;
  clients: UserDto[] = [];
  dashboards = new Map<number, ClientDashboardDto>();
  loading = false;
  error = "";
  onUnauthorized?: () => void;

  constructor(user: SessionUser, onUnauthorized?: () => void) {
    this.user = user;
    this.onUnauthorized = onUnauthorized;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get currentDashboard() {
    return this.dashboards.get(this.user.id) ?? null;
  }

  get allDashboards() {
    return Array.from(this.dashboards.values());
  }

  async load() {
    this.loading = true;
    this.error = "";

    try {
      if (this.user.role === "admin") {
        const clients = (await api.clients()).filter((client) => client.role === "client");
        const dashboards = await Promise.all(clients.map((client) => api.dashboard(client.id)));

        runInAction(() => {
          this.clients = clients;
          this.dashboards.clear();
          dashboards.forEach((dashboard) => {
            this.dashboards.set(dashboard.profile.id, dashboard);
          });
        });
      } else {
        const dashboard = await api.dashboard(this.user.id);
        runInAction(() => {
          this.dashboards.set(this.user.id, dashboard);
        });
      }
    } catch (error) {
      runInAction(() => {
        this.error = (error as Error).message;
      });

      if ((error as Error).message === "Unauthorized") {
        this.onUnauthorized?.();
      }
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }
}
