import { test, expect } from "@playwright/test";
test("project and task CRUD sync across views, reload, and keyboard sheet focus", async ({
  page,
}) => {
  await page.goto("/projects/website/board");
  await expect(
    page.getByRole("heading", { name: "Website redesign", exact: true }),
  ).toBeVisible();
  const trigger = page.getByRole("button", {
    name: "Explore competitor websites",
    exact: true,
  });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await page
    .getByLabel("Task title", { exact: true })
    .fill("Verify persistent workflow");
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Status", { exact: true }).selectOption("review");
  await page.getByLabel("Priority", { exact: true }).selectOption("urgent");
  await page.getByLabel("New subtask").fill("Review the result");
  await page.getByRole("button", { name: "Add subtask", exact: true }).click();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Task saved", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "List", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Verify persistent workflow",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Verify persistent workflow", exact: true })
    .click();
  await expect(page.getByLabel("Status", { exact: true })).toHaveValue(
    "review",
  );
  await expect(
    page.getByText("Review the result", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Edit project" }).click();
  await page.getByLabel("Project name").fill("Website refresh");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(
    page.getByRole("heading", { name: "Website refresh" }),
  ).toBeVisible();
});
test("deep links, recoverable missing IDs, search command, and archive", async ({
  page,
}) => {
  await page.goto("/projects/website/list?task=task-1");
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    "Explore competitor websites",
  );
  await page.keyboard.press("Escape");
  await expect(page).not.toHaveURL(/task=/);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.keyboard.press("Control+k");
  await page
    .getByPlaceholder("Search tasks, projects, or commands…")
    .fill("WEB-102");
  await page.getByRole("option").click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    "Audit existing content",
  );
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await page.getByRole("button", { name: "Confirm archive" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.goto("/projects/website/board?task=missing");
  await expect(page.getByText("Task not found", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back to workspace" }).click();
  await page.goto("/projects/missing/board");
  await expect(
    page.getByRole("heading", { name: "Project or view not found" }),
  ).toBeVisible();
});
test("keyboard board sorting updates persisted order", async ({ page }) => {
  await page.goto("/projects/website/board");
  const drag = page.getByRole("button", {
    name: "Move Explore competitor websites",
    exact: true,
  });
  await drag.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("status")).toContainText("task-1");
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("status")).toContainText("task-2");
  await page.keyboard.press("Space");
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("forma.workspace.v1")!).tasks.find(
            (t: { id: string }) => t.id === "task-1",
          ).order,
      ),
    )
    .toBe(1024);
  await page.reload();
  const titles = page
    .getByRole("region", { name: "Backlog", exact: true })
    .locator(".task-title");
  await expect(titles.nth(1)).toHaveText("Explore competitor websites");
});
test("mobile navigation, theme, and reset confirmation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/home");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByRole("radio", { name: "dark theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page
    .getByRole("button", { name: "Reset demo data", exact: true })
    .click();
  await page.getByRole("button", { name: "Keep my workspace" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("creates a project and moves a card into an empty column with the pointer", async ({
  page,
}) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByLabel("Project name").fill("Research sprint");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await page
    .getByRole("link")
    .filter({
      has: page.getByRole("heading", { name: "Research sprint", exact: true }),
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Research sprint", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Research sprint", exact: true }),
  ).toBeVisible();
  await page.goto("/projects/mobile/board");
  const handle = page.getByRole("button", {
    name: "Move Refine mobile interactions",
    exact: true,
  });
  await handle.waitFor();
  const from = await handle.boundingBox();
  const column = await page
    .getByRole("region", { name: "In progress", exact: true })
    .boundingBox();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(from!.x + 15, from!.y + 15, { steps: 3 });
  await page.mouse.move(column!.x + column!.width / 2, column!.y + 100, {
    steps: 15,
  });
  await page.mouse.up();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("forma.workspace.v1")!).tasks.find(
            (t: { id: string }) => t.id === "task-14",
          ).status,
      ),
    )
    .toBe("in_progress");
  await page.reload();
  await expect(
    page
      .getByRole("region", { name: "In progress", exact: true })
      .getByRole("button", { name: "Refine mobile interactions", exact: true }),
  ).toBeVisible();
});

test("corrupt storage recovers visibly and keeps the workspace usable", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("forma.workspace.v1", "{invalid"),
  );
  await page.goto("/home");
  await expect(page.getByRole("alert")).toContainText("fresh demo");
  await expect(
    page.getByRole("heading", { name: "Your projects" }),
  ).toBeVisible();
});

