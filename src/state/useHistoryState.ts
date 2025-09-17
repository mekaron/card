import * as React from 'react';

type Updater<T> = T | ((prev: T) => T);

export interface HistoryState<T> {
  present: T;
  commit: (next?: Updater<T>, meta?: unknown) => void;
  setEphemeral: (next: Updater<T>) => void;
  replace: (next: Updater<T>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
  baseline: T;
  log: { at: number; meta?: unknown }[];
}

function resolveUpdater<T>(updater: Updater<T>, prev: T): T {
  return typeof updater === 'function' ? (updater as (value: T) => T)(prev) : updater;
}

export function useHistoryState<T>(initial: T, opts?: { capacity?: number }): HistoryState<T> {
  const capacity = Math.max(1, opts?.capacity ?? 100);
  const [present, setPresent] = React.useState<T>(initial);
  const [past, setPast] = React.useState<T[]>([]);
  const [future, setFuture] = React.useState<T[]>([]);
  const baselineRef = React.useRef<T>(initial);
  const [log, setLog] = React.useState<{ at: number; meta?: unknown }[]>([]);

  const setEphemeral = React.useCallback((next: Updater<T>) => {
    setPresent((prev) => resolveUpdater(next, prev));
  }, []);

  const replace = React.useCallback((next: Updater<T>) => {
    setPresent((prev) => resolveUpdater(next, prev));
    baselineRef.current = resolveUpdater(next, baselineRef.current);
  }, []);

  const commit = React.useCallback(
    (next?: Updater<T>, meta?: unknown) => {
      setPresent((previous) => {
        const desired = next ? resolveUpdater(next, previous) : previous;
        setPast((history) => [baselineRef.current, ...history].slice(0, capacity));
        baselineRef.current = desired;
        setFuture([]);
        setLog((entries) => [{ at: Date.now(), meta }, ...entries].slice(0, capacity));
        return desired;
      });
    },
    [capacity],
  );

  const undo = React.useCallback(() => {
    setPast((pastArr) => {
      if (pastArr.length === 0) return pastArr;

      const [previous, ...rest] = pastArr;
      setFuture((futureArr) => [baselineRef.current, ...futureArr].slice(0, capacity));
      baselineRef.current = previous;
      setPresent(previous);
      return rest;
    });
  }, [capacity]);

  const redo = React.useCallback(() => {
    setFuture((futureArr) => {
      if (futureArr.length === 0) return futureArr;

      const [next, ...rest] = futureArr;
      setPast((history) => [baselineRef.current, ...history].slice(0, capacity));
      baselineRef.current = next;
      setPresent(next);
      return rest;
    });
  }, [capacity]);

  const clear = React.useCallback(() => {
    setPast([]);
    setFuture([]);
    setLog([]);
    baselineRef.current = present;
  }, [present]);

  return {
    present,
    baseline: baselineRef.current,
    commit,
    setEphemeral,
    replace,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    clear,
    log,
  };
}
