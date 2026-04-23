import React from "react";
import ReactDOM from "react-dom/client";
import { getSessionUser, getStoredStateManager } from "@gym/frontend-common";
import { ClientsApp } from "./ClientsApp";
import "../../../src/styles.css";

const user = getSessionUser();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {user ? (
      <ClientsApp user={user} stateManager={getStoredStateManager()} />
    ) : (
      <div className="login-page">
        <div className="login-card">
          <p className="eyebrow">Clients MF</p>
          <h1>Нет активной сессии</h1>
          <p className="muted">Clients remote нужно запускать после логина в host-приложении.</p>
        </div>
      </div>
    )}
  </React.StrictMode>
);
