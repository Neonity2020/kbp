import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Download, Ellipsis, Star, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useDocumentActions } from "../api";
import { documentText } from "../lib/content";
import type { WorkspaceDocument } from "../types";
export function DocumentMenu({
  document: doc,
  beforeAction,
}: {
  document: WorkspaceDocument;
  beforeAction?: () => void;
}) {
  const actions = useDocumentActions();
  const navigate = useNavigate();
  const [trash, setTrash] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`More actions for ${doc.title}`}
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            {doc.trashedAt ? (
              <DropdownMenuItem
                onSelect={() =>
                  void actions
                    .update(doc.id, { trashedAt: null })
                    .then(() => toast.success("Document restored"))
                    .catch(() => {})
                }
              >
                <Undo2 />
                Restore document
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem
                  onSelect={() => {
                    beforeAction?.();
                    void actions
                      .update(doc.id, { favorite: !doc.favorite })
                      .catch(() => {});
                  }}
                >
                  <Star />
                  {doc.favorite ? "Remove from favorites" : "Add to favorites"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    beforeAction?.();
                    void actions
                      .duplicate(doc.id)
                      .then((value) =>
                        navigate(`/docs/${(value as WorkspaceDocument).id}`),
                      )
                      .catch(() => {});
                  }}
                >
                  <Copy />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    beforeAction?.();
                    const blob = new Blob(
                      [
                        `${doc.title}\n\n${(doc.content.content ?? []).map(documentText).join("\n\n")}`,
                      ],
                      { type: "text/plain;charset=utf-8" },
                    );
                    const url = URL.createObjectURL(blob);
                    const anchor = document.createElement("a");
                    anchor.href = url;
                    anchor.download = `${doc.title.replace(/[^\p{L}\p{N} -]/gu, "").slice(0, 80) || "document"}.txt`;
                    anchor.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  }}
                >
                  <Download />
                  Download as text
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuGroup>
          {!doc.trashedAt && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setTrash(true)}
                >
                  <Trash2 />
                  Move to trash
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={trash} onOpenChange={setTrash}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move this document to trash?</DialogTitle>
            <DialogDescription>
              “{doc.title}” will be hidden from your library. You can restore it
              from Trash.
            </DialogDescription>
          </DialogHeader>
          <Button
            variant="destructive"
            onClick={async () => {
              beforeAction?.();
              try {
                await actions.update(doc.id, {
                  trashedAt: new Date().toISOString(),
                });
                setTrash(false);
                toast.success("Document moved to trash");
              } catch {
                /* Reported */
              }
            }}
          >
            Move to trash
          </Button>
          <Button variant="outline" onClick={() => setTrash(false)}>
            Keep document
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
