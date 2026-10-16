import {
  statuses,
  type MoveTaskInput,
  type Task,
  type TaskStatus,
} from "../types";

/** The hover preview and committed move must describe the same insertion slot. */
export function boardDrop(
  tasks: Task[],
  activeId: string,
  overId: string,
): MoveTaskInput | null {
  if (activeId === overId) return null;
  const moving = tasks.find((t) => t.id === activeId);
  const target = tasks.find((t) => t.id === overId);
  const status = target?.status ?? (overId as TaskStatus);
  if (!moving || !statuses.includes(status)) return null;
  const after =
    moving.status === status && target && moving.order < target.order;
  return {
    taskId: activeId,
    targetStatus: status,
    ...(target
      ? after
        ? { afterTaskId: target.id }
        : { beforeTaskId: target.id }
      : {}),
  };
}
