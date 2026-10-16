import { documentRepository } from "@/repositories/document-repository";
import { moveTask } from "./lib/move-task";
import type { Database } from "@/mocks/seed";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { repository } from "@/repositories/local-repository";
import type {
  CreateTaskInput,
  MoveTaskInput,
  Project,
  UpdateTaskInput,
} from "./types";
export function useWorkspace() {
  return useQuery({
    queryKey: ["workspace"],
    queryFn: async () => structuredClone(repository.data),
  });
}
export function useActions() {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (action: () => Promise<unknown>) => action(),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["workspace"] });
      if (repository.warning) toast.warning(repository.warning);
    },
    onError: (error) => toast.error(error.message),
  });
  function move(input: MoveTaskInput) {
    const previous = client.getQueryData<Database>(["workspace"]);
    // Publish before returning from the drag event, not after an async onMutate.
    if (previous) {
      try {
        client.setQueryData<Database>(["workspace"], {
          ...previous,
          tasks: moveTask(previous.tasks, input),
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not move task",
        );
        return Promise.reject(error);
      }
    }
    return mutation
      .mutateAsync(() => repository.move(input))
      .catch((error) => {
        if (previous) {
          // Restore only the affected tasks; preserve unrelated workspace edits.
          const affected = new Set(
            previous.tasks
              .filter(
                (t) =>
                  t.id === input.taskId ||
                  (t.projectId ===
                    previous.tasks.find((t) => t.id === input.taskId)
                      ?.projectId &&
                    t.status === input.targetStatus),
              )
              .map((t) => t.id),
          );
          client.setQueryData<Database>(["workspace"], (current) =>
            current
              ? {
                  ...current,
                  tasks: current.tasks.map((t) =>
                    affected.has(t.id)
                      ? (previous.tasks.find((old) => old.id === t.id) ?? t)
                      : t,
                  ),
                }
              : previous,
          );
        }
        throw error;
      });
  }
  return {
    pending: mutation.isPending,
    create: (input: CreateTaskInput) =>
      mutation.mutateAsync(() => repository.create(input)),
    update: (id: string, patch: UpdateTaskInput) =>
      mutation.mutateAsync(() => repository.update(id, patch)),
    move,
    archive: (id: string) => mutation.mutateAsync(() => repository.archive(id)),
    project: (input: Partial<Project> & Pick<Project, "name">) =>
      mutation.mutateAsync(() => repository.saveProject(input)),
    reset: () =>
      mutation.mutateAsync(async () => {
        repository.reset();
        documentRepository.reset();
        client.setQueryData(["documents"], documentRepository.snapshot());
      }),
  };
}
