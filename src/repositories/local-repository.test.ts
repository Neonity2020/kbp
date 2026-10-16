import { beforeEach, describe, it, expect } from "vitest";
import { LocalRepository, DATA_KEY } from "./local-repository";
import { seed } from "@/mocks/seed";
beforeEach(() => localStorage.clear());
describe("task repository and persistence", () => {
  it("seeds first visit and restores persisted edits", async () => {
    const r = new LocalRepository();
    const t = await r.create({ projectId: "website", title: "New task" });
    await r.update(t.id, { title: "Changed" });
    expect((await new LocalRepository().get(t.id))?.title).toBe("Changed");
    expect(t.key).toBe("WEB-114");
  });
  it("sets and clears completedAt through the unified mutation", async () => {
    const r = new LocalRepository();
    const done = await r.update("task-1", { status: "done" });
    expect(done.completedAt).toBeTruthy();
    const reopened = await r.update("task-1", { status: "todo" });
    expect(reopened.completedAt).toBeNull();
    await r.archive("task-1");
    expect((await r.get("task-1"))?.archived).toBe(true);
  });
  it("rejects invalid edits without changing data", async () => {
    const r = new LocalRepository();
    await expect(r.update("task-1", { title: " " })).rejects.toThrow();
    await expect(
      r.update("task-1", { dueDate: "2020-01-01" }),
    ).rejects.toThrow();
    expect((await r.get("task-1"))?.title).toBe("Explore competitor websites");
  });
  it("reorders within a column, moves across columns, and inserts into an empty column", async () => {
    const r = new LocalRepository();
    await r.move({
      taskId: "task-2",
      targetStatus: "backlog",
      beforeTaskId: "task-1",
    });
    expect((await r.get("task-2"))!.order).toBeLessThan(
      (await r.get("task-1"))!.order,
    );
    await r.move({
      taskId: "task-2",
      targetStatus: "done",
      afterTaskId: "task-11",
    });
    expect((await r.get("task-2"))!.completedAt).toBeTruthy();
    await r.move({ taskId: "task-14", targetStatus: "review" });
    expect((await r.get("task-14"))!.order).toBe(0);
    expect((await new LocalRepository().get("task-14"))!.status).toBe("review");
  });
  it("failed moves preserve the prior state", async () => {
    const r = new LocalRepository();
    const before = await r.list();
    await expect(
      r.move({
        taskId: "task-1",
        targetStatus: "done",
        beforeTaskId: "missing",
      }),
    ).rejects.toThrow();
    expect(await r.list()).toEqual(before);
  });
  it("recovers corrupt and future data and migrates v0", () => {
    localStorage.setItem(DATA_KEY, "bad");
    expect(new LocalRepository().warning).toBeTruthy();
    localStorage.setItem(
      DATA_KEY,
      JSON.stringify({ ...seed(), schemaVersion: 9 }),
    );
    expect(new LocalRepository().warning).toBeTruthy();
    localStorage.setItem(
      DATA_KEY,
      JSON.stringify({ ...seed(), schemaVersion: 0 }),
    );
    expect(new LocalRepository().warning).toBeNull();
  });
  it("keeps session edits when storage writes fail", async () => {
    const r = new LocalRepository({
      getItem: () => null,
      setItem: () => {
        throw Error("quota");
      },
    });
    const t = await r.create({ projectId: "website", title: "Keep in memory" });
    expect((await r.get(t.id))?.title).toBe("Keep in memory");
    expect(r.warning).toContain("session");
  });
  it("reset restores the demo and project edits persist", async () => {
    const r = new LocalRepository();
    await r.saveProject({ id: "website", name: "New name" });
    expect(new LocalRepository().data.projects[0].name).toBe("New name");
    r.reset();
    expect(r.data.projects[0].name).toBe("Website redesign");
  });
});
