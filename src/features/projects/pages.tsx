import { lazy, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import {
  FolderKanban,
  BookOpen,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading, EmptyState } from "@/components/shared/page";
import { ProjectDialog } from "./project-dialog";
import { ProjectCard } from "./project-card";
import { Person } from "../tasks/components/task-card";
import { TaskWorkspace } from "../tasks/components/task-workspace";
import { useWorkspace } from "../tasks/api";
const DocumentsPage = lazy(() => import("@/features/docs/page"));
export function Projects() {
  const { data } = useWorkspace();
  const [open, setOpen] = useState(false);
  return (
    <div className="page">
      <PageHeading
        eyebrow="THE BIG PICTURE"
        title="Your projects"
        description="A home for every idea, from first thought to final detail."
      >
        <Button onClick={() => setOpen(true)}>
          <Plus data-icon="inline-start" />
          New project
        </Button>
      </PageHeading>
      <div className="projects-grid">
        {data?.projects
          .filter((p) => !p.archived)
          .map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
      </div>
      <ProjectDialog
        key={String(open)}
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
export function ProjectPage() {
  const { projectId, view } = useParams();
  const { data } = useWorkspace();
  const project = data?.projects.find((p) => p.id === projectId && !p.archived);
  const [edit, setEdit] = useState(false);
  if (!project)
    return (
      <EmptyState
        title="Project or view not found"
        description="Choose a project from the sidebar to continue."
      />
    );
  if (!["board", "list", "overview", "docs"].includes(view ?? ""))
    return (
      <EmptyState
        title="Project or view not found"
        description="Choose a project from the sidebar to continue."
      />
    );
  return (
    <div className="page project-page">
      <div className="project-heading">
        <span
          className="project-icon large"
          style={{ color: project.color, background: `${project.color}18` }}
        >
          <FolderKanban />
        </span>
        <div>
          <div className="project-title-line">
            <h1>{project.name}</h1>
            <span className={`project-state state-${project.status}`}>
              {project.status.replace("_", " ")}
            </span>
          </div>
          <p className="page-description">
            A thoughtful refresh. A better experience.
          </p>
        </div>
        <div className="project-heading-actions">
          <div className="avatar-stack">
            {project.memberIds.map((id) => (
              <Person key={id} id={id} />
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => setEdit(true)}>
            Edit project
          </Button>
        </div>
      </div>
      <nav className="view-tabs" aria-label="Project views">
        <NavLink to={`/projects/${projectId}/overview`}>
          <Target />
          Overview
        </NavLink>
        <NavLink to={`/projects/${projectId}/board`}>
          <LayoutGrid />
          Board
        </NavLink>
        <NavLink to={`/projects/${projectId}/list`}>
          <ListIcon />
          List
        </NavLink>
        <NavLink to={`/projects/${projectId}/docs`}>
          <BookOpen />
          Docs
        </NavLink>
        <span className="view-hint">A place for the work that matters.</span>
      </nav>
      {view === "overview" ? (
        <div className="overview">
          <h2>About this project</h2>
          <p>{project.description}</p>
          <ProjectCard project={project} />
        </div>
      ) : view === "docs" ? (
        <DocumentsPage projectId={projectId} />
      ) : (
        <TaskWorkspace projectId={projectId} view={view as "board" | "list"} />
      )}
      <ProjectDialog
        key={String(edit)}
        open={edit}
        onClose={() => setEdit(false)}
        project={project}
      />
    </div>
  );
}
