import { useEffect, useState } from "react";
import type { AuthResponse, DashboardResponse } from "@gym/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// режим авторизации или регистрации
type AuthMode = "login" | "register";

type FormState = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
};

// начальное состояние формы авторизации
const emptyAuthState: FormState = {
  email: "",
  password: "",
  fullName: "",
  phone: ""
};

// форматирование даты
const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("ru-RU") : "-";


export function App() {
  // режим авторизации или регистрации
  const [mode, setMode] = useState<AuthMode>("login");
  // форма авторизации или регистрации
  const [form, setForm] = useState<FormState>(emptyAuthState);
  // авторизованный пользователь (токен)
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  // данные кабинета
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  // сообщение
  const [message, setMessage] = useState("Авторизуйтесь, чтобы открыть персональный кабинет.");
  // загрузка
  const [loading, setLoading] = useState(false);

  
  useEffect(() => {
    const token = localStorage.getItem("gym-token");
    const user = localStorage.getItem("gym-user");

    if (token && user) {
      setAuth({ token, user: JSON.parse(user) });
    }
  }, []);


  useEffect(() => {
    if (!auth) {
      setDashboard(null);
      return;
    }

    setLoading(true);
    void fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${auth.token}`
      }
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Не удалось загрузить данные кабинета.");
        }

        return (await response.json()) as DashboardResponse;
      })
      .then((data) => {
        setDashboard(data);
      })
      .catch((error: Error) => {
        setMessage(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [auth]);

  // отправка формы авторизации или регистрации
  const submit = async () => {
    setLoading(true);
    const endpoint =
      mode === "login" ? "/api/auth/login" : "/api/auth/register";

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = (await response.json()) as AuthResponse | { message: string };

      if (!response.ok || !("token" in data)) {
        setMessage("message" in data ? data.message : "Ошибка авторизации.");
        return;
      }

      localStorage.setItem("gym-token", data.token);
      localStorage.setItem("gym-user", JSON.stringify(data.user));
      setAuth(data);
      setMessage(
        mode === "login"
          ? "Вход выполнен. Данные загружаются."
          : "Аккаунт создан. Кабинет активирован."
      );
      setForm(emptyAuthState);
    } finally {
      setLoading(false);
    }
  };

  
  const updateProfile = async () => {
    if (!auth || !dashboard) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/clients/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          emergencyContact: dashboard.profile.emergencyContact,
          goals: dashboard.profile.goals
        })
      });

      if (!response.ok) {
        setMessage("Не удалось сохранить профиль.");
        return;
      }

      setMessage("Изменения профиля сохранены.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("gym-token");
    localStorage.removeItem("gym-user");
    setAuth(null);
    setDashboard(null);
    setMessage("Сессия завершена.");
  };

  return (
    <div className="shell">
      <div className="noise" />

      <header className="topbar">
        <div className="brandline">
          <span className="brand-badge">LR12</span>
          <div>
            <h1>Личный кабинет клиента спортивного зала</h1>
          </div>
        </div>

        <div className="top-actions">
          <a href={`${API_URL}/docs`} target="_blank" rel="noreferrer">
            API docs
          </a>
          {auth ? (
            <button className="ghost-button" onClick={logout}>
              Выйти
            </button>
          ) : null}
        </div>
      </header>

      <main className="editorial-layout">
        <section className="hero-card">
          <div className="hero-grid">
            <div>
              <p className="hero-lead">Все основные данные клиента на одном экране.</p>
            </div>

            <div className="hero-stats">
              <article className="stat-block">
                <span>Система</span>
                <strong>{loading ? "Загрузка" : "Готово"}</strong>
              </article>
              <article className="stat-block">
                <span>Клиент</span>
                <strong>{auth?.user.fullName ?? "Гость"}</strong>
              </article>
              <article className="stat-block">
                <span>Визиты</span>
                <strong>{dashboard?.visits.length ?? 0}</strong>
              </article>
            </div>
          </div>
        </section>

        <aside className="rail-card">
          <div className="rail-header">
            <p className="eyebrow">{mode === "login" ? "Вход" : "Регистрация"}</p>
            <button
              className="link-button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Создать аккаунт" : "У меня уже есть аккаунт"}
            </button>
          </div>

          <div className="status-ribbon">
            <span className="status-ping" />
            <p>{message}</p>
          </div>

          <div className="form-grid">
            {mode === "register" ? (
              <>
                <label>
                  ФИО
                  <input
                    placeholder="Например, Анна Иванова"
                    value={form.fullName}
                    onChange={(event) =>
                      setForm({ ...form, fullName: event.target.value })
                    }
                  />
                </label>
                <label>
                  Телефон
                  <input
                    placeholder="+7 (900) 123-45-67"
                    value={form.phone}
                    onChange={(event) =>
                      setForm({ ...form, phone: event.target.value })
                    }
                  />
                </label>
              </>
            ) : null}

            <label>
              Email
              <input
                placeholder="client@gym.local"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
              />
            </label>

            <label>
              Пароль
              <input
                placeholder="Введите пароль"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
              />
            </label>
          </div>

          <button className="primary-button" onClick={submit} disabled={loading}>
            {mode === "login" ? "Открыть кабинет" : "Активировать профиль"}
          </button>
        </aside>

        <section className="dashboard-card">
          <div className="dashboard-header">
            <div>
              <p className="eyebrow">Кабинет</p>
              <h2>Персональные данные и активность</h2>
            </div>
            <span className="role-chip">{dashboard?.user.role ?? "guest"}</span>
          </div>

          {!dashboard ? (
            <div className="empty-state">
              <h3>Кабинет пока не загружен</h3>
              <p>
                Войдите или зарегистрируйтесь, чтобы увидеть абонемент,
                контакты и историю посещений.
              </p>
            </div>
          ) : (
            <div className="dashboard-grid">
              <article className="profile-card">
                <span className="section-tag">Профиль</span>
                <h3>{dashboard.user.fullName}</h3>
                <p>{dashboard.user.email}</p>
                <p>{dashboard.profile.phone}</p>
              </article>

              <article className="membership-card">
                <span className="section-tag">Абонемент</span>
                <h3>{dashboard.membership?.planName ?? "Не назначен"}</h3>
                <p>Действует до {formatDate(dashboard.membership?.validUntil)}</p>
                <strong>
                  Осталось посещений: {dashboard.membership?.visitsLeft ?? 0}
                </strong>
              </article>

              <article className="editor-card">
                <div className="editor-head">
                  <span className="section-tag">Экстренный контакт</span>
                </div>
                <textarea
                  value={dashboard.profile.emergencyContact}
                  onChange={(event) =>
                    setDashboard({
                      ...dashboard,
                      profile: {
                        ...dashboard.profile,
                        emergencyContact: event.target.value
                      }
                    })
                  }
                />
              </article>

              <article className="editor-card">
                <div className="editor-head">
                  <span className="section-tag">Цели тренировок</span>
                </div>
                <textarea
                  value={dashboard.profile.goals}
                  onChange={(event) =>
                    setDashboard({
                      ...dashboard,
                      profile: {
                        ...dashboard.profile,
                        goals: event.target.value
                      }
                    })
                  }
                />
              </article>

              <article className="visits-card">
                <div className="visits-header">
                  <div>
                    <span className="section-tag">Посещения</span>
                    <h3>История</h3>
                  </div>
                  <button className="ghost-button" onClick={updateProfile}>
                    Сохранить профиль
                  </button>
                </div>

                <ul className="visits-list">
                  {dashboard.visits.map((visit, index) => (
                    <li key={visit.id}>
                      <span className="visit-index">{String(index + 1).padStart(2, "0")}</span>
                      <div className="visit-copy">
                        <div className="visit-meta">
                          <strong>{formatDate(visit.visitedAt)}</strong>
                          <span>{visit.trainer}</span>
                        </div>
                        <p>{visit.notes}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
