import { FormEvent, useEffect, useMemo, useState } from "react";
import { Provider } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import { ClientDashboardDto, VisitDto } from "@gym/shared-types";
import { Layout } from "../../components/Layout";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { LoginPage } from "../../pages/LoginPage";
import { formatDate, getDaysLeft, getLastVisits, getVisitsThisMonth } from "../../state/common";
import { gymApi, useClientsQuery, useCreateVisitMutation, useDashboardQuery, useDeleteVisitMutation, useLazyDashboardQuery, useLoginMutation, useMeQuery, useUpdateVisitMutation } from "../../state/redux/apiSlice";
import { logout, setCredentials, setCurrentUser } from "../../state/redux/authSlice";
import { useAppDispatch, useAppSelector } from "../../state/redux/hooks";
import { reduxStore } from "../../state/redux/store";

function ReduxShell() {
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const dispatch = useAppDispatch();
  const { data: currentUser } = useMeQuery(undefined, { skip: !token });

  useEffect(() => {
    if (currentUser) {
      dispatch(setCurrentUser(currentUser));
    }
  }, [currentUser, dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<ReduxLoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute user={user}>
            <ReduxDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute user={user}>
            {user?.role === "admin" ? <ReduxClientsPage /> : <Navigate to="/" replace />}
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
    </Routes>
  );
}

function ReduxLoginPage() {
  const [login] = useLoginMutation();
  const dispatch = useAppDispatch();

  const handleLogin = async (email: string, password: string) => {
    const response = await login({ email, password }).unwrap();
    dispatch(setCredentials(response));
  };

  return <LoginPage onLogin={handleLogin} />;
}

function ReduxLayout({ children }: { children: JSX.Element }) {
  const user = useAppSelector((state) => state.auth.user)!;
  const dispatch = useAppDispatch();
  const { data: dashboard } = useDashboardQuery(user.id, { skip: user.role === "admin" });
  const { data: clients = [] } = useClientsQuery(undefined, { skip: user.role !== "admin" });
  const extraInfo =
    user.role === "admin"
      ? `Клиентов: ${clients.filter((client) => client.role === "client").length}`
      : dashboard
        ? `Посещений: ${dashboard.visits.length}`
        : undefined;

  return (
    <Layout
      user={user}
      extraInfo={extraInfo}
      onLogout={() => {
        dispatch(logout());
        dispatch(gymApi.util.resetApiState());
      }}
    >
      {children}
    </Layout>
  );
}

function ReduxDashboardPage() {
  const user = useAppSelector((state) => state.auth.user)!;
  const dispatch = useAppDispatch();
  const { data: clients = [], error: clientsError } = useClientsQuery(undefined, {
    skip: user.role !== "admin"
  });
  const { data: clientDashboard, error: dashboardError } = useDashboardQuery(user.id, {
    skip: user.role === "admin"
  });
  const [triggerDashboard] = useLazyDashboardQuery();
  const clientUsers = useMemo(() => clients.filter((client) => client.role === "client"), [clients]);
  const dashboards = useAppSelector((state) =>
    clientUsers
      .map((client) => gymApi.endpoints.dashboard.select(client.id)(state).data)
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  );

  useEffect(() => {
    if (user.role === "admin") {
      clientUsers.forEach((client) => {
        dispatch(gymApi.endpoints.dashboard.initiate(client.id));
        triggerDashboard(client.id, true);
      });
    }
  }, [clientUsers, dispatch, triggerDashboard, user.role]);

  const allVisits = dashboards.flatMap((dashboard) => dashboard.visits);
  const latestVisits = getLastVisits(dashboards);
  const activeMemberships = dashboards.filter((item) => item.membership?.status === "active").length;

  return (
    <ReduxLayout>
      <>
        <section className="hero-card">
          <p className="eyebrow">Redux RTK</p>
          <h2>{user.role === "admin" ? "Панель администратора" : "Личный кабинет клиента"}</h2>
          <p className="muted">Данные backend загружаются и кэшируются через RTK Query.</p>
        </section>

        {(clientsError || dashboardError) && <p className="error-text">Не удалось загрузить данные</p>}

        {user.role === "admin" ? (
          <>
            <div className="stats-grid">
              <article className="stat-card"><span>Клиенты</span><strong>{clientUsers.length}</strong><small>в базе клуба</small></article>
              <article className="stat-card"><span>Активные абонементы</span><strong>{activeMemberships}</strong><small>сейчас действуют</small></article>
              <article className="stat-card"><span>За месяц</span><strong>{allVisits.filter((visit) => visit.visitDate.startsWith(new Date().toISOString().slice(0, 7))).length}</strong><small>посещений</small></article>
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
          clientDashboard && <ClientDashboardView dashboard={clientDashboard} />
        )}
      </>
    </ReduxLayout>
  );
}

function ClientDashboardView({ dashboard }: { dashboard: ClientDashboardDto }) {
  const daysLeft = dashboard.membership ? getDaysLeft(dashboard.membership.endDate) : null;

  return (
    <div className="grid">
      <article className="card"><p className="eyebrow">Профиль</p><h3>{dashboard.profile.fullName}</h3><p>{dashboard.profile.email}</p><p>Посещений за месяц: {getVisitsThisMonth(dashboard.visits)}</p></article>
      <article className="card"><p className="eyebrow">Абонемент</p><h3>{dashboard.membership?.planName ?? "Не назначен"}</h3><p>{dashboard.membership?.status ?? "n/a"}</p><p>{daysLeft !== null && daysLeft >= 0 ? `Осталось дней: ${daysLeft}` : "Срок не активен"}</p></article>
      <article className="card card-wide">
        <p className="eyebrow">Посещения</p>
        <table className="table"><thead><tr><th>Дата</th><th>Заметка</th></tr></thead><tbody>{dashboard.visits.map((visit) => <tr key={visit.id}><td>{formatDate(visit.visitDate)}</td><td>{visit.notes ?? "-"}</td></tr>)}</tbody></table>
      </article>
    </div>
  );
}

function ReduxClientsPage() {
  const { data: clients = [] } = useClientsQuery();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [triggerDashboard] = useLazyDashboardQuery();
  const [createVisit] = useCreateVisitMutation();
  const [updateVisit] = useUpdateVisitMutation();
  const [deleteVisit] = useDeleteVisitMutation();
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [editingVisit, setEditingVisit] = useState<VisitDto | null>(null);
  const clientUsers = clients.filter((client) => client.role === "client");
  const selectedClientId = selectedId ?? clientUsers[0]?.id ?? null;
  const dashboard = useAppSelector((state) =>
    selectedClientId ? gymApi.endpoints.dashboard.select(selectedClientId)(state).data : undefined
  );

  useEffect(() => {
    if (selectedClientId) {
      triggerDashboard(selectedClientId, true);
    }
  }, [selectedClientId, triggerDashboard]);

  const submitVisit = async (event: FormEvent) => {
    event.preventDefault();
    if (selectedClientId) {
      await createVisit({ userId: selectedClientId, visitDate, notes }).unwrap();
      await triggerDashboard(selectedClientId, false);
    }
  };

  const submitEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (editingVisit) {
      await updateVisit({ id: editingVisit.id, body: { visitDate: editingVisit.visitDate, notes: editingVisit.notes ?? "" } }).unwrap();
      setEditingVisit(null);
    }
  };

  return (
    <ReduxLayout>
      <div>
        <section className="hero-card"><p className="eyebrow">Redux RTK</p><h2>Управление клиентами</h2><p className="muted">Список клиентов и карточки посещений берутся из общего RTK Query кэша.</p></section>
        <div className="grid">
          <article className="card"><p className="eyebrow">Список клиентов</p><div className="client-list">{clientUsers.map((client) => <button className={selectedClientId === client.id ? "client-item active" : "client-item"} key={client.id} onClick={() => setSelectedId(client.id)}><span>{client.fullName}</span><small>{client.email}</small></button>)}</div></article>
          <article className="card card-wide">
            <p className="eyebrow">Карточка клиента</p>
            {dashboard && <>
              <h3>{dashboard.profile.fullName}</h3>
              <div className="stats-grid compact"><article className="stat-card"><span>Посещений</span><strong>{dashboard.visits.length}</strong><small>в истории</small></article><article className="stat-card"><span>За месяц</span><strong>{getVisitsThisMonth(dashboard.visits)}</strong><small>активность</small></article></div>
              <table className="table"><thead><tr><th>Дата</th><th>Заметка</th><th>Действия</th></tr></thead><tbody>{dashboard.visits.map((visit) => <tr key={visit.id}><td>{formatDate(visit.visitDate)}</td><td>{visit.notes ?? "-"}</td><td><div className="table-actions"><button className="secondary-button small-button" onClick={() => setEditingVisit(visit)}>Редактировать</button><button className="danger-button small-button" onClick={() => deleteVisit({ id: visit.id, userId: visit.userId })}>Удалить</button></div></td></tr>)}</tbody></table>
              {editingVisit && <form className="visit-form inline-panel" onSubmit={submitEdit}><p className="eyebrow">Редактирование</p><input type="date" value={editingVisit.visitDate} onChange={(event) => setEditingVisit({ ...editingVisit, visitDate: event.target.value })} /><input value={editingVisit.notes ?? ""} onChange={(event) => setEditingVisit({ ...editingVisit, notes: event.target.value })} /><div className="actions-inline"><button className="primary-button">Сохранить</button><button className="secondary-button" type="button" onClick={() => setEditingVisit(null)}>Отменить</button></div></form>}
              <form className="visit-form" onSubmit={submitVisit}><label>Дата посещения<input type="date" value={visitDate} onChange={(event) => setVisitDate(event.target.value)} /></label><label>Заметка<input value={notes} onChange={(event) => setNotes(event.target.value)} /></label><button className="primary-button">Добавить посещение</button></form>
            </>}
          </article>
        </div>
      </div>
    </ReduxLayout>
  );
}

export function ReduxApp() {
  return (
    <Provider store={reduxStore}>
      <ReduxShell />
    </Provider>
  );
}