for (const scenario of ["same column", "across columns"] as const) {
  test(`drop animation lands at the committed position: ${scenario}`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      type Landing = { x: number; y: number };
      const state = window as Window & { dropLandings: Landing[] };
      state.dropLandings = [];
      const original = Element.prototype.animate;
      Element.prototype.animate = function (frames, options) {
        if (
          Array.isArray(frames) &&
          frames.length === 2 &&
          frames.every((frame) => typeof frame.transform === "string")
        ) {
          const rect = this.getBoundingClientRect();
          const current = new DOMMatrix(getComputedStyle(this).transform);
          const end = new DOMMatrix(String(frames.at(-1)!.transform));
          state.dropLandings.push({
            x: rect.x - current.e + end.e,
            y: rect.y - current.f + end.f,
          });
        }
        return original.call(this, frames, options);
      };
    });
    await page.goto("/projects/website/board");
    const handle = page.getByRole("button", {
      name: "Move Explore competitor websites",
      exact: true,
    });
    await handle.waitFor();
    const from = (await handle.boundingBox())!;
    const destination =
      scenario === "same column"
        ? (await page
            .getByRole("button", {
              name: "Audit existing content",
              exact: true,
            })
            .boundingBox())!
        : (await page
            .getByRole("region", { name: "In progress", exact: true })
            .boundingBox())!;
    await page.mouse.move(from.x + 5, from.y + 5);
    await page.mouse.down();
    await page.mouse.move(from.x + 20, from.y + 20, { steps: 3 });
    await page.mouse.move(destination.x + 70, destination.y + 30, {
      steps: 15,
    });
    await page.mouse.up();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as Window & { dropLandings: unknown[] }).dropLandings
              .length,
        ),
      )
      .toBeGreaterThan(0);
    const endpoint = await page.evaluate(() =>
      (
        window as Window & { dropLandings: { x: number; y: number }[] }
      ).dropLandings.at(-1)!,
    );
    const column = page.getByRole("region", {
      name: scenario === "same column" ? "Backlog" : "In progress",
      exact: true,
    });
    const landed = column.locator(".task-card").filter({
      has: page.getByRole("button", {
        name: "Explore competitor websites",
        exact: true,
      }),
    });
    await expect(landed).toBeVisible();
    const rect = (await landed.boundingBox())!;
    expect(Math.abs(endpoint.x - rect.x)).toBeLessThan(2);
    expect(Math.abs(endpoint.y - rect.y)).toBeLessThan(2);
  });
}

for (const scenario of [
  "same column",
  "populated column",
  "empty column",
] as const) {
  test(`landing frame reserves the committed slot: ${scenario}`, async ({
    page,
  }) => {
    await page.goto(
      scenario === "empty column"
        ? "/projects/mobile/board"
        : "/projects/website/board",
    );
    const title =
      scenario === "empty column"
        ? "Refine mobile interactions"
        : "Explore competitor websites";
    const handle = page.getByRole("button", {
      name: `Move ${title}`,
      exact: true,
    });
    await handle.waitFor();
    const from = (await handle.boundingBox())!;
    const target =
      scenario === "same column"
        ? page.getByRole("button", {
            name: "Audit existing content",
            exact: true,
          })
        : scenario === "populated column"
          ? page.getByRole("button", {
              name: "Design the pricing page",
              exact: true,
            })
          : page.getByRole("region", { name: "In progress", exact: true });
    const to = (await target.boundingBox())!;
    await page.mouse.move(from.x + 5, from.y + 5);
    await page.mouse.down();
    await page.mouse.move(from.x + 20, from.y + 20, { steps: 3 });
    await page.mouse.move(
      to.x + 60,
      to.y + (scenario === "empty column" ? 100 : 30),
      { steps: 15 },
    );
    const frame = page.getByTestId("drop-placeholder");
    const status =
      scenario === "same column"
        ? "backlog"
        : scenario === "populated column"
          ? "todo"
          : "in_progress";
    await expect(frame).toHaveAttribute("data-status", status);
    await expect(frame).toHaveAttribute(
      "data-index",
      scenario === "empty column" ? "0" : "1",
    );
    // Wait for the visual insertion marker to reach its slot, without a fixed delay.
    await expect
      .poll(() => frame.evaluate((el) => el.getAnimations().length))
      .toBe(0);
    const slot = await frame.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { y: rect.y + window.scrollY, height: rect.height };
    });
    if (scenario === "populated column") {
      const displaced = (await target.locator("..").boundingBox())!;
      expect(
        displaced.y + (await page.evaluate(() => window.scrollY)),
      ).toBeGreaterThan(slot.y + slot.height - 2);
    }
    await page.mouse.up();
    await expect(frame).toHaveCount(0);
    const region = page.getByRole("region", {
      name:
        scenario === "same column"
          ? "Backlog"
          : scenario === "populated column"
            ? "To do"
            : "In progress",
      exact: true,
    });
    const landed = region
      .locator(".task-card")
      .filter({ has: page.getByRole("button", { name: title, exact: true }) });
    await expect(landed).toBeVisible();
    await expect
      .poll(() =>
        landed.evaluate(
          (el, y) =>
            Math.abs(el.getBoundingClientRect().y + window.scrollY - y),
          slot.y,
        ),
      )
      .toBeLessThan(2);
  });
}

test("keyboard hover shows a landing frame and Escape removes it without changing order", async ({
  page,
}) => {
  await page.goto("/projects/website/board");
  const handle = page.getByRole("button", {
    name: "Move Explore competitor websites",
    exact: true,
  });
  await handle.focus();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("drop-placeholder")).toHaveAttribute(
    "data-index",
    "0",
  );
  await page.keyboard.press("ArrowDown");
  await expect(page.getByTestId("drop-placeholder")).toHaveAttribute(
    "data-index",
    "1",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("drop-placeholder")).toHaveCount(0);
  await expect(
    page
      .getByRole("region", { name: "Backlog", exact: true })
      .locator(".task-title")
      .first(),
  ).toHaveText("Explore competitor websites");
});
