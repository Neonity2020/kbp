import { PageHeading } from "@/components/shared/page";
import { TaskWorkspace } from "./components/task-workspace";
export function MyTasks() {
  return (
    <div className="page">
      <PageHeading
        eyebrow="YOUR FOCUS"
        title="My tasks"
        description="Your next steps, all in one place."
      />
      <TaskWorkspace mine view="list" />
    </div>
  );
}
