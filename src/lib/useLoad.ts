import { useCallback, useEffect, useState } from "react";

/** Tiny async loader for repository calls (client-side, after mount). */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [tick, setTick] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);
  useEffect(() => {
    let alive = true;
    run().then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, [run, tick]);
  return { data, reload: () => setTick((t) => t + 1) };
}
