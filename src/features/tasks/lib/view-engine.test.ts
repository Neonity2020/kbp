import { describe, it, expect } from "vitest";
import { seed } from "@/mocks/seed";
import { selectTasks, groupTasks, defaultConfig } from "./view-engine";
describe("shared view engine", () => {
  const tasks = seed().tasks;
  it("searches title and stable task key without case sensitivity", () => {
    expect(
      selectTasks(tasks, { ...defaultConfig, search: "web-101" }),
    ).toHaveLength(1);
    expect(
      selectTasks(tasks, { ...defaultConfig, search: "HOMEPAGE" })[0].title,
    ).toContain("homepage");
  });
  it("combines filters and handles exclusion and label membership", () => {
    const result = selectTasks(tasks, {
      ...defaultConfig,
      filters: [
        { field: "priority", operator: "is", values: ["high", "medium"] },
        { field: "status", operator: "is_not", values: ["done"] },
        { field: "labelIds", operator: "is", values: ["design"] },
      ],
    });
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every(
        (t) =>
          ["high", "medium"].includes(t.priority) &&
          t.status !== "done" &&
          t.labelIds.includes("design"),
      ),
    ).toBe(true);
  });
  it("always excludes archived tasks and optionally completed tasks", () => {
    expect(
      selectTasks([{ ...tasks[0], archived: true }], defaultConfig),
    ).toEqual([]);
    expect(
      selectTasks(tasks, { ...defaultConfig, showCompleted: false }).some(
        (t) => t.status === "done",
      ),
    ).toBe(false);
  });
  it("sorts due dates and breaks equal ranks deterministically", () => {
    const result = selectTasks(tasks, {
      ...defaultConfig,
      sort: { field: "dueDate", direction: "desc" },
    });
    expect(result[0].dueDate! >= result.at(-1)!.dueDate!).toBe(true);
    const tied = [
      { ...tasks[0], order: 0 },
      { ...tasks[1], order: 0 },
    ];
    expect(selectTasks(tied.reverse(), defaultConfig)[0].key).toBe("WEB-101");
  });
  it("preserves empty status groups and handles unassigned grouping", () => {
    expect(groupTasks([], "status")).toHaveLength(5);
    expect(
      groupTasks([{ ...tasks[0], assigneeId: null }], "assigneeId")[0][0],
    ).toBe("Unassigned");
  });
});
