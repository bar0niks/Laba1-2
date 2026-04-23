import React from "react";
import ReactDOM from "react-dom/client";
import { getSessionUser, getStoredStateManager } from "@gym/frontend-common";
import { DashboardApp } from "./DashboardApp";
import "../../../src/styles.css";

const user = getSessionUser();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {user ? (
      <DashboardApp user={user} stateManager={getStoredStateManager()} />
    ) : (
      <div className="login-page">
        <div className="login-card">
          <p className="eyebrow">Dashboard MF</p>
          <h1>Нет активной сессии</h1>
          <p className="muted">Сначала залогинься в host-приложении на `http://localhost:8080`.</p>
        </div>
      </div>
    )}
  </React.StrictMode>
);
