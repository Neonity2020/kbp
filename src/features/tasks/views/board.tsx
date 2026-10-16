import { flushSync } from "react-dom";
import { useLayoutEffect, useRef, useState } from "react";
import {
  DndContext,
  closestCorners,
  pointerWithin,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "../components/task-card";
import { statuses, statusNames, type Task, type TaskStatus } from "../types";
import { useActions } from "../api";
import { moveTask } from "../lib/move-task";
import { boardDrop } from "../lib/board-drop";
type LandingPreview = {
  index: number;
  height: number;
  sourceStatus: TaskStatus;
};
function SortableCard({
  task,
  onOpen,
  previewOffset = 0,
}: {
  task: Task;
  onOpen: () => void;
  previewOffset?: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      data-task-id={task.id}
      style={{
        transform: CSS.Transform.toString({
          ...transform,
          x: transform?.x ?? 0,
          y: (transform?.y ?? 0) + previewOffset,
          scaleX: transform?.scaleX ?? 1,
          scaleY: transform?.scaleY ?? 1,
        }),
        transition,
        opacity: isDragging ? 0 : 1,
      }}
    >
      <TaskCard
        task={task}
        onOpen={onOpen}
        handle={
          <button
            className="drag-handle"
            aria-label={`Move ${task.title}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical />
          </button>
        }
      />
    </div>
  );
}
function Column({
  status,
  tasks,
  onOpen,
  onCreate,
  disabled,
  preview,
  activeId,
}: {
  status: TaskStatus;
  tasks: Task[];
  onOpen: (id: string) => void;
  onCreate: (status: TaskStatus) => void;
  disabled: boolean;
  preview?: LandingPreview;
  activeId?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status, disabled });
  const cardsRef = useRef<HTMLDivElement>(null);
  const [previewTop, setPreviewTop] = useState(0);
  const crossColumn = !!preview && preview.sourceStatus !== status;
  useLayoutEffect(() => {
    if (!preview || !cardsRef.current) return;
    const peers = Array.from(
      cardsRef.current.querySelectorAll<HTMLElement>("[data-task-id]"),
    ).filter((node) => node.dataset.taskId !== activeId);
    const top = peers
      .slice(0, preview.index)
      .reduce((sum, node) => sum + node.offsetHeight + 10, 0);
    setPreviewTop(top);
  }, [preview, activeId, tasks]);
  return (
    <section
      ref={setNodeRef}
      className={`board-column ${preview || isOver ? "drop-target" : ""}`}
      aria-label={statusNames[status]}
    >
      <div className="column-header">
        <span className={`status-dot status-${status}`} />
        <h3>{statusNames[status]}</h3>
        <span className="count">{tasks.length}</span>
        <span className="column-actions">
          <Ellipsis />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Add task to ${statusNames[status]}`}
            onClick={() => onCreate(status)}
          >
            <Plus />
          </Button>
        </span>
      </div>
      <div className="column-cards">
        <div
          ref={cardsRef}
          className="sortable-cards"
          style={{
            paddingBottom: crossColumn
              ? preview.height + (tasks.length ? 10 : 0)
              : undefined,
          }}
        >
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((t) =>
              disabled ? (
                <TaskCard key={t.id} task={t} onOpen={() => onOpen(t.id)} />
              ) : (
                <SortableCard
                  key={t.id}
                  task={t}
                  onOpen={() => onOpen(t.id)}
                  previewOffset={
                    crossColumn && tasks.indexOf(t) >= preview.index
                      ? preview.height + 10
                      : 0
                  }
                />
              ),
            )}
          </SortableContext>
          {preview && (
            <div
              className="drop-placeholder"
              data-testid="drop-placeholder"
              data-status={status}
              data-index={preview.index}
              aria-hidden="true"
              style={{ top: previewTop, height: preview.height }}
            >
              <span>Drop here</span>
            </div>
          )}
        </div>
        <button className="add-task" onClick={() => onCreate(status)}>
          <Plus /> Add task
        </button>
      </div>
    </section>
  );
}
export default function Board({
  tasks,
  onOpen,
  onCreate,
  manual,
}: {
  tasks: Task[];
  onOpen: (id: string) => void;
  onCreate: (s: TaskStatus) => void;
  manual: boolean;
}) {
  const actions = useActions();
  const [active, setActive] = useState<Task | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [activeHeight, setActiveHeight] = useState(157);
  const [landing, setLanding] = useState<{
    source: Task[];
    tasks: Task[];
  } | null>(null);
  const displayedTasks = landing?.source === tasks ? landing.tasks : tasks;
  const hoverInput =
    active && overId ? boardDrop(tasks, active.id, overId) : null;
  const previewStatus =
    hoverInput?.targetStatus ??
    (active && overId === active.id ? active.status : null);
  const peers = tasks.filter(
    (t) => t.status === previewStatus && t.id !== active?.id,
  );
  const previewIndex = hoverInput?.beforeTaskId
    ? peers.findIndex((t) => t.id === hoverInput.beforeTaskId)
    : hoverInput?.afterTaskId
      ? peers.findIndex((t) => t.id === hoverInput.afterTaskId) + 1
      : hoverInput
        ? peers.length
        : tasks
            .filter((t) => t.status === previewStatus)
            .findIndex((t) => t.id === active?.id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  function drop(event: DragEndEvent) {
    setActive(null);
    if (!manual || !event.over || event.active.id === event.over.id) return;
    setOverId(null);
    const input = boardDrop(
      tasks,
      String(event.active.id),
      String(event.over.id),
    );
    if (!input) return;
    // Commit the destination DOM before DragOverlay measures its landing rect.
    flushSync(() => {
      // Query observers notify asynchronously; keep the landing layout synchronous.
      setLanding({
        source: tasks,
        tasks: moveTask(tasks, input).sort(
          (a, b) => a.order - b.order || a.key.localeCompare(b.key),
        ),
      });
    });
    void actions.move(input).catch(() => setLanding(null));
  }
  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={(args) => {
          const pointerHits = pointerWithin(args);
          return pointerHits.length ? pointerHits : closestCorners(args);
        }}
        onDragStart={(e) => {
          setActive(tasks.find((t) => t.id === e.active.id) ?? null);
          setActiveHeight(e.active.rect.current.initial?.height ?? 157);
          setOverId(String(e.active.id));
        }}
        onDragOver={(e) => setOverId(e.over ? String(e.over.id) : null)}
        onDragCancel={() => {
          setActive(null);
          setOverId(null);
        }}
        onDragEnd={drop}
      >
        <div className="board">
          {statuses.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={displayedTasks.filter((t) => t.status === status)}
              onOpen={onOpen}
              onCreate={onCreate}
              disabled={!manual}
              activeId={active?.id}
              preview={
                active && manual && previewStatus === status
                  ? {
                      index: Math.max(0, previewIndex),
                      height: activeHeight,
                      sourceStatus: active.status,
                    }
                  : undefined
              }
            />
          ))}
        </div>
        <DragOverlay
          dropAnimation={{
            duration: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? 0
              : 180,
            easing: "cubic-bezier(0.2, 0, 0, 1)",
            sideEffects: defaultDropAnimationSideEffects({
              styles: { active: { opacity: "0" } },
            }),
          }}
        >
          {active && <TaskCard task={active} onOpen={() => {}} />}
        </DragOverlay>
      </DndContext>
      {!manual && (
        <p className="muted small">
          Choose manual order and status grouping to reorder cards. You can
          always change status in task details.
        </p>
      )}
    </>
  );
}
