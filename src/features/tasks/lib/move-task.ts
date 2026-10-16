import { statuses, type MoveTaskInput, type Task } from "../types";

/** Shared by the repository and optimistic cache so both use identical ranks. */
export function moveTask(tasks: Task[], input: MoveTaskInput): Task[] {
  const task = tasks.find((t) => t.id === input.taskId);
  if (!task) throw Error("Task not found");
  if (!statuses.includes(input.targetStatus))
    throw Error("Invalid task status");
  const peers = tasks
    .filter(
      (t) =>
        t.id !== task.id &&
        !t.archived &&
        t.projectId === task.projectId &&
        t.status === input.targetStatus,
    )
    .sort((a, b) => a.order - b.order);
  let index = peers.length;
  if (input.beforeTaskId) {
    index = peers.findIndex((t) => t.id === input.beforeTaskId);
    if (index < 0) throw Error("Drop target no longer exists");
  } else if (input.afterTaskId) {
    index = peers.findIndex((t) => t.id === input.afterTaskId) + 1;
    if (index === 0) throw Error("Drop target no longer exists");
  }
  peers.splice(index, 0, task);
  const ranks = new Map(peers.map((t, i) => [t.id, i * 1024]));
  return tasks.map((t) =>
    ranks.has(t.id)
      ? {
          ...t,
          order: ranks.get(t.id)!,
          ...(t.id === task.id
            ? {
                status: input.targetStatus,
                completedAt:
                  input.targetStatus === "done"
                    ? (t.completedAt ?? new Date().toISOString())
                    : null,
              }
            : {}),
        }
      : t,
  );
}
