import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import type { PetSummary } from "@/types/domain";
import { usePet } from "./queries";
import { getPet } from "@/services/pets";
jest.mock("@/services/pets", () => ({ getPet: jest.fn() }));
jest.mock("@/services/medicalEvents", () => ({}));
jest.mock("@/services/profile", () => ({}));
const pet = {
  id: "ray",
  name: "Ray",
  photoPath: "family/ray/one.jpg",
  photoUrl: "https://storage.test/photo?token=first",
} as PetSummary;
function setup() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 30000, gcTime: Infinity },
    },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}
beforeEach(() => jest.mocked(getPet).mockReset());
it("immediately reuses fresh list data without fetching the pet again", async () => {
  const { client, wrapper } = setup();
  client.setQueryData(["pets"], [pet]);
  const { result, unmount } = await renderHook(() => usePet("ray"), {
    wrapper,
  });
  expect(result.current.data).toEqual(pet);
  expect(result.current.isPending).toBe(false);
  expect(getPet).not.toHaveBeenCalled();
  await unmount();
  client.clear();
});
it("refreshes old list data in the background instead of treating it as fresh", async () => {
  const { client, wrapper } = setup();
  client.setQueryData(["pets"], [pet], { updatedAt: Date.now() - 60000 });
  const updated = { ...pet, name: "Updated" };
  jest.mocked(getPet).mockResolvedValue(updated);
  const { result, unmount } = await renderHook(() => usePet("ray"), {
    wrapper,
  });
  await waitFor(() => expect(result.current.data?.name).toBe("Updated"));
  expect(getPet).toHaveBeenCalledWith("ray");
  await unmount();
  client.clear();
});
it("does not seed a different pet and fetches missing detail data", async () => {
  const { client, wrapper } = setup();
  client.setQueryData(["pets"], [pet]);
  jest.mocked(getPet).mockResolvedValue({ ...pet, id: "luna" });
  const { result, unmount } = await renderHook(() => usePet("luna"), {
    wrapper,
  });
  await waitFor(() => expect(result.current.data?.id).toBe("luna"));
  expect(getPet).toHaveBeenCalledWith("luna");
  await unmount();
  client.clear();
});
it("refreshes a newly invalidated list so updated photos do not stay stale", async () => {
  const { client, wrapper } = setup();
  client.setQueryData(["pets"], [pet]);
  await client.invalidateQueries({ queryKey: ["pets"], refetchType: "none" });
  const updated = { ...pet, photoPath: "family/ray/two.jpg" };
  jest.mocked(getPet).mockResolvedValue(updated);
  const { result, unmount } = await renderHook(() => usePet("ray"), {
    wrapper,
  });
  await waitFor(() =>
    expect(result.current.data?.photoPath).toBe(updated.photoPath),
  );
  expect(getPet).toHaveBeenCalledTimes(1);
  await unmount();
  client.clear();
});
