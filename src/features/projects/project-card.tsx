import { Link } from "react-router-dom";
import { ArrowRight, FolderKanban } from "lucide-react";
import { Person } from "../tasks/components/task-card";
import { useWorkspace } from "../tasks/api";
import type { Project } from "../tasks/types";
export function ProjectCard({ project: p }: { project: Project }) {
  const { data } = useWorkspace();
  const tasks =
    data?.tasks.filter((t) => t.projectId === p.id && !t.archived) ?? [];
  const done = tasks.filter((t) => t.status === "done").length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  return (
    <Link className="project-card" to={`/projects/${p.id}/board`}>
      <div className="project-card-top">
        <span
          className="project-icon"
          style={{ color: p.color, background: `${p.color}18` }}
        >
          <FolderKanban />
        </span>
        <span className={`project-state state-${p.status}`}>
          {p.status.replace("_", " ")}
        </span>
      </div>
      <h3>{p.name}</h3>
      <p>{p.description}</p>
      <div className="progress-caption">
        <span>
          {done} of {tasks.length} tasks completed
        </span>
        <span>{progress}%</span>
      </div>
      <div className="progress-track">
        <div style={{ width: `${progress}%`, background: p.color }} />
      </div>
      <div className="project-card-footer">
        <div className="avatar-stack">
          {p.memberIds.map((id) => (
            <Person key={id} id={id} />
          ))}
        </div>
        <ArrowRight />
      </div>
    </Link>
  );
}
