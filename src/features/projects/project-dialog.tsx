import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useActions } from "../tasks/api";
import type { Project } from "../tasks/types";
import { toast } from "sonner";
const schema = z.object({
  name: z.string().trim().min(1, "Enter a project name"),
  description: z.string(),
  status: z.enum(["planning", "active", "on_hold", "completed"]),
});
export function ProjectDialog({
  open,
  onClose,
  project,
}: {
  open: boolean;
  onClose: () => void;
  project?: Project;
}) {
  const actions = useActions();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      status: project?.status ?? "planning",
    },
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {project ? "Edit project" : "Create a project"}
          </DialogTitle>
          <DialogDescription>
            Give your next big idea a place to grow.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await actions.project({ ...values, id: project?.id });
              toast.success(project ? "Project updated" : "Project created");
              onClose();
            } catch {
              /* Reported */
            }
          })}
        >
          <FieldGroup>
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor="project-name">Project name</FieldLabel>
              <Input
                id="project-name"
                {...form.register("name")}
                aria-invalid={!!form.formState.errors.name}
                placeholder="e.g. Website redesign"
              />
              {form.formState.errors.name && (
                <span role="alert">{form.formState.errors.name.message}</span>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="project-description">Description</FieldLabel>
              <Textarea
                id="project-description"
                {...form.register("description")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="project-status">Status</FieldLabel>
              <select id="project-status" {...form.register("status")}>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On hold</option>
                <option value="completed">Completed</option>
              </select>
            </Field>
            <Button type="submit" disabled={actions.pending}>
              {project ? "Save project" : "Create project"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
