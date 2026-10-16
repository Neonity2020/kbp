import type { JSONContent } from "@tiptap/core";
export interface WorkspaceDocument {
  id: string;
  title: string;
  content: JSONContent;
  projectId: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
  trashedAt: string | null;
  color: "lavender" | "sage" | "sand" | "blue";
}
export type DocumentPatch = Partial<
  Pick<
    WorkspaceDocument,
    "title" | "content" | "projectId" | "favorite" | "trashedAt" | "color"
  >
>;
export type DocumentTemplate = "blank" | "brief" | "notes" | "decision";
export interface CreateDocumentInput {
  title: string;
  projectId: string | null;
  template: DocumentTemplate;
}
