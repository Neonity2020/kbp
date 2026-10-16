import { templateContent } from "@/features/docs/lib/content";
import type {
  WorkspaceDocument,
  DocumentTemplate,
} from "@/features/docs/types";
export function seedDocuments(): WorkspaceDocument[] {
  return [
    [
      "creative-brief",
      "Website creative brief",
      "website",
      "brief",
      "lavender",
      true,
    ],
    [
      "kickoff-notes",
      "Kickoff · notes & next steps",
      "website",
      "notes",
      "sand",
      true,
    ],
    [
      "design-principles",
      "Our design principles",
      "brand",
      "decision",
      "sage",
      true,
    ],
    [
      "navigation-decisions",
      "Navigation decisions",
      "website",
      "decision",
      "blue",
      false,
    ],
    [
      "mobile-discovery",
      "Mobile discovery notes",
      "mobile",
      "notes",
      "sand",
      false,
    ],
    [
      "working-together",
      "A guide to working together",
      null,
      "brief",
      "lavender",
      false,
    ],
  ].map(([id, title, projectId, template, color, favorite], index) => ({
    id: String(id),
    title: String(title),
    projectId: projectId as string | null,
    content: templateContent(template as DocumentTemplate),
    color: color as WorkspaceDocument["color"],
    favorite: Boolean(favorite),
    authorId: ["andi", "sarah", "mia"][index % 3],
    createdAt: `2026-10-${12 + index}T09:00:00Z`,
    updatedAt: `2026-10-${12 + index}T09:00:00Z`,
    trashedAt: null,
  }));
}
