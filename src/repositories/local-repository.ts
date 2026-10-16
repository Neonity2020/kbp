import { moveTask } from "@/features/tasks/lib/move-task";
import { seed, type Database } from "@/mocks/seed";
import {
  priorities,
  statuses,
  type Task,
  type CreateTaskInput,
  type UpdateTaskInput,
  type MoveTaskInput,
  type Project,
} from "@/features/tasks/types";
import { z } from "zod";
export const DATA_KEY = "forma.workspace.v1";
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable();
const taskSchema = z.object({
  id: z.string(),
  key: z.string(),
  projectId: z.string(),
  title: z.string().min(1),
  description: z.string(),
  status: z.enum(statuses),
  priority: z.enum(priorities),
  assigneeId: z.string().nullable(),
  startDate: date,
  dueDate: date,
  labelIds: z.array(z.string()),
  order: z.number().finite(),
  archived: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().nullable(),
  subtasks: z.array(
    z.object({ id: z.string(), title: z.string(), completed: z.boolean() }),
  ),
});
const databaseSchema = z.object({
  schemaVersion: z.literal(1),
  workspace: z.object({ id: z.string(), name: z.string() }),
  projects: z.array(
    z.object({
      id: z.string(),
      workspaceId: z.string(),
      key: z.string(),
      name: z.string(),
      description: z.string(),
      color: z.string(),
      status: z.enum(["planning", "active", "on_hold", "completed"]),
      memberIds: z.array(z.string()),
      archived: z.boolean(),
    }),
  ),
  tasks: z.array(taskSchema),
  activities: z.array(
    z.object({
      id: z.string(),
      taskId: z.string(),
      text: z.string(),
      createdAt: z.string(),
    }),
  ),
});
export interface TaskRepository {
  list(projectId?: string): Promise<Task[]>;
  get(id: string): Promise<Task | null>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: string, patch: UpdateTaskInput): Promise<Task>;
  move(input: MoveTaskInput): Promise<Task>;
  archive(id: string): Promise<void>;
}
export class LocalRepository implements TaskRepository {
  data: Database;
  warning: string | null = null;
  private storage: Pick<Storage, "getItem" | "setItem">;
  constructor(storage?: Pick<Storage, "getItem" | "setItem">) {
    this.storage = storage ?? {
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
    };
    this.data = seed();
    try {
      const raw = this.storage.getItem(DATA_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.schemaVersion === 0) parsed.schemaVersion = 1;
        this.data = databaseSchema.parse(parsed);
      } else this.persist();
    } catch {
      this.warning =
        "Local data could not be loaded. A fresh demo is available for this session.";
    }
  }
  private persist() {
    try {
      this.storage.setItem(DATA_KEY, JSON.stringify(this.data));
    } catch {
      this.warning =
        "Changes are kept in this session. Browser storage is unavailable.";
    }
  }
  private commit(task: Task, text: string) {
    this.data = {
      ...this.data,
      tasks: this.data.tasks.map((t) => (t.id === task.id ? task : t)),
      activities: [
        {
          id: crypto.randomUUID(),
          taskId: task.id,
          text,
          createdAt: new Date().toISOString(),
        },
        ...this.data.activities,
      ],
    };
    this.persist();
    return structuredClone(task);
  }
  async list(projectId?: string) {
    return structuredClone(
      this.data.tasks.filter((t) => !projectId || t.projectId === projectId),
    );
  }
  async get(id: string) {
    return structuredClone(this.data.tasks.find((t) => t.id === id) ?? null);
  }
  async create(input: CreateTaskInput) {
    const project = this.data.projects.find((p) => p.id === input.projectId);
    if (!project) throw Error("Project not found");
    if (!input.title.trim()) throw Error("A task needs a title");
    const now = new Date().toISOString();
    const number =
      Math.max(
        100,
        ...this.data.tasks
          .filter((t) => t.projectId === project.id)
          .map((t) => Number(t.key.split("-").at(-1))),
      ) + 1;
    const task: Task = {
      id: crypto.randomUUID(),
      key: `${project.key}-${number}`,
      projectId: project.id,
      title: input.title.trim(),
      description: "",
      status: input.status ?? "todo",
      priority: input.priority ?? "none",
      assigneeId: input.assigneeId ?? null,
      startDate: null,
      dueDate: input.dueDate ?? null,
      labelIds: [],
      order: Math.max(0, ...this.data.tasks.map((t) => t.order)) + 1024,
      archived: false,
      createdAt: now,
      updatedAt: now,
      completedAt: input.status === "done" ? now : null,
      subtasks: [],
    };
    this.data.tasks.push(task);
    return this.commit(task, "Created task");
  }
  async update(id: string, patch: UpdateTaskInput) {
    const old = await this.get(id);
    if (!old) throw Error("Task not found");
    const task = taskSchema.parse({
      ...old,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
    task.title = task.title.trim();
    if (!task.title) throw Error("A task needs a title");
    if (task.startDate && task.dueDate && task.startDate > task.dueDate)
      throw Error("Due date must follow start date");
    task.completedAt =
      task.status === "done"
        ? (old.completedAt ?? new Date().toISOString())
        : null;
    return this.commit(task, "Updated task");
  }
  async move(input: MoveTaskInput) {
    const tasks = moveTask(this.data.tasks, input);
    const task = tasks.find((t) => t.id === input.taskId)!;
    this.data = { ...this.data, tasks };
    return this.commit(
      { ...task, updatedAt: new Date().toISOString() },
      "Moved task",
    );
  }

  async archive(id: string) {
    await this.update(id, { archived: true });
  }
  async saveProject(input: Partial<Project> & Pick<Project, "name">) {
    if (!input.name.trim()) throw Error("A project needs a name");
    const old = this.data.projects.find((p) => p.id === input.id);
    const project: Project = {
      workspaceId: "studio",
      key:
        input.name
          .replace(/[^a-z]/gi, "")
          .slice(0, 3)
          .toUpperCase() || "PRJ",
      description: "",
      color: "#7370cc",
      status: "planning",
      memberIds: ["andi"],
      archived: false,
      ...old,
      ...input,
      id: old?.id ?? input.id ?? crypto.randomUUID(),
      name: input.name.trim(),
    };
    this.data.projects = old
      ? this.data.projects.map((p) => (p.id === old.id ? project : p))
      : [...this.data.projects, project];
    this.persist();
    return project;
  }
  reset() {
    this.data = seed();
    this.warning = null;
    this.persist();
  }
}
export const repository = new LocalRepository();
