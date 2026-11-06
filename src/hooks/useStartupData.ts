import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { petsQueryOptions, eventsQueryOptions } from "./queryOptions";

export const STARTUP_TIMEOUT_MS = 20_000;
type Status = "loading" | "ready" | "error";

/** A one-time gate per account, independent of later background refetches. */
export function useStartupData(userId: string | null) {
  const client = useQueryClient();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    userId: string | null;
    attempt: number;
    status: Status;
  }>({ userId, attempt: 0, status: "loading" });

  // Reset before rendering a new account, including signing back into the same
  // account after logout. No frame may reuse another session's ready state.
  if (state.userId !== userId) {
    setState({ userId, attempt, status: "loading" });
  }

  useEffect(() => {
    if (!userId) return;
    let active = true;
    const settle = (status: Status) => {
      if (!active) return;
      active = false;
      clearTimeout(timer);
      setState({ userId, attempt, status });
    };
    const timer = setTimeout(() => settle("error"), STARTUP_TIMEOUT_MS);
    // ensureQueryData reuses successful data even if it became stale while
    // another request failed. Missing/failed queries retain the client's retry.
    void Promise.all([
      client.ensureQueryData(petsQueryOptions()),
      client.ensureQueryData(eventsQueryOptions()),
    ]).then(
      () => settle("ready"),
      () => settle("error"),
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [client, userId, attempt]);

  useEffect(() => {
    if (!userId) return;
    return () => {
      // Prevent work from the previous account from repopulating shared keys.
      void client.cancelQueries({
        queryKey: petsQueryOptions().queryKey,
        exact: true,
      });
      void client.cancelQueries({
        queryKey: eventsQueryOptions().queryKey,
        exact: true,
      });
    };
  }, [client, userId]);

  const status: Status = !userId
    ? "ready"
    : state.userId === userId && state.attempt === attempt
      ? state.status
      : "loading";
  const retry = () => {
    // A timed-out request may still be stuck. Restart missing data on explicit
    // retry; cancellation also prevents its late response from replacing it.
    for (const queryKey of [
      petsQueryOptions().queryKey,
      eventsQueryOptions().queryKey,
    ]) {
      void client.cancelQueries({
        queryKey,
        exact: true,
        predicate: (query) => query.state.data === undefined,
      });
    }
    setAttempt((value) => value + 1);
  };
  return { status, retry };
}
