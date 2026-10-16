import { Check, Circle } from "lucide-react";
import { groupTasks } from "../lib/view-engine";
import {
  statusNames,
  type Task,
  type TaskViewConfig,
  type TaskStatus,
} from "../types";
import { Person, Priority } from "../components/task-card";
import { members } from "@/mocks/seed";
import { useActions } from "../api";
export default function List({
  tasks,
  groupBy,
  onOpen,
}: {
  tasks: Task[];
  groupBy: TaskViewConfig["groupBy"];
  onOpen: (id: string) => void;
}) {
  const actions = useActions();
  return (
    <div className="task-list">
      {groupTasks(tasks, groupBy).map(([group, items]) => (
        <section key={group}>
          <div className="list-group">
            <span className={`status-dot status-${group}`} />
            {statusNames[group as TaskStatus] ??
              members.find((m) => m.id === group)?.name ??
              group}
            <span className="count">{items.length}</span>
          </div>
          {items.map((t) => (
            <div className="task-row" key={t.id}>
              <button
                className={`complete-button ${t.status === "done" ? "complete" : ""}`}
                aria-label={`Mark ${t.title} ${t.status === "done" ? "to do" : "done"}`}
                onClick={() =>
                  void actions
                    .update(t.id, {
                      status: t.status === "done" ? "todo" : "done",
                    })
                    .catch(() => {})
                }
              >
                {t.status === "done" ? <Check /> : <Circle />}
              </button>
              <span className="task-key">{t.key}</span>
              <button className="row-title" onClick={() => onOpen(t.id)}>
                {t.title}
              </button>
              <Priority value={t.priority} />
              <span className="row-date">
                {t.dueDate?.slice(5).replace("-", "/")}
              </span>
              <Person id={t.assigneeId} />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
