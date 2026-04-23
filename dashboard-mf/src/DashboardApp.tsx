import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Provider, useDispatch, useSelector } from "react-redux";
import {
  formatDate,
  getDaysLeft,
  getLastVisits,
  getVisitsThisMonth
} from "@gym/frontend-common";
import type { RemotePageProps } from "@gym/frontend-common";
import { dashboardApi, useClientsQuery, useDashboardQuery } from "./redux/apiSlice";
import { reduxStore, RootState } from "./redux/store";
import { DashboardStore } from "./mobx/DashboardStore";

const MobxDashboardPage = observer(({ user, onUnauthorized }: RemotePageProps) => {
  const [store] = useState(() => new DashboardStore(user, onUnauthorized));

  useEffect(() => {
    void store.load();
  }, [store]);

  const dashboards = store.allDashboards;
  const allVisits = dashboards.flatMap((dashboard) => dashboard.visits);
  const latestVisits = getLastVisits(dashboards);
  const activeMemberships = dashboards.filter((dashboard) => dashboard.membership?.status === "active").length;

  return (
    <>
      <section className="hero-card">
        <p className="eyebrow">Dashboard MF · MobX</p>
        <h2>{user.role === "admin" ? "Панель администратора" : "Личный кабинет клиента"}</h2>
      </section>

      {store.error && <p className="error-text">{store.error}</p>}

      {user.role === "admin" ? (
        <>
          <div className="stats-grid">
            <article className="stat-card"><span>Клиенты</span><strong>{store.clients.length}</strong><small>в базе клуба</small></article>
            <article className="stat-card"><span>Активные абонементы</span><strong>{activeMemberships}</strong><small>сейчас действуют</small></article>
            <article className="stat-card"><span>За месяц</span><strong>{getVisitsThisMonth(allVisits)}</strong><small>посещений</small></article>
            <article className="stat-card"><span>Всего посещений</span><strong>{allVisits.length}</strong><small>по всем клиентам</small></article>
          </div>
          <article className="card card-wide">
            <p className="eyebrow">Последняя активность</p>
            <table className="table">
              <thead><tr><th>Клиент</th><th>Дата</th><th>Заметка</th></tr></thead>
              <tbody>
                {latestVisits.map((visit) => {
                  const profile = dashboards.find((dashboard) => dashboard.profile.id === visit.userId)?.profile;
                  return <tr key={visit.id}><td>{profile?.fullName ?? `Клиент #${visit.userId}`}</td><td>{formatDate(visit.visitDate)}</td><td>{visit.notes ?? "-"}</td></tr>;
                })}
              </tbody>
            </table>
          </article>
        </>
      ) : (
        store.currentDashboard && <ClientDashboard dashboard={store.currentDashboard} />
      )}
    </>
  );
});

function ReduxDashboardContent({ user }: RemotePageProps) {
  const dispatch = useDispatch<typeof reduxStore.dispatch>();
  const { data: clients = [], error: clientsError } = useClientsQuery(undefined, {
    skip: user.role !== "admin"
  });
  const { data: dashboard, error: dashboardError } = useDashboardQuery(user.id, {
    skip: user.role === "admin"
  });
  const clientUsers = clients.filter((client) => client.role === "client");
  const clientIdsKey = clientUsers.map((client) => client.id).join(",");
  const dashboards = useSelector((state: RootState) =>
    clientUsers
      .map((client) => dashboardApi.endpoints.dashboard.select(client.id)(state).data)
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  );

  useEffect(() => {
    if (!clientUsers.length) {
      return;
    }

    const subscriptions = clientUsers.map((client) =>
      dispatch(dashboardApi.endpoints.dashboard.initiate(client.id, { forceRefetch: true }))
    );

    return () => {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
    };
  }, [clientIdsKey, dispatch]);

  const allVisits = dashboards.flatMap((item) => item.visits);
  const latestVisits = getLastVisits(dashboards);
  const activeMemberships = dashboards.filter((item) => item.membership?.status === "active").length;

  return (
    <>
      <section className="hero-card">
        <p className="eyebrow">Dashboard MF · Redux</p>
        <h2>{user.role === "admin" ? "Панель администратора" : "Личный кабинет клиента"}</h2>
      </section>

      {(clientsError || dashboardError) && <p className="error-text">Не удалось загрузить данные dashboard remote.</p>}

      {user.role === "admin" ? (
        <>
          <div className="stats-grid">
            <article className="stat-card"><span>Клиенты</span><strong>{clientUsers.length}</strong><small>в базе клуба</small></article>
            <article className="stat-card"><span>Активные абонементы</span><strong>{activeMemberships}</strong><small>сейчас действуют</small></article>
            <article className="stat-card"><span>За месяц</span><strong>{getVisitsThisMonth(allVisits)}</strong><small>посещений</small></article>
            <article className="stat-card"><span>Всего посещений</span><strong>{allVisits.length}</strong><small>по всем клиентам</small></article>
          </div>
          <article className="card card-wide">
            <p className="eyebrow">Последняя активность</p>
            <table className="table">
              <thead><tr><th>Клиент</th><th>Дата</th><th>Заметка</th></tr></thead>
              <tbody>
                {latestVisits.map((visit) => {
                  const profile = dashboards.find((item) => item.profile.id === visit.userId)?.profile;
                  return <tr key={visit.id}><td>{profile?.fullName ?? `Клиент #${visit.userId}`}</td><td>{formatDate(visit.visitDate)}</td><td>{visit.notes ?? "-"}</td></tr>;
                })}
              </tbody>
            </table>
          </article>
        </>
      ) : (
        dashboard && <ClientDashboard dashboard={dashboard} />
      )}
    </>
  );
}

function ClientDashboard({ dashboard }: { dashboard: NonNullable<DashboardStore["currentDashboard"]> }) {
  const daysLeft = dashboard.membership ? getDaysLeft(dashboard.membership.endDate) : null;

  return (
    <div className="grid">
      <article className="card"><p className="eyebrow">Профиль</p><h3>{dashboard.profile.fullName}</h3><p>{dashboard.profile.email}</p><p>Посещений за месяц: {getVisitsThisMonth(dashboard.visits)}</p></article>
      <article className="card"><p className="eyebrow">Абонемент</p><h3>{dashboard.membership?.planName ?? "Не назначен"}</h3><p>{dashboard.membership?.status ?? "n/a"}</p><p>{daysLeft !== null && daysLeft >= 0 ? `Осталось дней: ${daysLeft}` : "Срок не активен"}</p></article>
      <article className="card card-wide"><p className="eyebrow">Посещения</p><table className="table"><thead><tr><th>Дата</th><th>Заметка</th></tr></thead><tbody>{dashboard.visits.map((visit) => <tr key={visit.id}><td>{formatDate(visit.visitDate)}</td><td>{visit.notes ?? "-"}</td></tr>)}</tbody></table></article>
    </div>
  );
}

export function DashboardApp(props: RemotePageProps) {
  if (props.stateManager === "mobx") {
    return <MobxDashboardPage {...props} />;
  }

  return (
    <Provider store={reduxStore}>
      <ReduxDashboardContent {...props} />
    </Provider>
  );
}
