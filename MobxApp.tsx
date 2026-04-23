import { FormEvent, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Navigate, Route, Routes } from "react-router-dom";
import { VisitDto } from "@gym/shared-types";
import { Layout } from "../../components/Layout";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { LoginPage } from "../../pages/LoginPage";
import { formatDate, getDaysLeft, getLastVisits, getVisitsThisMonth } from "../../state/common";
import { mobxStore } from "../../state/mobx/GymStore";
import { MobxStoreProvider, useMobxStore } from "../../state/mobx/context";

const MobxShell = observer(() => {
  const store = useMobxStore();

  useEffect(() => {
    store.loadCurrentUser().catch(() => store.logout());
  }, [store]);

  return (
    <Routes>
      <Route path="/login" element={<MobxLoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute user={store.currentUser}>
            <MobxDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute user={store.currentUser}>
            {store.currentUser?.role === "admin" ? <MobxClientsPage /> : <Navigate to="/" replace />}
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={store.isAuthenticated ? "/" : "/login"} replace />} />
    </Routes>
  );
});

const MobxLoginPage = observer(() => {
  const store = useMobxStore();
  return <LoginPage onLogin={(email, password) => store.login(email, password)} />;
});

const MobxLayout = observer(({ children }: { children: JSX.Element }) => {
  const store = useMobxStore();
  const user = store.currentUser!;

  useEffect(() => {
    if (user.role === "admin") {
      store.loadClients().catch((error) => {
        store.error = (error as Error).message;
      });
    } else {
      store.loadDashboard(user.id).catch((error) => {
        store.error = (error as Error).message;
      });
    }
  }, [store, user.id, user.role]);

  const extraInfo =
    user.role === "admin"
      ? `Клиентов: ${store.clients.length}`
      : store.currentDashboard
        ? `Посещений: ${store.currentDashboard.visits.length}`
        : undefined;

  return (
    <Layout user={user} extraInfo={extraInfo} onLogout={store.logout}>
      {children}
    </Layout>
  );
});

const MobxDashboardPage = observer(() => {
  const store = useMobxStore();
  const user = store.currentUser!;

  useEffect(() => {
    if (user.role === "admin") {
      store.loadAdminData().catch((error) => {
        store.error = (error as Error).message;
      });
    } else {
      store.loadDashboard(user.id).catch((error) => {
        store.error = (error as Error).message;
      });
    }
  }, [store, user.id, user.role]);

  const dashboards = store.allDashboards;
  const allVisits = dashboards.flatMap((dashboard) => dashboard.visits);
  const latestVisits = getLastVisits(dashboards);
  const activeMemberships = dashboards.filter((dashboard) => dashboard.membership?.status === "active").length;

  return (
    <MobxLayout>
      <>
        <section className="hero-card">
          <p className="eyebrow">MobX</p>
          <h2>{user.role === "admin" ? "Панель администратора" : "Личный кабинет клиента"}</h2>
          <p className="muted">Данные backend хранятся в MobX store с кэшем запросов на 5 минут.</p>
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
                <tbody>{latestVisits.map((visit) => {
                  const profile = dashboards.find((dashboard) => dashboard.profile.id === visit.userId)?.profile;
                  return <tr key={visit.id}><td>{profile?.fullName ?? `Клиент #${visit.userId}`}</td><td>{formatDate(visit.visitDate)}</td><td>{visit.notes ?? "-"}</td></tr>;
                })}</tbody>
              </table>
            </article>
          </>
        ) : (
          store.currentDashboard && <ClientDashboard dashboard={store.currentDashboard} />
        )}
      </>
    </MobxLayout>
  );
});

function ClientDashboard({ dashboard }: { dashboard: NonNullable<typeof mobxStore.currentDashboard> }) {
  const daysLeft = dashboard.membership ? getDaysLeft(dashboard.membership.endDate) : null;

  return (
    <div className="grid">
      <article className="card"><p className="eyebrow">Профиль</p><h3>{dashboard.profile.fullName}</h3><p>{dashboard.profile.email}</p><p>Посещений за месяц: {getVisitsThisMonth(dashboard.visits)}</p></article>
      <article className="card"><p className="eyebrow">Абонемент</p><h3>{dashboard.membership?.planName ?? "Не назначен"}</h3><p>{dashboard.membership?.status ?? "n/a"}</p><p>{daysLeft !== null && daysLeft >= 0 ? `Осталось дней: ${daysLeft}` : "Срок не активен"}</p></article>
      <article className="card card-wide"><p className="eyebrow">Посещения</p><table className="table"><thead><tr><th>Дата</th><th>Заметка</th></tr></thead><tbody>{dashboard.visits.map((visit) => <tr key={visit.id}><td>{formatDate(visit.visitDate)}</td><td>{visit.notes ?? "-"}</td></tr>)}</tbody></table></article>
    </div>
  );
}

