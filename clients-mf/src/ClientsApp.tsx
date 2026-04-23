import { FormEvent, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Provider, useSelector } from "react-redux";
import { VisitDto } from "@gym/shared-types";
import { formatDate, getVisitsThisMonth, RemotePageProps } from "@gym/frontend-common";
import { ClientsStore } from "./mobx/ClientsStore";
import {
  clientsApi,
  useClientsQuery,
  useCreateVisitMutation,
  useDeleteVisitMutation,
  useLazyDashboardQuery,
  useUpdateVisitMutation
} from "./redux/apiSlice";
import { reduxStore, RootState } from "./redux/store";

const MobxClientsPage = observer(({ onUnauthorized }: RemotePageProps) => {
  const [store] = useState(() => new ClientsStore(onUnauthorized));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [editingVisit, setEditingVisit] = useState<VisitDto | null>(null);
  const selectedClientId = selectedId ?? store.clients[0]?.id ?? null;
  const dashboard = selectedClientId ? store.dashboards.get(selectedClientId) : null;

  useEffect(() => {
    void store.loadClients();
  }, [store]);

  useEffect(() => {
    if (selectedClientId) {
      void store.loadDashboard(selectedClientId);
    }
  }, [selectedClientId, store]);

  const submitVisit = async (event: FormEvent) => {
    event.preventDefault();
    if (selectedClientId) {
      await store.createVisit(selectedClientId, visitDate, notes);
      setNotes("");
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
    <div>
      <section className="hero-card"><p className="eyebrow">Clients MF · MobX</p><h2>Управление клиентами</h2></section>
      {store.error && <p className="error-text">{store.error}</p>}
      <div className="grid">
        <article className="card"><p className="eyebrow">Список клиентов</p><div className="client-list">{store.clients.map((client) => <button className={selectedClientId === client.id ? "client-item active" : "client-item"} key={client.id} onClick={() => setSelectedId(client.id)}><span>{client.fullName}</span><small>{client.email}</small></button>)}</div></article>
        <article className="card card-wide">
          <p className="eyebrow">Карточка клиента</p>
          {dashboard && <>
            <h3>{dashboard.profile.fullName}</h3>
            <div className="stats-grid compact"><article className="stat-card"><span>Посещений</span><strong>{dashboard.visits.length}</strong><small>в истории</small></article><article className="stat-card"><span>За месяц</span><strong>{getVisitsThisMonth(dashboard.visits)}</strong><small>активность</small></article></div>
            <table className="table"><thead><tr><th>Дата</th><th>Заметка</th><th>Действия</th></tr></thead><tbody>{dashboard.visits.map((visit) => <tr key={visit.id}><td>{formatDate(visit.visitDate)}</td><td>{visit.notes ?? "-"}</td><td><div className="table-actions"><button className="secondary-button small-button" onClick={() => setEditingVisit(visit)}>Редактировать</button><button className="danger-button small-button" onClick={() => void store.deleteVisit(visit.id, visit.userId)}>Удалить</button></div></td></tr>)}</tbody></table>
            {editingVisit && <form className="visit-form inline-panel" onSubmit={submitEdit}><p className="eyebrow">Редактирование</p><input type="date" value={editingVisit.visitDate} onChange={(event) => setEditingVisit({ ...editingVisit, visitDate: event.target.value })} /><input value={editingVisit.notes ?? ""} onChange={(event) => setEditingVisit({ ...editingVisit, notes: event.target.value })} /><div className="actions-inline"><button className="primary-button">Сохранить</button><button className="secondary-button" type="button" onClick={() => setEditingVisit(null)}>Отменить</button></div></form>}
            <form className="visit-form" onSubmit={submitVisit}><label>Дата посещения<input type="date" value={visitDate} onChange={(event) => setVisitDate(event.target.value)} /></label><label>Заметка<input value={notes} onChange={(event) => setNotes(event.target.value)} /></label><button className="primary-button">Добавить посещение</button></form>
          </>}
        </article>
      </div>
    </div>
  );
});

function ReduxClientsContent() {
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
  const dashboard = useSelector((state: RootState) =>
    selectedClientId ? clientsApi.endpoints.dashboard.select(selectedClientId)(state).data : undefined
  );

  useEffect(() => {
    if (selectedClientId) {
      void triggerDashboard(selectedClientId, true);
    }
  }, [selectedClientId, triggerDashboard]);

  const submitVisit = async (event: FormEvent) => {
    event.preventDefault();
    if (selectedClientId) {
      await createVisit({ userId: selectedClientId, visitDate, notes }).unwrap();
      setNotes("");
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
    <div>
      <section className="hero-card"><p className="eyebrow">Clients MF · Redux</p><h2>Управление клиентами</h2></section>
      <div className="grid">
        <article className="card"><p className="eyebrow">Список клиентов</p><div className="client-list">{clientUsers.map((client) => <button className={selectedClientId === client.id ? "client-item active" : "client-item"} key={client.id} onClick={() => setSelectedId(client.id)}><span>{client.fullName}</span><small>{client.email}</small></button>)}</div></article>
        <article className="card card-wide">
          <p className="eyebrow">Карточка клиента</p>
          {dashboard && <>
            <h3>{dashboard.profile.fullName}</h3>
            <div className="stats-grid compact"><article className="stat-card"><span>Посещений</span><strong>{dashboard.visits.length}</strong><small>в истории</small></article><article className="stat-card"><span>За месяц</span><strong>{getVisitsThisMonth(dashboard.visits)}</strong><small>активность</small></article></div>
            <table className="table"><thead><tr><th>Дата</th><th>Заметка</th><th>Действия</th></tr></thead><tbody>{dashboard.visits.map((visit) => <tr key={visit.id}><td>{formatDate(visit.visitDate)}</td><td>{visit.notes ?? "-"}</td><td><div className="table-actions"><button className="secondary-button small-button" onClick={() => setEditingVisit(visit)}>Редактировать</button><button className="danger-button small-button" onClick={() => void deleteVisit({ id: visit.id, userId: visit.userId })}>Удалить</button></div></td></tr>)}</tbody></table>
            {editingVisit && <form className="visit-form inline-panel" onSubmit={submitEdit}><p className="eyebrow">Редактирование</p><input type="date" value={editingVisit.visitDate} onChange={(event) => setEditingVisit({ ...editingVisit, visitDate: event.target.value })} /><input value={editingVisit.notes ?? ""} onChange={(event) => setEditingVisit({ ...editingVisit, notes: event.target.value })} /><div className="actions-inline"><button className="primary-button">Сохранить</button><button className="secondary-button" type="button" onClick={() => setEditingVisit(null)}>Отменить</button></div></form>}
            <form className="visit-form" onSubmit={submitVisit}><label>Дата посещения<input type="date" value={visitDate} onChange={(event) => setVisitDate(event.target.value)} /></label><label>Заметка<input value={notes} onChange={(event) => setNotes(event.target.value)} /></label><button className="primary-button">Добавить посещение</button></form>
          </>}
        </article>
      </div>
    </div>
  );
}

export function ClientsApp(props: RemotePageProps) {
  if (props.user.role !== "admin") {
    return (
      <section className="hero-card">
        <p className="eyebrow">Clients MF</p>
        <h2>Доступ ограничен</h2>
        <p className="muted">Этот remote доступен только администратору.</p>
      </section>
    );
  }

  if (props.stateManager === "mobx") {
    return <MobxClientsPage {...props} />;
  }

  return (
    <Provider store={reduxStore}>
      <ReduxClientsContent />
    </Provider>
  );
}
