import { templateNames } from "../lib/content";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, NotebookPen, Signpost, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWorkspace } from "@/features/tasks/api";
import { useDocumentActions } from "../api";
import type { DocumentTemplate, WorkspaceDocument } from "../types";
export function CreateDocumentDialog({
  open,
  onClose,
  projectId,
  template = "blank",
}: {
  open: boolean;
  onClose: () => void;
  projectId?: string;
  template?: DocumentTemplate;
}) {
  const [title, setTitle] = useState(
    template === "blank" ? "Untitled document" : templateNames[template],
  );
  const [project, setProject] = useState(projectId ?? "");
  const [selected, setSelected] = useState(template);
  const { data } = useWorkspace();
  const actions = useDocumentActions();
  const navigate = useNavigate();
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>A place for your next idea</DialogTitle>
          <DialogDescription>
            Start with a blank page or a little structure.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const doc = (await actions.create({
                title,
                projectId: project || null,
                template: selected,
              })) as WorkspaceDocument;
              onClose();
              navigate(`/docs/${doc.id}`);
            } catch {
              /* Mutation reports errors */
            }
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="doc-name">Document name</FieldLabel>
              <Input
                id="doc-name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="doc-project">Project</FieldLabel>
              <select
                id="doc-project"
                value={project}
                onChange={(e) => setProject(e.target.value)}
              >
                <option value="">Workspace · no project</option>
                {data?.projects
                  .filter((p) => !p.archived)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field>
              <FieldLabel>Start from</FieldLabel>
              <ToggleGroup
                type="single"
                value={selected}
                onValueChange={(v) => {
                  if (v) setSelected(v as DocumentTemplate);
                }}
                variant="outline"
                className="doc-template-options"
              >
                {(
                  [
                    ["blank", FileText],
                    ["brief", Sparkles],
                    ["notes", NotebookPen],
                    ["decision", Signpost],
                  ] as const
                ).map(([value, Icon]) => (
                  <ToggleGroupItem
                    key={value}
                    value={value}
                    aria-label={`${templateNames[value]} template`}
                  >
                    <Icon />
                    {templateNames[value]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
            <Button type="submit" disabled={!title.trim() || actions.pending}>
              {actions.pending ? "Creating…" : "Create document"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