const MobxClientsPage = observer(() => {
  const store = useMobxStore();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [editingVisit, setEditingVisit] = useState<VisitDto | null>(null);
  const selectedClientId = selectedId ?? store.clients[0]?.id ?? null;
  const dashboard = selectedClientId ? store.dashboards.get(selectedClientId) : null;

  useEffect(() => {
    store.loadAdminData().catch((error) => {
      store.error = (error as Error).message;
    });
  }, [store]);

  useEffect(() => {
    if (selectedClientId) {
      store.loadDashboard(selectedClientId).catch((error) => {
        store.error = (error as Error).message;
      });
    }
  }, [selectedClientId, store]);

  const submitVisit = async (event: FormEvent) => {
    event.preventDefault();
    if (selectedClientId) {
      await store.createVisit(selectedClientId, visitDate, notes);
    }
  };

  const submitEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (editingVisit) {
      await store.updateVisit(editingVisit.id, editingVisit.userId, editingVisit.visitDate, editingVisit.notes ?? "");
      setEditingVisit(null);
    }
  };

  return (
    <MobxLayout>
      <div>
        <section className="hero-card"><p className="eyebrow">MobX</p><h2>Управление клиентами</h2><p className="muted">Список клиентов и посещения переиспользуют общий MobX кэш.</p></section>
        <div className="grid">
          <article className="card"><p className="eyebrow">Список клиентов</p><div className="client-list">{store.clients.map((client) => <button className={selectedClientId === client.id ? "client-item active" : "client-item"} key={client.id} onClick={() => setSelectedId(client.id)}><span>{client.fullName}</span><small>{client.email}</small></button>)}</div></article>
          <article className="card card-wide">
            <p className="eyebrow">Карточка клиента</p>
            {dashboard && <>
              <h3>{dashboard.profile.fullName}</h3>
              <div className="stats-grid compact"><article className="stat-card"><span>Посещений</span><strong>{dashboard.visits.length}</strong><small>в истории</small></article><article className="stat-card"><span>За месяц</span><strong>{getVisitsThisMonth(dashboard.visits)}</strong><small>активность</small></article></div>
              <table className="table"><thead><tr><th>Дата</th><th>Заметка</th><th>Действия</th></tr></thead><tbody>{dashboard.visits.map((visit) => <tr key={visit.id}><td>{formatDate(visit.visitDate)}</td><td>{visit.notes ?? "-"}</td><td><div className="table-actions"><button className="secondary-button small-button" onClick={() => setEditingVisit(visit)}>Редактировать</button><button className="danger-button small-button" onClick={() => store.deleteVisit(visit.id, visit.userId)}>Удалить</button></div></td></tr>)}</tbody></table>
              {editingVisit && <form className="visit-form inline-panel" onSubmit={submitEdit}><p className="eyebrow">Редактирование</p><input type="date" value={editingVisit.visitDate} onChange={(event) => setEditingVisit({ ...editingVisit, visitDate: event.target.value })} /><input value={editingVisit.notes ?? ""} onChange={(event) => setEditingVisit({ ...editingVisit, notes: event.target.value })} /><div className="actions-inline"><button className="primary-button">Сохранить</button><button className="secondary-button" type="button" onClick={() => setEditingVisit(null)}>Отменить</button></div></form>}
              <form className="visit-form" onSubmit={submitVisit}><label>Дата посещения<input type="date" value={visitDate} onChange={(event) => setVisitDate(event.target.value)} /></label><label>Заметка<input value={notes} onChange={(event) => setNotes(event.target.value)} /></label><button className="primary-button">Добавить посещение</button></form>
            </>}
          </article>
        </div>
      </div>
    </MobxLayout>
  );
});

export function MobxApp() {
  return (
    <MobxStoreProvider value={mobxStore}>
      <MobxShell />
    </MobxStoreProvider>
  );
}
