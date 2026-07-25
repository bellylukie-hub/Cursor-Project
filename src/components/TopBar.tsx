"use client";

import { useState } from "react";
import { priorityAlerts } from "@/lib/mock-data";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const [alertsOpen, setAlertsOpen] = useState(false);
  const count = priorityAlerts.length;

  return (
    <header className="topbar">
      <div className="topbar-titles">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>

      <div className="topbar-actions">
        <label className="global-search">
          <span className="sr-only">Search</span>
          <input type="search" placeholder="Search trip, truck, driver…" />
        </label>

        <div className="alert-anchor">
          <button
            type="button"
            className="alert-bell"
            aria-expanded={alertsOpen}
            onClick={() => setAlertsOpen((v) => !v)}
          >
            Alerts
            {count > 0 ? <span className="alert-count">{count}</span> : null}
          </button>

          {alertsOpen && (
            <div className="alert-panel" role="dialog" aria-label="Priority alerts">
              <div className="alert-panel-head">
                <strong>Priority focus</strong>
                <button type="button" onClick={() => setAlertsOpen(false)}>
                  Close
                </button>
              </div>
              <ul>
                {priorityAlerts.map((alert) => (
                  <li key={alert.id} className={`alert-item alert-${alert.level}`}>
                    <div className="alert-item-top">
                      <span className="alert-level">{alert.level}</span>
                      <span>{alert.timeRemaining}</span>
                    </div>
                    <p className="alert-truck">
                      {alert.truck} · {alert.trip}
                    </p>
                    <p>
                      {alert.area} — {alert.process}
                    </p>
                    <p className="alert-next">Next: {alert.nextAction}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="user-chip">
          <span className="user-avatar" aria-hidden>
            OM
          </span>
          <div>
            <strong>Ops Manager</strong>
            <span>Demo role</span>
          </div>
        </div>
      </div>
    </header>
  );
}
