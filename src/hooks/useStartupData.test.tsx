import { act, renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { listPets } from "@/services/pets";
import { listMedicalEvents } from "@/services/medicalEvents";
import { usePets, useEvents } from "./queries";
import { STARTUP_TIMEOUT_MS, useStartupData } from "./useStartupData";

jest.mock("@/services/pets", () => ({ listPets: jest.fn() }));
jest.mock("@/services/medicalEvents", () => ({ listMedicalEvents: jest.fn() }));
jest.mock("@/services/profile", () => ({}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function setup(retry: number | false = false) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry, retryDelay: 10, staleTime: 30_000, gcTime: Infinity },
    },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}
const pets = jest.mocked(listPets);
const events = jest.mocked(listMedicalEvents);
beforeEach(() => {
  jest.useFakeTimers();
  pets.mockReset().mockResolvedValue([]);
  events.mockReset().mockResolvedValue([]);
});
afterEach(() => jest.useRealTimers());
const flush = () =>
  act(async () => {
    await Promise.resolve();
  });

it("starts both requests together and waits for both, including empty results", async () => {
  const pending = deferred<[]>();
  events.mockReturnValue(pending.promise);
  const { client, wrapper } = setup();
  const { result, unmount } = await renderHook(() => useStartupData("owner"), {
    wrapper,
  });
  await flush();
  expect(pets).toHaveBeenCalledTimes(1);
  expect(events).toHaveBeenCalledTimes(1);
  expect(result.current.status).toBe("loading");
  await act(async () => {
    pending.resolve([]);
  });
  expect(result.current.status).toBe("ready");
  const home = await renderHook(
    () => ({ pets: usePets(), events: useEvents() }),
    { wrapper },
  );
  expect(home.result.current.pets.isPending).toBe(false);
  expect(home.result.current.events.isPending).toBe(false);
  expect(pets).toHaveBeenCalledTimes(1);
  expect(events).toHaveBeenCalledTimes(1);
  await home.unmount();
  await unmount();
  client.clear();
});

it("does not request private data without a session and gates again on sign-in", async () => {
  const { client, wrapper } = setup();
  const { result, rerender, unmount } = await renderHook(
    ({ id }: { id: string | null }) => useStartupData(id),
    { wrapper, initialProps: { id: null } },
  );
  expect(result.current.status).toBe("ready");
  expect(pets).not.toHaveBeenCalled();
  await rerender({ id: "owner" });
  await flush();
  expect(result.current.status).toBe("ready");
  await rerender({ id: null });
  client.clear();
  events.mockReturnValue(new Promise(() => {}));
  await rerender({ id: "owner" });
  expect(result.current.status).toBe("loading");
  await unmount();
  client.clear();
});

it("keeps the error after a late response and reuses it only on explicit retry", async () => {
  const pending = deferred<[]>();
  events.mockReturnValue(pending.promise);
  const { client, wrapper } = setup();
  const { result, unmount } = await renderHook(() => useStartupData("owner"), {
    wrapper,
  });
  await act(async () => {
    jest.advanceTimersByTime(STARTUP_TIMEOUT_MS);
  });
  expect(result.current.status).toBe("error");
  await act(async () => {
    pending.resolve([]);
  });
  expect(result.current.status).toBe("error");
  await act(async () => {
    result.current.retry();
  });
  await flush();
  expect(result.current.status).toBe("ready");
  expect(events).toHaveBeenCalledTimes(1);
  await unmount();
  client.clear();
});

it("restarts a stuck request on retry and ignores its old response", async () => {
  const stuck = deferred<[]>();
  const restarted = deferred<[]>();
  events
    .mockReturnValueOnce(stuck.promise)
    .mockReturnValueOnce(restarted.promise);
  const { client, wrapper } = setup();
  const { result, unmount } = await renderHook(() => useStartupData("owner"), {
    wrapper,
  });
  await act(async () => {
    jest.advanceTimersByTime(STARTUP_TIMEOUT_MS);
  });
  expect(result.current.status).toBe("error");
  await act(async () => {
    result.current.retry();
  });
  expect(result.current.status).toBe("loading");
  expect(events).toHaveBeenCalledTimes(2);
  expect(pets).toHaveBeenCalledTimes(1);
  await act(async () => {
    stuck.resolve([]);
  });
  expect(result.current.status).toBe("loading");
  await act(async () => {
    restarted.resolve([]);
  });
  expect(result.current.status).toBe("ready");
  await unmount();
  client.clear();
});

it("retries only failed queries even when the successful data is stale", async () => {
  events.mockRejectedValue(new Error("offline"));
  const { client, wrapper } = setup(1);
  const { result, unmount } = await renderHook(() => useStartupData("owner"), {
    wrapper,
  });
  await flush();
  await act(async () => {
    jest.advanceTimersByTime(10);
  });
  expect(result.current.status).toBe("error");
  expect(events).toHaveBeenCalledTimes(2);
  await act(async () => {
    jest.advanceTimersByTime(60_000);
  });
  await act(async () => {
    result.current.retry();
  });
  await flush();
  await act(async () => {
    jest.advanceTimersByTime(10);
  });
  expect(result.current.status).toBe("error");
  expect(pets).toHaveBeenCalledTimes(1);
  events.mockResolvedValue([]);
  await act(async () => {
    result.current.retry();
  });
  await flush();
  expect(result.current.status).toBe("ready");
  await unmount();
  client.clear();
});

it("ignores old account work and stays ready during later background refetches", async () => {
  const old = deferred<[]>();
  const next = deferred<[]>();
  events.mockReturnValueOnce(old.promise).mockReturnValueOnce(next.promise);
  const { client, wrapper } = setup();
  const { result, rerender, unmount } = await renderHook(
    ({ id }: { id: string }) => useStartupData(id),
    { wrapper, initialProps: { id: "first" } },
  );
  // AuthProvider clears queries before publishing a different user's session.
  client.clear();
  await rerender({ id: "second" });
  await act(async () => {
    old.resolve([]);
  });
  expect(result.current.status).toBe("loading");
  expect(client.getQueryData(["medical-events", "all"])).toBeUndefined();
  await act(async () => {
    next.resolve([]);
  });
  expect(result.current.status).toBe("ready");
  events.mockReturnValue(new Promise(() => {}));
  await act(async () => {
    void client.invalidateQueries();
  });
  expect(result.current.status).toBe("ready");
  await unmount();
  client.clear();
});
