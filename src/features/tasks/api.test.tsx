import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { seed, type Database } from "@/mocks/seed";
import { repository } from "@/repositories/local-repository";
import { useActions } from "./api";

afterEach(() => vi.restoreAllMocks());
it("publishes the destination immediately and restores the cache if saving fails", async () => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const original = seed();
  client.setQueryData(["workspace"], original);
  let reject!: (error: Error) => void;
  vi.spyOn(repository, "move").mockImplementation(
    () =>
      new Promise((_, fail) => {
        reject = fail;
      }),
  );
  const { result } = renderHook(() => useActions(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  let saving!: Promise<unknown>;
  act(() => {
    saving = result.current.move({
      taskId: "task-1",
      targetStatus: "done",
      beforeTaskId: "task-11",
    });
    void saving.catch(() => {});
  });
  expect(
    client
      .getQueryData<Database>(["workspace"])!
      .tasks.find((t) => t.id === "task-1")!.status,
  ).toBe("done");
  await waitFor(() => expect(reject).toBeTypeOf("function"));
  await act(async () => {
    reject(Error("Unable to save"));
    await expect(saving).rejects.toThrow("Unable to save");
  });
  expect(client.getQueryData<Database>(["workspace"])!.tasks).toEqual(
    original.tasks,
  );
});
