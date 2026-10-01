"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type TimerMode = "focus" | "shortBreak" | "longBreak";

type TimerProps = {
  selectedTaskTitle?: string;
  onComplete: (mode: TimerMode) => void;
};

const MODES: { id: TimerMode; label: string; duration: number }[] = [
  { id: "focus", label: "focus", duration: 25 * 60 },
  { id: "shortBreak", label: "short break", duration: 5 * 60 },
  { id: "longBreak", label: "long break", duration: 15 * 60 },
];

function getDuration(mode: TimerMode) {
  return MODES.find((item) => item.id === mode)?.duration ?? MODES[0].duration;
}

export default function Timer({ selectedTaskTitle, onComplete }: TimerProps) {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [remaining, setRemaining] = useState(getDuration("focus"));
  const [isRunning, setIsRunning] = useState(false);
  const deadline = useRef<number | null>(null);
  const modeRef = useRef(mode);
  const onCompleteRef = useRef(onComplete);
  const hasCompleted = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      const endAt = deadline.current;
      if (endAt === null) return;

      const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) {
        window.clearInterval(interval);
        deadline.current = null;
        setIsRunning(false);
        if (!hasCompleted.current) {
          hasCompleted.current = true;
          onCompleteRef.current(modeRef.current);
        }
      }
    }, 200);

    return () => window.clearInterval(interval);
  }, [isRunning]);

  const duration = getDuration(mode);
  const progress = 1 - remaining / duration;
  const radius = 91;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);
  const minutes = Math.floor(remaining / 60).toString().padStart(2, "0");
  const seconds = (remaining % 60).toString().padStart(2, "0");
  const currentMode = MODES.find((item) => item.id === mode) ?? MODES[0];

  function chooseMode(nextMode: TimerMode) {
    deadline.current = null;
    hasCompleted.current = false;
    modeRef.current = nextMode;
    setIsRunning(false);
    setMode(nextMode);
    setRemaining(getDuration(nextMode));
  }

  function toggleTimer() {
    if (isRunning) {
      const endAt = deadline.current;
      if (endAt !== null) setRemaining(Math.max(0, Math.ceil((endAt - Date.now()) / 1000)));
      deadline.current = null;
      setIsRunning(false);
      return;
    }

    const nextRemaining = remaining > 0 ? remaining : duration;
    setRemaining(nextRemaining);
    hasCompleted.current = false;
    deadline.current = Date.now() + nextRemaining * 1000;
    setIsRunning(true);
  }

  function resetTimer() {
    deadline.current = null;
    hasCompleted.current = false;
    setIsRunning(false);
    setRemaining(duration);
  }

  return (
    <section className="timer-card" id="focus" aria-labelledby="timer-title">
      <div className="timer-heading">
        <div>
          <h2 id="timer-title">timer</h2>
        </div>
        <span className={`timer-status${isRunning ? " is-running" : ""}`}>
          <span className="status-dot" /> {isRunning ? "running" : "ready"}
        </span>
      </div>

      <div className="timer-modes" role="group" aria-label="Timer length">
        {MODES.map((item) => (
          <button
            className={mode === item.id ? "is-active" : ""}
            key={item.id}
            type="button"
            onClick={() => chooseMode(item.id)}
            aria-pressed={mode === item.id}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="timer-face" role="timer" aria-label={`${minutes} minutes ${seconds} seconds remaining`}>
        <svg className="timer-ring" viewBox="0 0 220 220" aria-hidden="true">
          <circle className="timer-ring-track" cx="110" cy="110" r={radius} />
          <circle
            className="timer-ring-progress"
            cx="110"
            cy="110"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="timer-readout" aria-live="off">
          <span className="timer-time">{minutes}:{seconds}</span>
          <span className="timer-mode-label">{currentMode.label}</span>
        </div>
      </div>

      <p className="timer-caption">
        {selectedTaskTitle ? (
          <>task: <strong>{selectedTaskTitle}</strong></>
        ) : (
          "no task selected"
        )}
      </p>

      <div className="timer-controls">
        <button className="timer-primary" type="button" onClick={toggleTimer}>
          {isRunning ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
          {isRunning ? "pause" : remaining === 0 ? "again" : "start"}
        </button>
        <button className="timer-reset" type="button" onClick={resetTimer} aria-label="Reset timer">
          <RotateCcw size={17} />
        </button>
      </div>
      <p className="timer-footnote">{mode === "focus" ? "25 on / 5 off" : "rest."}</p>
    </section>
  );
}
