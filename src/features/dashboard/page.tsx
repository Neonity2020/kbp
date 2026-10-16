import { lazy, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, CirclePlus, Sparkles, Target } from "lucide-react";
import { format } from "date-fns";
import { PageHeading, EmptyState } from "@/components/shared/page";
import { useWorkspace } from "../tasks/api";
import { ProjectCard } from "../projects/project-card";
const TaskList = lazy(() => import("../tasks/views/list"));
export function Dashboard() {
  const { data } = useWorkspace();
  const [now] = useState(() => new Date());
  const [, setParams] = useSearchParams();
  const tasks = data?.tasks.filter((t) => !t.archived) ?? [];
  const today = format(now, "yyyy-MM-dd");
  const due = tasks.filter(
    (t) => t.status !== "done" && t.dueDate && t.dueDate <= today,
  );
  const done = tasks.filter((t) => t.status === "done").length;
  return (
    <div className="page dashboard">
      <PageHeading
        eyebrow={format(now, "EEEE, MMMM d")}
        title="A little clarity. A lot of possibility."
        description="Welcome back, Alex. Let’s make space for your best work."
      >
        <span className="greeting-art">
          <Sparkles />
        </span>
      </PageHeading>
      <div className="stats-grid">
        {[
          [
            "In progress",
            tasks.filter((t) => t.status === "in_progress").length,
            "Keep the momentum going",
            Target,
          ],
          [
            "Due today & overdue",
            due.length,
            "A few things need your attention",
            CirclePlus,
          ],
          ["Completed", done, "Small wins, real progress", Check],
        ].map(([title, value, caption, Icon]) => {
          const I = Icon as typeof Target;
          return (
            <div className="stat" key={String(title)}>
              <div>
                <span>{String(title)}</span>
                <I />
              </div>
              <strong>{String(value)}</strong>
              <p>{String(caption)}</p>
            </div>
          );
        })}
      </div>
      <div className="section-heading">
        <h2>
          Your projects <span>{data?.projects.length}</span>
        </h2>
        <Link to="/projects">
          View all projects <ArrowRight />
        </Link>
      </div>
      <div className="projects-grid">
        {data?.projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
      <div className="section-heading">
        <h2>
          On your radar <span>{due.length}</span>
        </h2>
        <Link to="/my-tasks">
          My tasks <ArrowRight />
        </Link>
      </div>
      {due.length ? (
        <TaskList
          tasks={due}
          groupBy="none"
          onOpen={(id) => setParams({ task: id })}
        />
      ) : (
        <EmptyState
          title="You’re all caught up"
          description="No tasks due today. A little breathing room."
        />
      )}
    </div>
  );
}
