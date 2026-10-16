import { lazy, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowDownUp, List as ListIcon, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { EmptyState } from "@/components/shared/page";
import { useActions, useWorkspace } from "../api";
import { defaultConfig, selectTasks } from "../lib/view-engine";
import {
  priorities,
  statuses,
  statusNames,
  type TaskStatus,
  type TaskViewConfig,
} from "../types";
const Board = lazy(() => import("../views/board"));
const TaskList = lazy(() => import("../views/list"));
export function TaskWorkspace({
  projectId,
  mine = false,
  view,
}: {
  projectId?: string;
  mine?: boolean;
  view: "board" | "list";
}) {
  const { data } = useWorkspace();
  const actions = useActions();
  const [params, setParams] = useSearchParams();
  const [createStatus, setCreateStatus] = useState<TaskStatus | null>(null);
  const [title, setTitle] = useState("");
  const [selectedProject, setSelectedProject] = useState(
    projectId ?? data?.projects[0]?.id ?? "",
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const config: TaskViewConfig = {
    ...defaultConfig,
    search: params.get("q") ?? "",
    sort: {
      field: (["order", "title", "priority", "dueDate"].includes(
        params.get("sort") ?? "",
      )
        ? params.get("sort")
        : "order") as TaskViewConfig["sort"]["field"],
      direction: params.get("direction") === "desc" ? "desc" : "asc",
    },
    groupBy: (["none", "status", "priority", "assigneeId"].includes(
      params.get("group") ?? "",
    )
      ? params.get("group")
      : "status") as TaskViewConfig["groupBy"],
    showCompleted: params.get("completed") !== "false",
    filters: [],
  };
  for (const field of [
    "status",
    "priority",
    "assigneeId",
    "labelIds",
    "dueDate",
  ] as const) {
    const value = params.get(field);
    if (value)
      config.filters.push({
        field,
        operator: params.get(`${field}_op`) === "is_not" ? "is_not" : "is",
        values: value.split(","),
      });
  }
  const configKey = JSON.stringify(config);
  const tasks = useMemo(
    () =>
      selectTasks(
        data?.tasks.filter(
          (t) =>
            (!projectId || t.projectId === projectId) &&
            (!mine || t.assigneeId === "andi"),
        ) ?? [],
        JSON.parse(configKey) as TaskViewConfig,
      ),
    [data, projectId, mine, configKey],
  ); // config is derived entirely from the URL
  function param(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  const openTask = (id: string) => param("task", id);
  return (
    <>
      <div className="task-toolbar">
        <InputGroup className="task-search">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search tasks"
            placeholder="Search tasks…"
            value={config.search}
            onChange={(e) => param("q", e.target.value)}
          />
        </InputGroup>
        <Button
          variant={filtersOpen ? "secondary" : "outline"}
          size="sm"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <ListIcon />
          Filter {config.filters.length > 0 && `(${config.filters.length})`}
        </Button>
        <label className="toolbar-select">
          <ArrowDownUp />
          <select
            aria-label="Sort tasks"
            value={config.sort.field}
            onChange={(e) => param("sort", e.target.value)}
          >
            <option value="order">Manual order</option>
            <option value="title">Title</option>
            <option value="priority">Priority</option>
            <option value="dueDate">Due date</option>
          </select>
        </label>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Reverse sort direction"
          onClick={() =>
            param("direction", config.sort.direction === "asc" ? "desc" : "asc")
          }
        >
          <ArrowDownUp />
        </Button>
        {view === "list" && (
          <label className="toolbar-select">
            Group
            <select
              aria-label="Group tasks"
              value={config.groupBy}
              onChange={(e) => param("group", e.target.value)}
            >
              <option value="status">Status</option>
              <option value="priority">Priority</option>
              <option value="assigneeId">Assignee</option>
              <option value="none">None</option>
            </select>
          </label>
        )}
        <span className="task-total">{tasks.length} tasks</span>
        <Button size="sm" onClick={() => setCreateStatus("todo")}>
          <Plus data-icon="inline-start" />
          New task
        </Button>
      </div>
      {filtersOpen && (
        <div className="filter-panel">
          {(["status", "priority", "assigneeId", "labelIds"] as const).map(
            (field) => (
              <label key={field}>
                {
                  {
                    status: "Status",
                    priority: "Priority",
                    assigneeId: "Assignee",
                    labelIds: "Label",
                  }[field]
                }
                <select
                  aria-label={`${field} operator`}
                  value={params.get(`${field}_op`) ?? "is"}
                  onChange={(e) => param(`${field}_op`, e.target.value)}
                >
                  <option value="is">is</option>
                  <option value="is_not">is not</option>
                </select>
                <select
                  aria-label={`Filter ${field}`}
                  value={params.get(field) ?? ""}
                  onChange={(e) => param(field, e.target.value)}
                >
                  <option value="">All</option>
                  {(field === "status"
                    ? statuses.map((x) => [x, statusNames[x]])
                    : field === "priority"
                      ? priorities.map((x) => [x, x])
                      : field === "assigneeId"
                        ? [
                            ["andi", "Alex Morgan"],
                            ["sarah", "Sarah Chen"],
                            ["james", "James Wilson"],
                            ["mia", "Mia Patel"],
                          ]
                        : [
                            ["design", "Design"],
                            ["frontend", "Frontend"],
                            ["research", "Research"],
                            ["content", "Content"],
                          ]
                  ).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            ),
          )}
          <label>
            Due date
            <input
              type="date"
              aria-label="Filter due date"
              value={params.get("dueDate") ?? ""}
              onChange={(e) => param("dueDate", e.target.value)}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.showCompleted}
              onChange={(e) => param("completed", String(e.target.checked))}
            />
            Show completed
          </label>
          <Button variant="ghost" size="sm" onClick={() => setParams({})}>
            <X />
            Clear
          </Button>
        </div>
      )}
      {tasks.length === 0 && (
        <EmptyState
          title="A clear canvas"
          description="No matching tasks. Adjust your filters or add something new."
        />
      )}
      {view === "board" ? (
        <Board
          tasks={tasks}
          onOpen={openTask}
          onCreate={setCreateStatus}
          manual={
            config.sort.field === "order" &&
            config.sort.direction === "asc" &&
            config.groupBy === "status"
          }
        />
      ) : (
        <TaskList tasks={tasks} groupBy={config.groupBy} onOpen={openTask} />
      )}
      <Dialog
        open={createStatus !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreateStatus(null);
            setTitle("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make the next move</DialogTitle>
            <DialogDescription>
              Add a task to {createStatus ? statusNames[createStatus] : ""}.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const task = (await actions.create({
                  projectId: selectedProject,
                  title,
                  status: createStatus ?? "todo",
                  assigneeId: mine ? "andi" : null,
                })) as { id: string };
                setCreateStatus(null);
                setTitle("");
                openTask(task.id);
                toast.success("Task created");
              } catch {
                /* Reported */
              }
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="new-task-title">Task title</FieldLabel>
                <Input
                  id="new-task-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to happen?"
                  required
                  autoFocus
                />
              </Field>
              {!projectId && (
                <Field>
                  <FieldLabel htmlFor="new-task-project">Project</FieldLabel>
                  <select
                    id="new-task-project"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                  >
                    {data?.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <Button disabled={actions.pending || !title.trim()} type="submit">
                Create task
              </Button>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
