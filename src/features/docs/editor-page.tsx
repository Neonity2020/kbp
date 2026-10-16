import { useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Link2,
  Star,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/page";
import { Person } from "@/features/tasks/components/task-card";
import { useWorkspace } from "@/features/tasks/api";
import {
  documentRepository,
  safeDocumentHref,
} from "@/repositories/document-repository";
import { cn } from "@/lib/utils";
import { useDocuments, useDocumentActions } from "./api";
import { documentHeadings, wordCount } from "./lib/content";
import { useDocumentDraft } from "./use-document-draft";
import { DocumentMenu } from "./components/document-menu";
import { EditorToolbar } from "./components/editor-toolbar";
import type { WorkspaceDocument } from "./types";
export default function DocumentEditorPage() {
  const { documentId } = useParams();
  const { data: documents, isPending, error } = useDocuments();
  const actions = useDocumentActions();
  if (isPending)
    return (
      <div className="page">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  if (error)
    return (
      <div className="page">
        <EmptyState
          title="Could not load document"
          description={error.message}
        />
      </div>
    );
  const document = documents?.find((d) => d.id === documentId);
  if (!document)
    return (
      <div className="page docs-empty">
        <EmptyState
          title="Document not found"
          description="This document may have moved. Your library is still here."
        />
        <Button asChild variant="outline">
          <Link to="/docs">Back to Docs</Link>
        </Button>
      </div>
    );
  if (document.trashedAt)
    return (
      <div className="page docs-empty">
        <EmptyState
          title="This document is in Trash"
          description="Restore it to continue reading and editing."
        />
        <div className="doc-recovery-actions">
          <Button
            onClick={() =>
              void actions
                .update(document.id, { trashedAt: null })
                .catch(() => {})
            }
          >
            Restore document
          </Button>
          <Button asChild variant="outline">
            <Link to="/docs?scope=trash">Go to Trash</Link>
          </Button>
        </div>
      </div>
    );
  return (
    <DocumentEditor
      key={document.id}
      document={document}
      documents={documents ?? []}
    />
  );
}
function DocumentEditor({
  document: doc,
  documents,
}: {
  document: WorkspaceDocument;
  documents: WorkspaceDocument[];
}) {
  const { data: workspace } = useWorkspace();
  const actions = useDocumentActions();
  const draft = useDocumentDraft(doc);
  const editorArea = useRef<HTMLDivElement>(null);
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          link: {
            openOnClick: false,
            isAllowedUri: (url) => safeDocumentHref(url),
          },
        }),
        Placeholder.configure({
          placeholder:
            "Start writing, or use the toolbar to shape your thoughts…",
        }),
      ],
      content: doc.content,
      editorProps: {
        attributes: {
          "aria-label": "Document content",
          role: "textbox",
          "aria-multiline": "true",
          class: "document-prose",
        },
      },
      onUpdate: ({ editor: e }) => draft.queue({ content: e.getJSON() }),
    },
    [doc.id],
  );
  const related = documents.filter(
    (d) => !d.trashedAt && d.projectId === doc.projectId,
  );
  const project = workspace?.projects.find((p) => p.id === doc.projectId);
  const headings = documentHeadings(draft.content);
  return (
    <div className="document-workspace">
      <aside className="document-rail">
        <Link className="back-to-docs" to="/docs">
          <ArrowLeft />
          All docs
        </Link>
        <div className="document-rail-heading">
          <BookOpen />
          <span>{project?.name ?? "Workspace docs"}</span>
        </div>
        <nav aria-label="Related documents">
          {related.map((d) => (
            <Link
              key={d.id}
              className={cn(d.id === doc.id && "active")}
              to={`/docs/${d.id}`}
            >
              <FileText />
              <span>{d.title}</span>
              {d.favorite && <Star />}
            </Link>
          ))}
        </nav>
        <p className="document-rail-note">
          A shared place for the thinking behind the work.
        </p>
      </aside>
      <div className="document-main">
        <div className="document-action-bar">
          <Link to="/docs" className="doc-mobile-back">
            <ArrowLeft />
          </Link>
          <span className="document-path">
            Docs
            <ChevronRight />
            {project?.name ?? "Workspace"}
          </span>
          <span
            className={`document-save-state save-${draft.status}`}
            role="status"
            data-testid="document-save-state"
          >
            {draft.status === "saved" ? (
              <Check />
            ) : draft.status === "saving" ? (
              <Clock />
            ) : (
              <TriangleAlert />
            )}
            {draft.status === "saved"
              ? "All changes saved"
              : draft.status === "saving"
                ? "Saving…"
                : draft.status === "session"
                  ? "Saved for this session"
                  : "Could not save"}
            {draft.status === "error" && (
              <button onClick={draft.flush}>Retry</button>
            )}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={
              doc.favorite ? "Unfavorite document" : "Favorite document"
            }
            onClick={() => {
              draft.flush();
              void actions
                .update(doc.id, { favorite: !doc.favorite })
                .catch(() => {});
            }}
          >
            <Star className={cn(doc.favorite && "starred")} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Copy document link"
            onClick={() => {
              draft.flush();
              void navigator.clipboard
                .writeText(window.location.href)
                .then(() =>
                  toast.success(
                    "Link copied — opens in this browser’s workspace",
                  ),
                )
                .catch(() => toast.error("Could not copy the link"));
            }}
          >
            <Link2 />
            <span className="copy-link-label">Copy link</span>
          </Button>
          <DocumentMenu
            document={{ ...doc, title: draft.title, content: draft.content }}
            beforeAction={draft.flush}
          />
        </div>
        {documentRepository.warning && (
          <Alert className="doc-storage-alert">
            <AlertTitle>Local storage notice</AlertTitle>
            <AlertDescription>{documentRepository.warning}</AlertDescription>
          </Alert>
        )}
        <div className="document-writing-layout">
          <div className="document-paper">
            <div className={`document-page-icon document-${doc.color}`}>
              <FileText />
            </div>
            <h1 className="sr-only">{draft.title || "Untitled document"}</h1>
            <textarea
              rows={2}
              className="document-title-input"
              aria-label="Document title"
              placeholder="Untitled document"
              value={draft.title}
              onChange={(e) => draft.queue({ title: e.target.value })}
            />
            <div className="document-properties">
              <Person id={doc.authorId} />
              <span>
                {workspace?.projects.length ? "Created by " : ""}
                {doc.authorId === "andi"
                  ? "Alex Morgan"
                  : doc.authorId === "sarah"
                    ? "Sarah Chen"
                    : "Mia Patel"}
              </span>
              <span className="property-separator">·</span>
              <label>
                <span className="sr-only">Document project</span>
                <select
                  aria-label="Document project"
                  value={doc.projectId ?? ""}
                  onChange={(e) => {
                    draft.flush();
                    void actions
                      .update(doc.id, { projectId: e.target.value || null })
                      .catch(() => {});
                  }}
                >
                  <option value="">Workspace</option>
                  {workspace?.projects
                    .filter((p) => !p.archived)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            {editor && <EditorToolbar editor={editor} />}
            <div ref={editorArea}>
              <EditorContent editor={editor} />
            </div>
            <div className="document-word-count">
              {wordCount(draft.content)} words
              <span>Just you and your next good idea.</span>
            </div>
          </div>
          <aside className="document-outline">
            <p>ON THIS PAGE</p>
            {headings.length ? (
              headings.map((h) => (
                <button
                  key={h.index}
                  className={cn(h.level === 3 && "outline-indent")}
                  onClick={() => {
                    const node =
                      editorArea.current?.querySelector(".tiptap")?.children[
                        h.index
                      ];
                    node?.scrollIntoView({
                      behavior: window.matchMedia(
                        "(prefers-reduced-motion: reduce)",
                      ).matches
                        ? "instant"
                        : "smooth",
                      block: "center",
                    });
                  }}
                >
                  {h.text || "Untitled section"}
                </button>
              ))
            ) : (
              <span>
                Add headings to give your document a little structure.
              </span>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
