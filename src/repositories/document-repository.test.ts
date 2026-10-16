import { beforeEach, describe, expect, it } from "vitest";
import { LocalDocumentRepository, DOCUMENTS_KEY } from "./document-repository";
import {
  documentText,
  documentHeadings,
  wordCount,
  templateContent,
} from "@/features/docs/lib/content";
beforeEach(() => localStorage.clear());
describe("document repository", () => {
  it("seeds documents once and preserves their content across reloads", async () => {
    const r = new LocalDocumentRepository();
    expect(await r.list()).toHaveLength(6);
    const created = await r.create({
      title: "New brief",
      projectId: "website",
      template: "brief",
    });
    r.save(created.id, { title: "Edited brief" });
    const restored = (await new LocalDocumentRepository().list()).find(
      (d) => d.id === created.id,
    )!;
    expect(restored.title).toBe("Edited brief");
    expect(documentHeadings(restored.content)).toHaveLength(5);
  });
  it("moves, favorites, trashes, and restores without losing content", async () => {
    const r = new LocalDocumentRepository();
    const original = (await r.list())[0];
    await r.update(original.id, {
      projectId: "mobile",
      favorite: false,
      trashedAt: new Date().toISOString(),
    });
    const restored = await r.update(original.id, { trashedAt: null });
    expect(restored.projectId).toBe("mobile");
    expect(restored.favorite).toBe(false);
    expect(restored.content).toEqual(original.content);
  });
  it("duplicates the latest content using independent document IDs", async () => {
    const r = new LocalDocumentRepository();
    r.save("creative-brief", { title: "Latest title" });
    const copy = await r.duplicate("creative-brief");
    expect(copy.title).toBe("Latest title (copy)");
    expect(copy.id).not.toBe("creative-brief");
    r.save(copy.id, { title: "Independent copy" });
    expect((await r.list()).find((d) => d.id === "creative-brief")!.title).toBe(
      "Latest title",
    );
  });
  it("rejects unsupported nodes and unsafe links without changing saved content", async () => {
    const r = new LocalDocumentRepository();
    const before = r.snapshot();
    expect(() =>
      r.save("creative-brief", {
        content: {
          type: "doc",
          content: [{ type: "script", text: "alert(1)" }],
        },
      }),
    ).toThrow();
    expect(() =>
      r.save("creative-brief", {
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "bad link",
                  marks: [
                    { type: "link", attrs: { href: "javascript:alert(1)" } },
                  ],
                },
              ],
            },
          ],
        },
      }),
    ).toThrow();
    expect(r.snapshot()).toEqual(before);
  });
  it("falls back visibly for corrupt or unsupported storage", () => {
    localStorage.setItem(DOCUMENTS_KEY, "invalid");
    expect(new LocalDocumentRepository().warning).toContain(
      "could not be read",
    );
    localStorage.setItem(
      DOCUMENTS_KEY,
      JSON.stringify({ schemaVersion: 9, documents: [] }),
    );
    expect(new LocalDocumentRepository().warning).toBeTruthy();
  });
  it("retains a writable session if persistence fails and resets demo data", async () => {
    const r = new LocalDocumentRepository({
      getItem: () => null,
      setItem: () => {
        throw Error("quota");
      },
    });
    await r.update("creative-brief", { title: "Session title" });
    expect(r.snapshot()[0].title).toBe("Session title");
    expect(r.warning).toContain("session");
    r.reset();
    expect(r.snapshot()[0].title).toBe("Website creative brief");
  });
  it("normalizes blank titles and rejects unknown IDs", async () => {
    const r = new LocalDocumentRepository();
    expect(r.save("creative-brief", { title: "  " }).title).toBe(
      "Untitled document",
    );
    await expect(r.update("missing", { title: "No" })).rejects.toThrow(
      "not found",
    );
  });
});
it("extracts searchable text, headings, and a readable word count", () => {
  const content = templateContent("notes");
  expect(documentText(content)).toContain("Agenda");
  expect(documentHeadings(content).map((h) => h.text)).toEqual([
    "Agenda",
    "Discussion notes",
    "Decisions",
    "Next steps",
  ]);
  expect(wordCount(content)).toBeGreaterThan(15);
  expect(wordCount(templateContent("blank"))).toBe(0);
});
