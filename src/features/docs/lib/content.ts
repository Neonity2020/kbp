import type { JSONContent } from "@tiptap/core";
import type { DocumentTemplate } from "../types";
export function documentText(content: JSONContent): string {
  if (content.type === "text") return content.text ?? "";
  return (content.content ?? [])
    .map(documentText)
    .join(content.type === "paragraph" || content.type === "heading" ? "" : " ")
    .trim();
}
export function documentHeadings(
  content: JSONContent,
): { text: string; level: number; index: number }[] {
  return (content.content ?? []).flatMap((node, index) =>
    node.type === "heading"
      ? [
          {
            text: documentText(node),
            level: Number(node.attrs?.level ?? 2),
            index,
          },
        ]
      : [],
  );
}
export function wordCount(content: JSONContent): number {
  return documentText(content).match(/\S+/g)?.length ?? 0;
}
const p = (text: string): JSONContent => ({
  type: "paragraph",
  content: text ? [{ type: "text", text }] : [],
});
const h = (text: string): JSONContent => ({
  type: "heading",
  attrs: { level: 2 },
  content: [{ type: "text", text }],
});
const bullets = (items: string[]): JSONContent => ({
  type: "bulletList",
  content: items.map((text) => ({ type: "listItem", content: [p(text)] })),
});
export function templateContent(template: DocumentTemplate): JSONContent {
  const content: JSONContent[] =
    template === "blank"
      ? [p("")]
      : template === "brief"
        ? [
            p("A shared starting point for focused, thoughtful work."),
            h("The opportunity"),
            p(
              "What are we making, and why does it matter? Describe the problem and the people we are solving it for.",
            ),
            h("What success looks like"),
            bullets([
              "A clear, useful experience for our audience",
              "A consistent expression of our identity",
              "An accessible foundation that can grow with us",
            ]),
            h("Scope & deliverables"),
            p(
              "Outline the key deliverables, the boundaries, and the things we can explore later.",
            ),
            h("Milestones"),
            bullets([
              "Discover — align on the problem and gather insights",
              "Design — explore directions and refine the details",
              "Deliver — build, review, and launch with care",
            ]),
            h("Open questions"),
            p("Capture the assumptions we still need to test."),
          ]
        : template === "notes"
          ? [
              p("A little preparation makes room for a better conversation."),
              h("Agenda"),
              bullets([
                "What do we need to discuss?",
                "What decisions do we need to make?",
              ]),
              h("Discussion notes"),
              p("Capture the ideas, context, and questions that matter."),
              h("Decisions"),
              p("What did we agree on, and why?"),
              h("Next steps"),
              bullets(["Action item — owner — due date"]),
            ]
          : [
              p("Keep the reasoning close to the decision."),
              h("Context"),
              p("What problem or opportunity led to this decision?"),
              h("Options considered"),
              bullets([
                "Option A — benefits and tradeoffs",
                "Option B — benefits and tradeoffs",
              ]),
              h("Our decision"),
              p("Describe the chosen direction and the reasons behind it."),
              h("What happens next"),
              p("Document the next steps, owners, and things to revisit."),
            ];
  return { type: "doc", content };
}

export const templateNames: Record<DocumentTemplate, string> = {
  blank: "Blank document",
  brief: "Project brief",
  notes: "Meeting notes",
  decision: "Decision log",
};
