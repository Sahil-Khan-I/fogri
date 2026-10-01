"use client";

import { useSyncExternalStore } from "react";

export type FocusSession = {
  id: string;
  endedAt: number;
  taskId: string | null;
  minutes: number;
};

type FocusGridProps = {
  sessions: FocusSession[];
};

function sameDay(a: Date, d: Date) {
  return a.getFullYear() === d.getFullYear() &&
    a.getMonth() === d.getMonth() &&
    a.getDate() === d.getDate();
}

function subscribe(onStoreChange: () => void) {
  const interval = window.setInterval(onStoreChange, 60_000);
  return () => window.clearInterval(interval);
}

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getServerToday() {
  return "";
}

export default function FocusGrid({ sessions }: FocusGridProps) {
  const snapshot = useSyncExternalStore(subscribe, getToday, getServerToday);
  const today = snapshot ? new Date() : null;
  const monday = today ? new Date(today) : null;
  if (monday && today) {
    monday.setHours(0, 0, 0, 0);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  }

  const days = monday && today ? Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const count = sessions.filter((s) => sameDay(new Date(s.endedAt), d)).length;
    return {
      date: d,
      count,
      label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(d),
      isToday: sameDay(d, today),
    };
  }) : [];
  const weeklyTotal = days.reduce((total, d) => total + d.count, 0);
  const peak = Math.max(1, ...days.map((d) => d.count));
  const weekEnd = monday ? new Date(monday) : null;
  if (weekEnd) weekEnd.setDate(weekEnd.getDate() + 7);
  const weeklyMinutes = sessions
    .filter((s) => monday && weekEnd && s.endedAt >= monday.getTime() && s.endedAt < weekEnd.getTime())
    .reduce((total, s) => total + s.minutes, 0);

  return (
    <section className="panel rhythm-panel" id="activity" aria-labelledby="rhythm-title">
      <div className="panel-heading rhythm-heading">
        <h2 id="rhythm-title">this week</h2>
      </div>

      <div
        className="chart-area"
        role="img"
        aria-label={`${weeklyTotal} focus sessions this week. ${days.map((d) => `${d.label}: ${d.count}`).join(", ")}.`}
      >
        {days.map((d) => (
          <div className={`chart-day${d.isToday ? " is-today" : ""}`} key={d.date.toISOString()}>
            <span className="chart-count">{d.count > 0 ? d.count : ""}</span>
            <div className="chart-track">
              <div
                className="chart-bar"
                style={{ height: d.count > 0 ? `${Math.max(8, (d.count / peak) * 100)}%` : "0%" }}
              />
            </div>
            <span className="chart-label">{d.label}</span>
          </div>
        ))}
      </div>

      <div className="rhythm-footer">
        <div className="rhythm-stats">
          <span><strong>{weeklyTotal}</strong> sessions</span>
          <span><strong>{weeklyMinutes}</strong> min</span>
        </div>
      </div>
    </section>
  );
}
