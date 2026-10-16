import {
  CalendarDays,
  CheckCheck,
  GripVertical,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Flag,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { members, labels } from "@/mocks/seed";
import type { Task } from "../types";
export function Person({ id }: { id: string | null }) {
  const m = members.find((m) => m.id === id);
  return m ? (
    <span className="person" style={{ background: m.color }} title={m.name}>
      {m.initials}
    </span>
  ) : (
    <span className="person unassigned" title="Unassigned">
      –
    </span>
  );
}
export function Priority({ value }: { value: Task["priority"] }) {
  const Icon =
    value === "urgent"
      ? Flag
      : value === "high"
        ? SignalHigh
        : value === "medium"
          ? SignalMedium
          : SignalLow;
  return (
    <span className={`priority priority-${value}`} title={`${value} priority`}>
      <Icon aria-hidden="true" />
      <span>{value}</span>
    </span>
  );
}
export function TaskCard({
  task,
  onOpen,
  handle,
}: {
  task: Task;
  onOpen: () => void;
  handle?: React.ReactNode;
}) {
  return (
    <article className="task-card">
      <div className="card-top">
        <span className="task-key">{task.key}</span>
        {handle ?? <GripVertical className="quiet-icon" />}
      </div>
      <button className="task-title" onClick={onOpen}>
        {task.title}
      </button>
      <div className="task-tags">
        {task.labelIds.map((id) => {
          const l = labels.find((x) => x.id === id);
          return (
            l && (
              <Badge key={id} variant="secondary" className={`tag-${l.color}`}>
                {l.name}
              </Badge>
            )
          );
        })}
      </div>
      <div className="card-bottom">
        <Priority value={task.priority} />
        <span className="card-meta">
          {task.subtasks.length > 0 && (
            <span>
              <CheckCheck />
              {task.subtasks.filter((s) => s.completed).length}/
              {task.subtasks.length}
            </span>
          )}
          {task.dueDate && (
            <span>
              <CalendarDays />
              {format(parseISO(task.dueDate), "MMM d")}
            </span>
          )}
          <Person id={task.assigneeId} />
        </span>
      </div>
    </article>
  );
}
