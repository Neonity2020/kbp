import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { documentRepository } from "@/repositories/document-repository";
import type { CreateDocumentInput, DocumentPatch } from "./types";
export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: () => documentRepository.list(),
  });
}
export function useDocumentActions() {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (action: () => Promise<unknown>) => action(),
    onSuccess: () => {
      client.setQueryData(["documents"], documentRepository.snapshot());
      if (documentRepository.warning) toast.warning(documentRepository.warning);
    },
    onError: (error) => toast.error(error.message),
  });
  return {
    pending: mutation.isPending,
    create: (input: CreateDocumentInput) =>
      mutation.mutateAsync(() => documentRepository.create(input)),
    update: (id: string, patch: DocumentPatch) =>
      mutation.mutateAsync(() => documentRepository.update(id, patch)),
    duplicate: (id: string) =>
      mutation.mutateAsync(() => documentRepository.duplicate(id)),
  };
}
