export const statuses = [
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
] as const;
export type TaskStatus = (typeof statuses)[number];
export const statusNames: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To do",
  in_progress: "In progress",
  review: "In review",
  done: "Done",
};
export const priorities = ["none", "low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof priorities)[number];
export interface Workspace {
  id: string;
  name: string;
}
export interface Member {
  id: string;
  name: string;
  initials: string;
  color: string;
}
export interface Label {
  id: string;
  name: string;
  color: string;
}
export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}
export interface Comment {
  id: string;
  taskId: string;
  body: string;
  createdAt: string;
}
export interface Attachment {
  id: string;
  name: string;
  size: number;
}
export interface Activity {
  id: string;
  taskId: string;
  text: string;
  createdAt: string;
}
export interface Task {
  id: string;
  key: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  startDate: string | null;
  dueDate: string | null;
  labelIds: string[];
  order: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  subtasks: Subtask[];
}
export interface Project {
  id: string;
  workspaceId: string;
  key: string;
  name: string;
  description: string;
  color: string;
  status: "planning" | "active" | "on_hold" | "completed";
  memberIds: string[];
  archived: boolean;
}
export type CreateTaskInput = Pick<Task, "projectId" | "title"> &
  Partial<Pick<Task, "status" | "priority" | "assigneeId" | "dueDate">>;
export type UpdateTaskInput = Partial<
  Omit<Task, "id" | "key" | "projectId" | "createdAt">
>;
export interface MoveTaskInput {
  taskId: string;
  targetStatus: TaskStatus;
  beforeTaskId?: string | null;
  afterTaskId?: string | null;
}
export interface ViewFilter {
  field: "status" | "assigneeId" | "priority" | "dueDate" | "labelIds";
  operator: "is" | "is_not";
  values: string[];
}
export interface TaskViewConfig {
  search: string;
  filters: ViewFilter[];
  sort: {
    field: "order" | "title" | "priority" | "dueDate";
    direction: "asc" | "desc";
  };
  groupBy: "none" | "status" | "priority" | "assigneeId";
  showCompleted: boolean;
}
