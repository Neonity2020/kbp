import { templateNames } from "./lib/content";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  FileText,
  Folder,
  LayoutGrid,
  List,
  NotebookPen,
  Plus,
  Search,
  Signpost,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/shared/page";
import { Person } from "@/features/tasks/components/task-card";
import { useWorkspace } from "@/features/tasks/api";
import { documentRepository } from "@/repositories/document-repository";
import { cn } from "@/lib/utils";
import { useDocumentActions, useDocuments } from "./api";
import { documentText, documentHeadings } from "./lib/content";
import { CreateDocumentDialog } from "./components/create-document-dialog";
import { DocumentMenu } from "./components/document-menu";
import type { DocumentTemplate } from "./types";
export default function DocumentsPage({ projectId }: { projectId?: string }) {
  const { data: documents = [], isPending, error } = useDocuments();
  const { data: workspace } = useWorkspace();
  const actions = useDocumentActions();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [create, setCreate] = useState<DocumentTemplate | null>(null);
  const scope = params.get("scope") ?? "all";
  const search = params.get("q") ?? "";
  const project = projectId ?? params.get("project") ?? "";
  const sort = params.get("sort") ?? "updated";
  const scoped = documents.filter(
    (d) =>
      (!project || d.projectId === project) &&
      (scope === "trash" ? !!d.trashedAt : !d.trashedAt) &&
      (scope !== "favorites" || d.favorite),
  );
  const filtered = scoped
    .filter((d) =>
      `${d.title} ${documentText(d.content)}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : sort === "created"
          ? b.createdAt.localeCompare(a.createdAt)
          : b.updatedAt.localeCompare(a.updatedAt),
    );
  function param(key: string, value: string) {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  return (
    <div className={cn("docs-library", !projectId && "page")}>
      {!projectId && (
        <div className="docs-page-heading">
          <div className="docs-heading-icon">
            <BookOpen />
          </div>
          <div>
            <p className="eyebrow">YOUR SHARED KNOWLEDGE</p>
            <h1>Docs</h1>
            <p className="page-description">
              Good ideas deserve a place to grow.
            </p>
          </div>
          <Button onClick={() => setCreate("blank")}>
            <Plus data-icon="inline-start" />
            New doc
          </Button>
        </div>
      )}
      {documentRepository.warning && (
        <Alert>
          <AlertTitle>Document storage notice</AlertTitle>
          <AlertDescription>{documentRepository.warning}</AlertDescription>
        </Alert>
      )}
      {scope === "all" && !search && (
        <section className="doc-templates" aria-label="Document templates">
          <div className="templates-heading">
            <Sparkles />
            <span>A little structure, a running start.</span>
          </div>
          <div className="template-grid">
            {(
              [
                ["brief", FileText, "Align on the what and why"],
                ["notes", NotebookPen, "Keep the conversation moving"],
                ["decision", Signpost, "Remember the reasoning"],
              ] as const
            ).map(([template, Icon, description]) => (
              <button
                className={`template-card template-${template}`}
                key={template}
                onClick={() => setCreate(template)}
              >
                <span className="template-icon">
                  <Icon />
                </span>
                <span>
                  <strong>{templateNames[template]}</strong>
                  <span>{description}</span>
                </span>
                <Plus />
              </button>
            ))}
          </div>
        </section>
      )}
      <div className="doc-library-toolbar">
        <ToggleGroup
          type="single"
          value={scope}
          onValueChange={(v) => {
            if (v) param("scope", v);
          }}
          className="doc-scope-tabs"
        >
          <ToggleGroupItem value="all">
            <BookOpen />
            All docs
          </ToggleGroupItem>
          <ToggleGroupItem value="favorites">
            <Star />
            Favorites
          </ToggleGroupItem>
          <ToggleGroupItem value="trash">
            <Trash2 />
            Trash
          </ToggleGroupItem>
        </ToggleGroup>
        <span className="doc-library-count">
          {filtered.length} {filtered.length === 1 ? "document" : "documents"}
        </span>
        {projectId && (
          <Button size="sm" onClick={() => setCreate("blank")}>
            <Plus />
            New doc
          </Button>
        )}
      </div>
      <div className="doc-filter-bar">
        <InputGroup className="doc-search">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search documents"
            placeholder="Search your docs…"
            value={search}
            onChange={(e) => param("q", e.target.value)}
          />
        </InputGroup>
        {!projectId && (
          <label className="doc-filter">
            <Folder />
            <select
              aria-label="Filter documents by project"
              value={project}
              onChange={(e) => param("project", e.target.value)}
            >
              <option value="">All projects</option>
              {workspace?.projects
                .filter((p) => !p.archived)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
        )}
        <select
          aria-label="Sort documents"
          value={sort}
          onChange={(e) => param("sort", e.target.value)}
        >
          <option value="updated">Last edited</option>
          <option value="created">Recently created</option>
          <option value="title">Alphabetical</option>
        </select>
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => {
            if (v) setView(v as typeof view);
          }}
          variant="outline"
          spacing={0}
          size="sm"
        >
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <LayoutGrid />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view">
            <List />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {error ? (
        <EmptyState
          title="Could not load documents"
          description={error.message}
        />
      ) : isPending ? (
        <div className="doc-grid">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="docs-empty">
          <EmptyState
            title={
              scope === "trash"
                ? "Nothing in the trash"
                : scope === "favorites"
                  ? "Keep your best ideas close"
                  : "A fresh page awaits"
            }
            description={
              search
                ? "Try a different search or project filter."
                : scope === "favorites"
                  ? "Star a document to find it here."
                  : scope === "trash"
                    ? "Documents you move to trash can be restored here."
                    : "Create a document or start from a template."
            }
          />
          {scope === "all" && !search && (
            <Button variant="outline" onClick={() => setCreate("blank")}>
              <Plus />
              Create your first doc
            </Button>
          )}
        </div>
      ) : (
        <div className={cn(view === "grid" ? "doc-grid" : "doc-rows")}>
          {filtered.map((doc) => {
            const p = workspace?.projects.find((p) => p.id === doc.projectId);
            const headings = documentHeadings(doc.content);
            const excerpt =
              documentText(doc.content).slice(0, 190) ||
              "A blank page, ready for your next idea.";
            return (
              <Card
                key={doc.id}
                className={cn("document-card", `document-${doc.color}`)}
              >
                <CardHeader>
                  <div className="doc-card-icon">
                    <FileText />
                  </div>
                  <div className="doc-card-heading">
                    <CardTitle>
                      <Link to={`/docs/${doc.id}`}>{doc.title}</Link>
                    </CardTitle>
                    <CardDescription>
                      <span
                        className="project-dot"
                        style={{
                          background: p?.color ?? "var(--muted-foreground)",
                        }}
                      />
                      {p?.name ?? "Workspace"}
                    </CardDescription>
                  </div>
                  <div className="doc-card-actions">
                    {!doc.trashedAt && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${doc.favorite ? "Unfavorite" : "Favorite"} ${doc.title}`}
                        onClick={() =>
                          void actions
                            .update(doc.id, { favorite: !doc.favorite })
                            .catch(() => {})
                        }
                      >
                        <Star className={cn(doc.favorite && "starred")} />
                      </Button>
                    )}
                    <DocumentMenu document={doc} />
                  </div>
                </CardHeader>
                <CardContent>
                  <Link
                    to={`/docs/${doc.id}`}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="doc-preview"
                  >
                    <span>{excerpt}</span>
                    {headings.slice(0, 2).map((h) => (
                      <strong key={h.index}>{h.text}</strong>
                    ))}
                    <span className="doc-preview-line" />
                    <span className="doc-preview-line short" />
                  </Link>
                </CardContent>
                <CardFooter>
                  <Person id={doc.authorId} />
                  <span>Edited {format(parseISO(doc.updatedAt), "MMM d")}</span>
                  {doc.trashedAt && (
                    <span className="doc-trash-label">In trash</span>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
      <CreateDocumentDialog
        key={`${create}-${project}`}
        open={create !== null}
        template={create ?? "blank"}
        projectId={project || undefined}
        onClose={() => setCreate(null)}
      />
    </div>
  );
}
