"use client";

import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";

export type FocusTask = {
  id: string;
  title: string;
  completed: boolean;
};

type TaskListProps = {
  tasks: FocusTask[];
  selectedTaskId: string | null;
  onAdd: (title: string) => void;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function TaskList({
  tasks,
  selectedTaskId,
  onAdd,
  onSelect,
  onToggle,
  onDelete,
}: TaskListProps) {
  const [draft, setDraft] = useState("");
  const left = tasks.filter((t) => !t.completed).length;

  return (
    <section className="panel task-panel" id="tasks" aria-labelledby="tasks-title">
      <div className="panel-heading">
        <div>
          <h2 id="tasks-title">tasks</h2>
        </div>
        <span className="task-count">{left} left</span>
      </div>

      <form
        className="task-form"
        onSubmit={(e) => {
          e.preventDefault();
          const t = draft.trim();
          if (!t) return;
          onAdd(t);
          setDraft("");
        }}
      >
        <label className="visually-hidden" htmlFor="new-task">
          Add a task
        </label>
        <input
          id="new-task"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="what are you doing"
          maxLength={120}
        />
        <button className="add-task-button" type="submit" aria-label="Add task" disabled={!draft.trim()}>
          <Plus size={18} strokeWidth={2.2} />
        </button>
      </form>

      {tasks.length > 0 ? (
        <ul className="task-list">
          {tasks.map((t) => {
            const selected = selectedTaskId === t.id;
            return (
              <li className={`task-row${selected ? " is-selected" : ""}`} key={t.id}>
                <button
                  className={`task-check${t.completed ? " is-complete" : ""}`}
                  type="button"
                  onClick={() => onToggle(t.id)}
                  aria-label={t.completed ? `Mark ${t.title} as incomplete` : `Complete ${t.title}`}
                  aria-pressed={t.completed}
                >
                  {t.completed && <Check size={14} strokeWidth={2.5} />}
                </button>
                <button
                  className={`task-title${t.completed ? " is-complete" : ""}`}
                  type="button"
                  onClick={() => onSelect(t.id)}
                  aria-pressed={selected}
                  title={selected ? "linked to the timer" : "focus this task"}
                >
                  {t.title}
                </button>
                <button
                  className="delete-task-button"
                  type="button"
                  onClick={() => onDelete(t.id)}
                  aria-label={`Delete ${t.title}`}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="empty-tasks">
          <span className="empty-task-mark"><Check size={18} /></span>
          <p>no tasks. add one.</p>
        </div>
      )}

      {tasks.length > 0 && (
        <p className="task-hint">click a task to link it to the timer</p>
      )}
    </section>
  );
}
