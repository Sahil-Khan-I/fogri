# Fogri

Fogri is a small, local-first focus dashboard with a Pomodoro timer, task list, and weekly session chart.

## Run locally

```bash
npm install
npm run dev
```

## How it works

- Add a task and select it to link it to the timer.
- Focus sessions are saved when a 25-minute focus timer completes. Break timers do not add sessions.
- Tasks and sessions stay in this browser using local storage.
- Existing data saved by the earlier `fogr` name is copied to Fogri's storage keys the first time the app loads.

## Checks

```bash
npm run lint
npm run build
```
