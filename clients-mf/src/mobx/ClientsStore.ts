import { makeAutoObservable, runInAction } from "mobx";
import { ClientDashboardDto, UserDto } from "@gym/shared-types";
import { api } from "@gym/frontend-common";

export class ClientsStore {
  clients: UserDto[] = [];
  dashboards = new Map<number, ClientDashboardDto>();
  loading = false;
  error = "";
  onUnauthorized?: () => void;

  constructor(onUnauthorized?: () => void) {
    this.onUnauthorized = onUnauthorized;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async loadClients() {
    this.loading = true;
    this.error = "";

    try {
      const clients = (await api.clients()).filter((client) => client.role === "client");

      runInAction(() => {
        this.clients = clients;
      });
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

  async loadDashboard(userId: number) {
    try {
      const dashboard = await api.dashboard(userId);
      runInAction(() => {
        this.dashboards.set(userId, dashboard);
      });
    } catch (error) {
      runInAction(() => {
        this.error = (error as Error).message;
      });
    }
  }

  async createVisit(userId: number, visitDate: string, notes: string) {
    await api.createVisit({ userId, visitDate, notes });
    await this.loadDashboard(userId);
  }

  async updateVisit(visitId: number, userId: number, visitDate: string, notes: string) {
    await api.updateVisit(visitId, { visitDate, notes });
    await this.loadDashboard(userId);
  }

  async deleteVisit(visitId: number, userId: number) {
    await api.deleteVisit(visitId);
    await this.loadDashboard(userId);
  }
}
