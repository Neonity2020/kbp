import type {
  Activity,
  Label,
  Member,
  Project,
  Task,
  Workspace,
} from "@/features/tasks/types";
export const members: Member[] = [
  { id: "andi", name: "Alex Morgan", initials: "AM", color: "#dce7db" },
  { id: "sarah", name: "Sarah Chen", initials: "SC", color: "#e6ddf2" },
  { id: "james", name: "James Wilson", initials: "JW", color: "#f4e0cc" },
  { id: "mia", name: "Mia Patel", initials: "MP", color: "#d9e6f2" },
];
export const labels: Label[] = [
  { id: "design", name: "Design", color: "purple" },
  { id: "frontend", name: "Frontend", color: "blue" },
  { id: "research", name: "Research", color: "orange" },
  { id: "content", name: "Content", color: "green" },
];
export interface Database {
  schemaVersion: 1;
  workspace: Workspace;
  projects: Project[];
  tasks: Task[];
  activities: Activity[];
}
export function seed(): Database {
  const projects: Project[] = [
    {
      id: "website",
      workspaceId: "studio",
      key: "WEB",
      name: "Website redesign",
      description:
        "A fresh digital home for a new chapter. Thoughtful design, clearer stories, and a better experience for everyone.",
      color: "#7370cc",
      status: "active",
      memberIds: members.map((m) => m.id),
      archived: false,
    },
    {
      id: "mobile",
      workspaceId: "studio",
      key: "APP",
      name: "Mobile experience",
      description: "Making everyday moments feel effortless.",
      color: "#cb9160",
      status: "planning",
      memberIds: ["andi", "mia"],
      archived: false,
    },
    {
      id: "brand",
      workspaceId: "studio",
      key: "BRD",
      name: "Brand evolution",
      description: "Building a more expressive and consistent identity.",
      color: "#719a80",
      status: "active",
      memberIds: ["sarah", "james"],
      archived: false,
    },
  ];
  const titles = [
    "Explore competitor websites",
    "Audit existing content",
    "Define the new sitemap",
    "Create homepage wireframes",
    "Build the component library",
    "Design the pricing page",
    "Develop responsive navigation",
    "Write the brand story",
    "Review accessibility guidelines",
    "Test the onboarding flow",
    "Set up project repository",
    "Gather stakeholder feedback",
    "Launch checklist",
    "Refine mobile interactions",
    "Create brand guidelines",
    "Explore illustration directions",
  ];
  const states: Task["status"][] = [
    "backlog",
    "backlog",
    "todo",
    "in_progress",
    "in_progress",
    "todo",
    "in_progress",
    "review",
    "todo",
    "review",
    "done",
    "done",
    "backlog",
    "todo",
    "in_progress",
    "review",
  ];
  const tasks: Task[] = titles.map((title, i) => ({
    id: `task-${i + 1}`,
    key: `${i < 13 ? "WEB" : i === 13 ? "APP" : "BRD"}-${101 + i}`,
    projectId: i < 13 ? "website" : i === 13 ? "mobile" : "brand",
    title,
    description:
      "Bring a thoughtful perspective to the details. Share an initial direction with the team, collect feedback, and refine before the next milestone.",
    status: states[i],
    priority: (
      [
        "medium",
        "low",
        "high",
        "high",
        "medium",
        "medium",
        "high",
        "low",
        "medium",
        "urgent",
        "none",
        "low",
        "medium",
        "high",
        "medium",
        "low",
      ] as const
    )[i],
    assigneeId: members[i % 4].id,
    startDate: "2026-10-12",
    dueDate: `2026-10-${String(15 + (i % 12)).padStart(2, "0")}`,
    labelIds: [labels[i % 4].id],
    order: i * 1024,
    archived: false,
    createdAt: "2026-10-12T09:00:00Z",
    updatedAt: "2026-10-12T09:00:00Z",
    completedAt: states[i] === "done" ? "2026-10-15T09:00:00Z" : null,
    subtasks:
      i % 3 === 0
        ? [
            {
              id: `sub-${i}`,
              title: "Share the first draft",
              completed: false,
            },
            {
              id: `sub-${i}-2`,
              title: "Collect team feedback",
              completed: true,
            },
          ]
        : [],
  }));
  return {
    schemaVersion: 1,
    workspace: { id: "studio", name: "Forma Studio" },
    projects,
    tasks,
    activities: [],
  };
}
