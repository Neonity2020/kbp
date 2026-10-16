import { priorities, statuses, type Task, type TaskViewConfig } from "../types";
export const defaultConfig: TaskViewConfig = {
  search: "",
  filters: [],
  sort: { field: "order", direction: "asc" },
  groupBy: "status",
  showCompleted: true,
};
export function selectTasks(tasks: Task[], config: TaskViewConfig): Task[] {
  return tasks
    .filter((t) => !t.archived && (config.showCompleted || t.status !== "done"))
    .filter((t) =>
      `${t.title} ${t.key}`.toLowerCase().includes(config.search.toLowerCase()),
    )
    .filter((t) =>
      config.filters.every((f) => {
        const v = t[f.field];
        const match = Array.isArray(v)
          ? v.some((x) => f.values.includes(x))
          : f.values.includes(v ?? "");
        return f.operator === "is" ? match : !match;
      }),
    )
    .sort((a, b) => {
      const f = config.sort.field;
      let n: number;
      if (f === "priority")
        n = priorities.indexOf(a.priority) - priorities.indexOf(b.priority);
      else if (f === "order") n = a.order - b.order;
      else n = (a[f] ?? "9999").localeCompare(b[f] ?? "9999");
      return (
        (config.sort.direction === "asc" ? n : -n) || a.key.localeCompare(b.key)
      );
    });
}
export function groupTasks(
  tasks: Task[],
  group: TaskViewConfig["groupBy"],
): [string, Task[]][] {
  if (group === "none") return [["All tasks", tasks]];
  const keys =
    group === "status"
      ? [...statuses]
      : group === "priority"
        ? [...priorities]
        : Array.from(new Set(tasks.map((t) => t.assigneeId ?? "Unassigned")));
  return keys.map((k) => [
    k,
    tasks.filter((t) => (t[group] ?? "Unassigned") === k),
  ]);
}
