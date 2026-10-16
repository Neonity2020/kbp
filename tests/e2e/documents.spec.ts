import { test, expect } from "@playwright/test";
test("creates a rich document, autosaves before refresh, and files it under a project", async ({
  page,
}) => {
  await page.goto("/docs");
  await page.getByRole("button", { name: "New doc", exact: true }).click();
  await page.getByLabel("Document name").fill("Launch playbook");
  await page.getByLabel("Project", { exact: true }).selectOption("website");
  await page
    .getByRole("button", { name: "Create document", exact: true })
    .click();
  await expect(page.getByLabel("Document title", { exact: true })).toHaveValue(
    "Launch playbook",
  );
  const body = page.getByRole("textbox", {
    name: "Document content",
    exact: true,
  });
  await body.fill("A careful first draft");
  await page.getByLabel("Bold", { exact: true }).click();
  await page.keyboard.type(" with a clear direction");
  await expect(body.locator("strong")).toContainText("clear direction");
  await expect(page.getByTestId("document-save-state")).toHaveText(
    "All changes saved",
  );
  await page
    .getByLabel("Document title", { exact: true })
    .fill("Launch playbook v2");
  await page.reload();
  await expect(page.getByLabel("Document title", { exact: true })).toHaveValue(
    "Launch playbook v2",
  );
  await expect(
    page.getByRole("textbox", { name: "Document content", exact: true }),
  ).toContainText("A careful first draft");
  await page
    .getByLabel("Document project", { exact: true })
    .selectOption("mobile");
  await page.goto("/projects/mobile/docs");
  await expect(
    page.getByRole("link", { name: "Launch playbook v2", exact: true }),
  ).toBeVisible();
  await page.goto("/projects/website/docs");
  await expect(
    page.getByRole("link", { name: "Launch playbook v2", exact: true }),
  ).toHaveCount(0);
});
test("searches document content, favorites, and switches library layout", async ({
  page,
}) => {
  await page.goto("/docs");
  await page.getByLabel("Search documents").fill("assumptions");
  await expect(
    page.getByRole("link", { name: "Website creative brief", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Kickoff · notes & next steps",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.getByLabel("Search documents").fill("");
  await page.getByLabel("Filter documents by project").selectOption("mobile");
  await page
    .getByRole("button", {
      name: "Favorite Mobile discovery notes",
      exact: true,
    })
    .click();
  await page.getByRole("radio", { name: "Favorites", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Mobile discovery notes", exact: true }),
  ).toBeVisible();
  await page.getByRole("radio", { name: "List view", exact: true }).click();
  await expect(page.locator(".doc-rows")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Filter documents by project")).toHaveValue(
    "mobile",
  );
  await expect(
    page.getByRole("link", { name: "Mobile discovery notes", exact: true }),
  ).toBeVisible();
});
test("templates, duplicate, trash confirmation, and restore preserve the document", async ({
  page,
}) => {
  await page.goto("/docs");
  await page
    .getByRole("button", { name: "Meeting notes Keep the conversation moving" })
    .click();
  await page.getByLabel("Document name").fill("Weekly review");
  await page
    .getByRole("button", { name: "Create document", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Document content" }),
  ).toContainText("Next steps");
  await page
    .getByRole("button", {
      name: "More actions for Weekly review",
      exact: true,
    })
    .click();
  await page.getByRole("menuitem", { name: "Duplicate", exact: true }).click();
  await expect(page.getByLabel("Document title", { exact: true })).toHaveValue(
    "Weekly review (copy)",
  );
  await page
    .getByRole("button", {
      name: "More actions for Weekly review (copy)",
      exact: true,
    })
    .click();
  await page
    .getByRole("menuitem", { name: "Move to trash", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Move to trash", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "This document is in Trash" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Restore document", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Document content" }),
  ).toContainText("Next steps");
});
test("flushes pending content on navigation and rejects unsafe links", async ({
  page,
}) => {
  await page.goto("/docs/creative-brief");
  const body = page.getByRole("textbox", { name: "Document content" });
  await body.fill("Review checkpoint");
  await page.getByRole("link", { name: "All docs", exact: true }).click();
  await page
    .getByRole("link", { name: "Website creative brief", exact: true })
    .click();
  await expect(body).toContainText("Review checkpoint");
  await body.focus();
  await page.keyboard.press("ControlOrMeta+a");
  await page.getByRole("button", { name: "Insert link", exact: true }).click();
  await page.getByLabel("URL", { exact: true }).fill("javascript:alert(1)");
  await page.getByRole("button", { name: "Apply link", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Use an https://");
  await page.keyboard.press("Escape");
  await expect(body.locator("a")).toHaveCount(0);
});
test("mobile docs navigation, missing IDs, and storage recovery work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/home");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Docs", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Docs", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Website creative brief", exact: true })
    .click();
  await expect(
    page.getByLabel("Document title", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/docs/missing");
  await expect(
    page.getByRole("heading", { name: "Document not found" }),
  ).toBeVisible();
  await page.evaluate(() =>
    localStorage.setItem("forma.documents.v1", "invalid"),
  );
  await page.goto("/docs");
  await expect(page.getByRole("alert")).toContainText("Document storage");
  await expect(
    page.getByRole("link", { name: "Website creative brief", exact: true }),
  ).toBeVisible();
});
