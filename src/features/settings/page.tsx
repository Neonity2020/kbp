import { useState } from "react";
import { toast } from "sonner";
import { PageHeading } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useActions } from "../tasks/api";
export function SettingsPage({
  theme,
  setTheme,
}: {
  theme: "light" | "dark" | "system";
  setTheme: (t: "light" | "dark" | "system") => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const actions = useActions();
  return (
    <div className="page settings-page">
      <PageHeading
        eyebrow="MAKE YOURSELF AT HOME"
        title="Workspace settings"
        description="A few small preferences for a better working day."
      />
      <section className="settings-section">
        <h2>Appearance</h2>
        <p>Choose the theme that feels right for you.</p>
        <ToggleGroup
          type="single"
          value={theme}
          onValueChange={(v) => {
            if (v) setTheme(v as typeof theme);
          }}
          variant="outline"
        >
          {(["light", "dark", "system"] as const).map((t) => (
            <ToggleGroupItem key={t} value={t} aria-label={`${t} theme`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>
      <section className="settings-section">
        <h2>Demo workspace</h2>
        <p>
          Your projects, tasks, and docs are stored in this browser. Reset to
          restore the original demo.
        </p>
        <Button variant="outline" onClick={() => setConfirm(true)}>
          Reset demo data
        </Button>
      </section>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset your workspace?</DialogTitle>
            <DialogDescription>
              This removes local edits and restores the demo projects and tasks.
            </DialogDescription>
          </DialogHeader>
          <Button
            variant="destructive"
            onClick={async () => {
              try {
                await actions.reset();
                setConfirm(false);
                toast.success("Demo workspace restored");
              } catch {
                /* Reported */
              }
            }}
          >
            Reset demo data
          </Button>
          <Button variant="outline" onClick={() => setConfirm(false)}>
            Keep my workspace
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
