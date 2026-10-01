"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import type { SetStateAction } from "react";

const LOCAL_CHANGE_EVENT = "fogri-local-storage-change";
const EMPTY_ARRAY: unknown[] = [];
const fallbackSnapshots = new Map<string, string>();

function getServerSnapshot() {
  return null;
}

function readSnapshot(key: string) {
  try {
    const snapshot = window.localStorage.getItem(key);
    if (snapshot !== null) {
      fallbackSnapshots.set(key, snapshot);
      return snapshot;
    }
  } catch {
    return fallbackSnapshots.get(key) ?? null;
  }
  return fallbackSnapshots.get(key) ?? null;
}

function parseSnapshot<T>(snapshot: string | null, isValid: (value: unknown) => value is T): T[] {
  if (snapshot === null) return EMPTY_ARRAY as T[];
  try {
    const value: unknown = JSON.parse(snapshot);
    return Array.isArray(value) ? value.filter(isValid) : [];
  } catch {
    return [];
  }
}

function writeSnapshot(key: string, value: unknown) {
  const snapshot = JSON.stringify(value);
  fallbackSnapshots.set(key, snapshot);
  try {
    window.localStorage.setItem(key, snapshot);
  } catch {}
  window.dispatchEvent(new Event(LOCAL_CHANGE_EVENT));
}

export default function usePersistentState<T>(
  key: string,
  isValid: (value: unknown) => value is T,
  legacyKey?: string,
): [T[], (action: SetStateAction<T[]>) => void] {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null) {
        fallbackSnapshots.clear();
        onStoreChange();
      } else if (event.key === key) {
        fallbackSnapshots.delete(key);
        onStoreChange();
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener(LOCAL_CHANGE_EVENT, onStoreChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(LOCAL_CHANGE_EVENT, onStoreChange);
    };
  }, [key]);
  const getSnapshot = useCallback(() => readSnapshot(key), [key]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const value = useMemo(() => parseSnapshot(snapshot, isValid), [isValid, snapshot]);

  useEffect(() => {
    if (!legacyKey) return;

    try {
      if (window.localStorage.getItem(key) !== null) return;
      const legacySnapshot = window.localStorage.getItem(legacyKey);
      if (legacySnapshot === null) return;

      const migrated = JSON.stringify(parseSnapshot(legacySnapshot, isValid));
      window.localStorage.setItem(key, migrated);
      fallbackSnapshots.set(key, migrated);
      window.dispatchEvent(new Event(LOCAL_CHANGE_EVENT));
    } catch {
      // Keep the legacy data in place if storage is unavailable or read-only.
    }
  }, [isValid, key, legacyKey]);

  const setValue = useCallback((action: SetStateAction<T[]>) => {
    const current = parseSnapshot(readSnapshot(key), isValid);
    const next = typeof action === "function"
      ? (action as (previous: T[]) => T[])(current)
      : action;
    writeSnapshot(key, next);
  }, [isValid, key]);

  return [value, setValue];
}
