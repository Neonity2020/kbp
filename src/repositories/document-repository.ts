import { z } from "zod";
import type { JSONContent } from "@tiptap/core";
import { seedDocuments } from "@/mocks/documents";
import { templateContent } from "@/features/docs/lib/content";
import type {
  CreateDocumentInput,
  DocumentPatch,
  WorkspaceDocument,
} from "@/features/docs/types";
export const DOCUMENTS_KEY = "forma.documents.v1";
export const safeDocumentHref = (href: string) =>
  /^(https?:\/\/|mailto:)/i.test(href);
const contentSchema: z.ZodType<JSONContent> = z.lazy(() =>
  z.object({
    type: z.enum([
      "doc",
      "paragraph",
      "text",
      "heading",
      "bulletList",
      "orderedList",
      "listItem",
      "blockquote",
      "codeBlock",
      "hardBreak",
      "horizontalRule",
    ]),
    text: z.string().optional(),
    attrs: z
      .object({
        level: z.number().int().min(1).max(3).optional(),
        start: z.number().optional(),
        language: z.string().nullable().optional(),
      })
      .optional(),
    marks: z
      .array(
        z.object({
          type: z.enum([
            "bold",
            "italic",
            "strike",
            "code",
            "underline",
            "link",
          ]),
          attrs: z
            .object({
              href: z.string().refine(safeDocumentHref).optional(),
              target: z.string().nullable().optional(),
              rel: z.string().nullable().optional(),
              class: z.string().nullable().optional(),
            })
            .optional(),
        }),
      )
      .optional(),
    content: z.array(contentSchema).optional(),
  }),
);
const docSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: contentSchema.refine((c) => c.type === "doc"),
  projectId: z.string().nullable(),
  authorId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  favorite: z.boolean(),
  trashedAt: z.string().nullable(),
  color: z.enum(["lavender", "sage", "sand", "blue"]),
});
const storedSchema = z.object({
  schemaVersion: z.literal(1),
  documents: z.array(docSchema),
});
export interface DocumentRepository {
  list(): Promise<WorkspaceDocument[]>;
  create(input: CreateDocumentInput): Promise<WorkspaceDocument>;
  update(id: string, patch: DocumentPatch): Promise<WorkspaceDocument>;
  duplicate(id: string): Promise<WorkspaceDocument>;
}
export class LocalDocumentRepository implements DocumentRepository {
  private documents: WorkspaceDocument[] = seedDocuments();
  warning: string | null = null;
  private storage: Pick<Storage, "getItem" | "setItem">;
  constructor(storage?: Pick<Storage, "getItem" | "setItem">) {
    this.storage = storage ?? {
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
    };
    try {
      const raw = this.storage.getItem(DOCUMENTS_KEY);
      if (raw) this.documents = storedSchema.parse(JSON.parse(raw)).documents;
      else this.persist();
    } catch {
      this.warning =
        "Document storage could not be read. Demo documents are available for this session.";
    }
  }
  private persist() {
    try {
      this.storage.setItem(
        DOCUMENTS_KEY,
        JSON.stringify({ schemaVersion: 1, documents: this.documents }),
      );
    } catch {
      this.warning =
        "Document changes are kept in this session. Browser storage is unavailable.";
    }
  }
  async list() {
    return structuredClone(this.documents);
  }
  snapshot() {
    return structuredClone(this.documents);
  }
  async create(input: CreateDocumentInput) {
    const now = new Date().toISOString();
    const doc: WorkspaceDocument = {
      id: crypto.randomUUID(),
      title: input.title.trim() || "Untitled document",
      content: templateContent(input.template),
      projectId: input.projectId,
      authorId: "andi",
      createdAt: now,
      updatedAt: now,
      favorite: false,
      trashedAt: null,
      color:
        input.template === "notes"
          ? "sand"
          : input.template === "decision"
            ? "sage"
            : "lavender",
    };
    this.documents = [doc, ...this.documents];
    this.persist();
    return structuredClone(doc);
  }
  /** Synchronous local flush also runs during route changes and pagehide. */
  save(id: string, patch: DocumentPatch) {
    const old = this.documents.find((d) => d.id === id);
    if (!old) throw Error("Document not found");
    const doc = docSchema.parse({
      ...old,
      ...patch,
      title: (patch.title ?? old.title).trim() || "Untitled document",
      updatedAt: new Date().toISOString(),
    });
    this.documents = this.documents.map((d) => (d.id === id ? doc : d));
    this.persist();
    return structuredClone(doc);
  }
  async update(id: string, patch: DocumentPatch) {
    return this.save(id, patch);
  }
  async duplicate(id: string) {
    const old = this.documents.find((d) => d.id === id);
    if (!old) throw Error("Document not found");
    const now = new Date().toISOString();
    const doc = {
      ...structuredClone(old),
      id: crypto.randomUUID(),
      title: `${old.title} (copy)`,
      favorite: false,
      trashedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.documents = [doc, ...this.documents];
    this.persist();
    return structuredClone(doc);
  }
  reset() {
    this.documents = seedDocuments();
    this.warning = null;
    this.persist();
  }
}
export const documentRepository = new LocalDocumentRepository();
