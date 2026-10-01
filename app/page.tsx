"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ChartNoAxesColumnIncreasing,
  Clock3,
  ListTodo,
} from "lucide-react";
import FocusGrid from "@/components/FocusGrid";
import type { FocusSession } from "@/components/FocusGrid";
import TaskList from "@/components/TaskList";
import type { FocusTask } from "@/components/TaskList";
import Timer from "@/components/Timer";
import type { TimerMode } from "@/components/Timer";
import usePersistentState from "@/lib/use-persistent-state";

const TASKS_KEY = "fogri.tasks.v1";
const SESSIONS_KEY = "fogri.sessions.v1";
const LEGACY_TASKS_KEY = "fogr.tasks.v1";
const LEGACY_SESSIONS_KEY = "fogr.sessions.v1";

function getLocalDayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function isTask(value: unknown): value is FocusTask {
  if (!value || typeof value !== "object") return false;
  const t = value as FocusTask;
  return typeof t.id === "string" && typeof t.title === "string" && typeof t.completed === "boolean";
}

function isSession(value: unknown): value is FocusSession {
  if (!value || typeof value !== "object") return false;
  const s = value as FocusSession;
  return typeof s.id === "string" && typeof s.endedAt === "number" &&
    typeof s.minutes === "number" && (typeof s.taskId === "string" || s.taskId === null);
}

export default function Home() {
  const [tasks, setTasks] = usePersistentState(TASKS_KEY, isTask, LEGACY_TASKS_KEY);
  const [sessions, setSessions] = usePersistentState(SESSIONS_KEY, isSession, LEGACY_SESSIONS_KEY);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [todayKey, setTodayKey] = useState("");
  const selected = tasks.find((t) => t.id === selectedTaskId);
  const done = tasks.filter((t) => t.completed).length;

  useEffect(() => {
    const updateToday = () => setTodayKey(getLocalDayKey());
    updateToday();
    const interval = window.setInterval(updateToday, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const todaySessions = useMemo(() => {
    const [year, month, day] = (todayKey || getLocalDayKey()).split("-").map(Number);
    const d = new Date(year, month, day);
    return sessions.filter((s) => {
      const end = new Date(s.endedAt);
      return end.getFullYear() === d.getFullYear() &&
        end.getMonth() === d.getMonth() &&
        end.getDate() === d.getDate();
    });
  }, [sessions, todayKey]);
  const minutesToday = todaySessions.reduce((total, s) => total + s.minutes, 0);

  const complete = useCallback((mode: TimerMode) => {
    if (mode !== "focus") return;
    const s: FocusSession = {
      id: window.crypto.randomUUID(),
      endedAt: Date.now(),
      taskId: selected?.id ?? null,
      minutes: 25,
    };
    setSessions((current) => [s, ...current]);
  }, [selected?.id, setSessions]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Fogri home">
          <span className="brand-mark">f</span>
          <span>fogri</span>
        </a>

        <div className="sidebar-section">
          <span className="sidebar-label">nav</span>
          <nav className="side-nav" aria-label="Main navigation">
            <a className="side-link is-active" href="#top" aria-current="page"><ChartNoAxesColumnIncreasing size={17} /> today</a>
            <a className="side-link" href="#focus"><Clock3 size={17} /> timer</a>
            <a className="side-link" href="#tasks"><ListTodo size={17} /> tasks</a>
            <a className="side-link" href="#activity"><ChartNoAxesColumnIncreasing size={17} /> this week</a>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-quote">
            <span className="quote-mark">“</span>
            <p>ship it ugly.</p>
          </div>
          <a className="help-link" href="#about">about</a>
        </div>
      </aside>

      <main className="workspace" id="top">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark">f</span> fogri</div>
          <div className="date-chip"><span className="date-dot" /> today</div>
        </header>

        <nav className="mobile-nav" aria-label="Quick navigation">
          <a href="#focus"><Clock3 size={15} /> timer</a>
          <a href="#tasks"><ListTodo size={15} /> tasks</a>
          <a href="#activity"><ChartNoAxesColumnIncreasing size={15} /> week</a>
        </nav>

        <section className="welcome-block" aria-labelledby="welcome-title">
          <div>
            <h1 id="welcome-title">do the thing.</h1>
            <p>pick one task. start the timer. ignore the rest.</p>
          </div>
          <a className="jump-link" href="#focus">start <ArrowUpRight size={16} /></a>
        </section>

        <section className="stats-row" aria-label="Your progress">
          <div className="stat-card">
            <span className="stat-icon sage"><Clock3 size={17} /></span>
            <div><span className="stat-label">focus today</span><strong>{minutesToday}<small> min</small></strong></div>
          </div>
          <div className="stat-card">
            <span className="stat-icon peach"><ListTodo size={17} /></span>
            <div><span className="stat-label">done</span><strong>{done}<small></small></strong></div>
          </div>
          <div className="stat-card">
            <span className="stat-icon lavender"><ChartNoAxesColumnIncreasing size={17} /></span>
            <div><span className="stat-label">sessions</span><strong>{todaySessions.length}<small></small></strong></div>
          </div>
        </section>

        <div className="dashboard-grid">
          <Timer selectedTaskTitle={selected?.title} onComplete={complete} />
          <TaskList
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            onAdd={(title) => {
              const t = { id: window.crypto.randomUUID(), title, completed: false };
              setTasks((current) => [...current, t]);
              setSelectedTaskId(t.id);
            }}
            onSelect={setSelectedTaskId}
            onToggle={(id) => setTasks((current) => current.map((t) => t.id === id ? { ...t, completed: !t.completed } : t))}
            onDelete={(id) => {
              setTasks((current) => current.filter((t) => t.id !== id));
              setSelectedTaskId((current) => current === id ? null : current);
            }}
          />
        </div>

        <FocusGrid sessions={sessions} />

        <footer className="page-footer" id="about">
          <span>nothing here. go work.</span>
          <span>built by sahil</span>
        </footer>
      </main>
    </div>
  );
}
