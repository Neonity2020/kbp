import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { documentRepository } from "@/repositories/document-repository";
import type { DocumentPatch, WorkspaceDocument } from "./types";
export function useDocumentDraft(document: WorkspaceDocument) {
  const client = useQueryClient();
  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState(document.content);
  const [status, setStatus] = useState<
    "saved" | "saving" | "session" | "error"
  >(documentRepository.warning ? "session" : "saved");
  const pending = useRef<DocumentPatch | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  const flush = useCallback(() => {
    clearTimeout(timer.current);
    if (!pending.current) return;
    try {
      documentRepository.save(document.id, pending.current);
      pending.current = null;
      client.setQueryData(["documents"], documentRepository.snapshot());
      if (mounted.current)
        setStatus(documentRepository.warning ? "session" : "saved");
    } catch {
      if (mounted.current) setStatus("error");
    }
  }, [client, document.id]);
  const queue = (patch: DocumentPatch) => {
    if (patch.title !== undefined) setTitle(patch.title);
    if (patch.content) setContent(patch.content);
    pending.current = { ...pending.current, ...patch };
    setStatus("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 600);
  };
  useEffect(() => {
    mounted.current = true;
    const hide = () => {
      if (documentVisibilityHidden()) flush();
    };
    window.addEventListener("pagehide", flush);
    window.document.addEventListener("visibilitychange", hide);
    return () => {
      mounted.current = false;
      flush();
      window.removeEventListener("pagehide", flush);
      window.document.removeEventListener("visibilitychange", hide);
    };
  }, [flush]);
  return { title, content, status, queue, flush };
}
function documentVisibilityHidden() {
  return window.document.visibilityState === "hidden";
}
