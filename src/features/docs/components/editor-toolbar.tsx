import { useState } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
  Undo2,
  Redo2,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { safeDocumentHref } from "@/repositories/document-repository";
export function EditorToolbar({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [href, setHref] = useState("");
  const [error, setError] = useState("");
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      marks: ["bold", "italic", "underline", "strike"].filter((mark) =>
        e.isActive(mark),
      ),
      blocks: ["bulletList", "orderedList", "blockquote", "codeBlock"].filter(
        (block) => e.isActive(block),
      ),
      heading: e.isActive("heading", { level: 1 })
        ? "1"
        : e.isActive("heading", { level: 2 })
          ? "2"
          : e.isActive("heading", { level: 3 })
            ? "3"
            : "paragraph",
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      link: e.isActive("link"),
    }),
  });
  return (
    <>
      <div
        className="doc-editor-toolbar"
        role="toolbar"
        aria-label="Document formatting"
        onMouseDown={(e) => {
          // Keep the editor selection and caret when pointer users format text.
          if ((e.target as Element).closest("button")) e.preventDefault();
        }}
      >
        <select
          aria-label="Text style"
          value={state.heading}
          onChange={(e) => {
            if (e.target.value === "paragraph")
              editor.chain().focus().setParagraph().run();
            else
              editor
                .chain()
                .focus()
                .toggleHeading({ level: Number(e.target.value) as 1 | 2 | 3 })
                .run();
          }}
        >
          <option value="paragraph">Text</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>
        <span className="toolbar-divider" />
        <ToggleGroup
          type="multiple"
          value={state.marks}
          spacing={0}
          size="sm"
          onValueChange={(values) => {
            for (const mark of ["bold", "italic", "underline", "strike"]) {
              if (values.includes(mark) !== state.marks.includes(mark))
                editor.chain().focus().toggleMark(mark).run();
            }
          }}
        >
          {(
            [
              ["bold", Bold],
              ["italic", Italic],
              ["underline", Underline],
              ["strike", Strikethrough],
            ] as const
          ).map(([mark, Icon]) => (
            <ToggleGroupItem
              value={mark}
              key={mark}
              aria-label={
                mark === "strike"
                  ? "Strikethrough"
                  : mark.charAt(0).toUpperCase() + mark.slice(1)
              }
            >
              <Icon />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <span className="toolbar-divider" />
        <ToggleGroup
          type="multiple"
          value={state.blocks}
          spacing={0}
          size="sm"
          onValueChange={(values) => {
            const block = [
              "bulletList",
              "orderedList",
              "blockquote",
              "codeBlock",
            ].find((b) => values.includes(b) !== state.blocks.includes(b));
            if (block === "bulletList")
              editor.chain().focus().toggleBulletList().run();
            if (block === "orderedList")
              editor.chain().focus().toggleOrderedList().run();
            if (block === "blockquote")
              editor.chain().focus().toggleBlockquote().run();
            if (block === "codeBlock")
              editor.chain().focus().toggleCodeBlock().run();
          }}
        >
          {(
            [
              ["bulletList", List, "Bullet list"],
              ["orderedList", ListOrdered, "Numbered list"],
              ["blockquote", Quote, "Quote"],
              ["codeBlock", Code, "Code block"],
            ] as const
          ).map(([value, Icon, label]) => (
            <ToggleGroupItem key={value} value={value} aria-label={label}>
              <Icon />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button
          variant={state.link ? "secondary" : "ghost"}
          size="icon-sm"
          aria-label="Insert link"
          onClick={() => {
            setHref(String(editor.getAttributes("link").href ?? ""));
            setError("");
            setLinkOpen(true);
          }}
        >
          <Link2 />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Insert divider"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus />
        </Button>
        <span className="toolbar-divider" />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Undo"
          disabled={!state.canUndo}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Redo"
          disabled={!state.canRedo}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 />
        </Button>
      </div>
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a link</DialogTitle>
            <DialogDescription>
              Link to a web page or email address.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!safeDocumentHref(href.trim())) {
                setError("Use an https://, http://, or mailto: address.");
                return;
              }
              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: href.trim() })
                .run();
              setLinkOpen(false);
            }}
          >
            <FieldGroup>
              <Field data-invalid={!!error}>
                <FieldLabel htmlFor="document-link">URL</FieldLabel>
                <Input
                  id="document-link"
                  value={href}
                  onChange={(e) => setHref(e.target.value)}
                  placeholder="https://example.com"
                  aria-invalid={!!error}
                />
                {error && <p role="alert">{error}</p>}
              </Field>
              <Button type="submit">Apply link</Button>
              {state.link && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .extendMarkRange("link")
                      .unsetLink()
                      .run();
                    setLinkOpen(false);
                  }}
                >
                  Remove link
                </Button>
              )}
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
