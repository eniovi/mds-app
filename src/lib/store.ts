"use client";

import { useCallback, useSyncExternalStore } from "react";
import { readJSON, writeJSON } from "./storage";

/** A localStorage-backed value that every hook instance shares.
 *
 * The old per-hook `useState` + "read storage on mount" pattern gave each
 * consumer its own copy: the task drawer pushed a run into *its* copy, the
 * activity rail kept showing *its* copy from mount time, and the two only
 * agreed again on the next navigation. That is exactly the "history stops
 * updating after a while" the brief describes. One store, one snapshot,
 * subscribers notified on every write — nothing can go stale.
 *
 * SSR rule preserved: the server (and the hydrating client render) always
 * see `fallback`; localStorage is read once, lazily, on the client, and
 * useSyncExternalStore re-renders subscribers when the two differ. */
export interface PersistedStore<T> {
  get: () => T;
  getServer: () => T;
  set: (updater: (prev: T) => T) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createPersistedStore<T>(key: string, fallback: T): PersistedStore<T> {
  let state: T = fallback;
  let hydrated = false;
  const listeners = new Set<() => void>();

  function hydrate() {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    state = readJSON<T>(key, fallback);
  }

  function notify() {
    listeners.forEach((l) => l());
  }

  return {
    get: () => {
      hydrate();
      return state;
    },
    getServer: () => fallback,
    set: (updater) => {
      hydrate();
      state = updater(state);
      writeJSON(key, state);
      notify();
    },
    subscribe: (listener) => {
      const wasHydrated = hydrated;
      hydrate();
      listeners.add(listener);
      // first subscriber on the client: the snapshot just changed from the
      // server fallback to the stored value, so let React re-check it
      if (!wasHydrated && hydrated) listener();
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** React binding for a PersistedStore — the snapshot plus a stable updater. */
export function usePersistedStore<T>(store: PersistedStore<T>): [T, (updater: (prev: T) => T) => void] {
  const value = useSyncExternalStore(store.subscribe, store.get, store.getServer);
  const update = useCallback((updater: (prev: T) => T) => store.set(updater), [store]);
  return [value, update];
}
