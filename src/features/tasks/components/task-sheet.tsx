import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Archive, Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { labels, members } from "@/mocks/seed";
import { useActions, useWorkspace } from "../api";
import { priorities, statuses, statusNames, type Task } from "../types";
export function TaskSheet() {
  const [params, setParams] = useSearchParams();
  const id = params.get("task");
  const { data } = useWorkspace();
  const task = data?.tasks.find((t) => t.id === id && !t.archived);
  const close = () => {
    const next = new URLSearchParams(params);
    next.delete("task");
    setParams(next);
  };
  const trigger = useRef<HTMLElement | null>(null);
  return (
    <Sheet
      open={!!id}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <SheetContent
        className="task-sheet"
        onOpenAutoFocus={() => {
          trigger.current = document.activeElement as HTMLElement;
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          trigger.current?.focus();
        }}
      >
        <SheetHeader>
          <SheetTitle>{task?.key ?? "Task not found"}</SheetTitle>
          <SheetDescription>
            {task
              ? "Task details · Changes sync across all views."
              : "This task may have been archived or removed."}
          </SheetDescription>
        </SheetHeader>
        {task ? (
          <TaskEditor
            key={`${task.id}-${task.updatedAt}`}
            task={task}
            close={close}
          />
        ) : (
          <div className="sheet-body">
            <Button onClick={close}>Back to workspace</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
function TaskEditor({ task, close }: { task: Task; close: () => void }) {
  const [draft, setDraft] = useState(task);
  const [subtask, setSubtask] = useState("");
  const [confirmArchive, setConfirmArchive] = useState(false);
  const actions = useActions();
  const { data } = useWorkspace();
  const change = <K extends keyof Task>(key: K, value: Task[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  return (
    <form
      className="sheet-body"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await actions.update(task.id, draft);
          toast.success("Task saved");
        } catch {
          /* Mutation reports errors */
        }
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="task-title">Title</FieldLabel>
          <Input
            id="task-title"
            required
            value={draft.title}
            onChange={(e) => change("title", e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            rows={5}
            value={draft.description}
            onChange={(e) => change("description", e.target.value)}
          />
        </Field>
        <div className="form-grid">
          <Field>
            <FieldLabel htmlFor="status">Status</FieldLabel>
            <select
              id="status"
              value={draft.status}
              onChange={(e) =>
                change("status", e.target.value as Task["status"])
              }
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {statusNames[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="priority">Priority</FieldLabel>
            <select
              id="priority"
              value={draft.priority}
              onChange={(e) =>
                change("priority", e.target.value as Task["priority"])
              }
            >
              {priorities.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="assignee">Assignee</FieldLabel>
            <select
              id="assignee"
              value={draft.assigneeId ?? ""}
              onChange={(e) => change("assigneeId", e.target.value || null)}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="start">Start date</FieldLabel>
            <Input
              id="start"
              type="date"
              value={draft.startDate ?? ""}
              onChange={(e) => change("startDate", e.target.value || null)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="due">Due date</FieldLabel>
            <Input
              id="due"
              type="date"
              value={draft.dueDate ?? ""}
              onChange={(e) => change("dueDate", e.target.value || null)}
            />
          </Field>
        </div>
        <fieldset>
          <legend>Labels</legend>
          <div className="label-options">
            {labels.map((l) => (
              <label key={l.id}>
                <input
                  type="checkbox"
                  checked={draft.labelIds.includes(l.id)}
                  onChange={(e) =>
                    change(
                      "labelIds",
                      e.target.checked
                        ? [...draft.labelIds, l.id]
                        : draft.labelIds.filter((id) => id !== l.id),
                    )
                  }
                />
                {l.name}
              </label>
            ))}
          </div>
        </fieldset>
        <Field>
          <FieldLabel>Subtasks</FieldLabel>
          {draft.subtasks.map((s) => (
            <div className="subtask" key={s.id}>
              <input
                aria-label={`Complete ${s.title}`}
                type="checkbox"
                checked={s.completed}
                onChange={(e) =>
                  change(
                    "subtasks",
                    draft.subtasks.map((x) =>
                      x.id === s.id ? { ...x, completed: e.target.checked } : x,
                    ),
                  )
                }
              />
              <span>{s.title}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${s.title}`}
                onClick={() =>
                  change(
                    "subtasks",
                    draft.subtasks.filter((x) => x.id !== s.id),
                  )
                }
              >
                <Trash2 />
              </Button>
            </div>
          ))}
          <div className="inline-input">
            <Input
              aria-label="New subtask"
              value={subtask}
              placeholder="Add a subtask…"
              onChange={(e) => setSubtask(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Add subtask"
              onClick={() => {
                if (subtask.trim()) {
                  change("subtasks", [
                    ...draft.subtasks,
                    {
                      id: crypto.randomUUID(),
                      title: subtask.trim(),
                      completed: false,
                    },
                  ]);
                  setSubtask("");
                }
              }}
            >
              <Plus />
            </Button>
          </div>
        </Field>
      </FieldGroup>
      <div className="sheet-footer">
        <Button type="submit" disabled={actions.pending}>
          Save changes
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setConfirmArchive(true)}
        >
          <Archive />
          Archive
        </Button>
      </div>
      {confirmArchive && (
        <div className="archive-confirm">
          <p>Archive this task? It will be hidden from all views.</p>
          <Button
            type="button"
            variant="destructive"
            onClick={async () => {
              try {
                await actions.archive(task.id);
                toast.success("Task archived");
                close();
              } catch {
                /* Reported */
              }
            }}
          >
            Confirm archive
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmArchive(false)}
          >
            Cancel
          </Button>
        </div>
      )}
      <div className="activity-section">
        <h3>Activity</h3>
        {data?.activities
          .filter((a) => a.taskId === task.id)
          .slice(0, 8)
          .map((a) => (
            <p key={a.id}>
              {a.text}
              <time>{new Date(a.createdAt).toLocaleString()}</time>
            </p>
          ))}
        <p>Created {new Date(task.createdAt).toLocaleDateString()}</p>
      </div>
    </form>
  );
}
