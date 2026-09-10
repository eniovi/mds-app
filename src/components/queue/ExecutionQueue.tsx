"use client";

import { useState } from "react";
import { GripIcon } from "../icons/GripIcon";
import { ArrowIcon } from "../icons/ArrowIcon";
import { computeGroups, moveGroup, moveItem, reorderByDrag } from "@/lib/queue-order";
import { useLanguage } from "@/lib/useLanguage";
import type { TreeFileEntry } from "@/lib/file-tree";

interface ExecutionQueueProps {
  items: TreeFileEntry[];
  onChange: (items: TreeFileEntry[]) => void;
  onRemove: (path: string) => void;
}

/** Native HTML5 drag-and-drop (no @dnd-kit) — this environment has no network
 * access to verify a new dependency installs, so reordering is built on
 * platform APIs instead. Every drag action has an up/down-arrow equivalent,
 * which also makes the queue keyboard-operable (drag alone wouldn't be). */
export function ExecutionQueue({ items, onChange, onRemove }: ExecutionQueueProps) {
  const { t } = useLanguage();
  const [draggingPath, setDraggingPath] = useState<string | null>(null);
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <p className="queue-empty" data-od-id="queue-empty">
        {t("queue.emptyQueue")}
      </p>
    );
  }

  const groups = computeGroups(items);

  function handleDrop(targetPath: string) {
    if (draggingPath && draggingPath !== targetPath) {
      onChange(reorderByDrag(items, draggingPath, targetPath));
    }
    setDraggingPath(null);
    setDragOverPath(null);
  }

  return (
    <div className="queue-list scrollbar-thin" data-od-id="execution-queue">
      {groups.map((group, groupIndex) => (
        <div className="queue-group" key={group.dir + "-" + group.startIndex} data-od-id={"queue-group-" + group.dir.replace(/\//g, "-")}>
          <div className="queue-group-head">
            <span className="queue-group-dir">{group.dir}/</span>
            <span className="caption">{group.items.length} {t("common.file", { count: group.items.length })}</span>
            <div className="queue-group-actions">
              <button
                className="queue-icon-btn"
                disabled={groupIndex === 0}
                onClick={() => onChange(moveGroup(items, groupIndex, "up"))}
                aria-label={t("queue.moveFolderUpAria", { dir: group.dir })}
                title={t("queue.moveGroupUpTitle")}
              >
                <ArrowIcon direction="up" />
              </button>
              <button
                className="queue-icon-btn"
                disabled={groupIndex === groups.length - 1}
                onClick={() => onChange(moveGroup(items, groupIndex, "down"))}
                aria-label={t("queue.moveFolderDownAria", { dir: group.dir })}
                title={t("queue.moveGroupDownTitle")}
              >
                <ArrowIcon direction="down" />
              </button>
            </div>
          </div>

          {group.items.map((item, itemIndexInGroup) => {
            const globalIndex = group.startIndex + itemIndexInGroup;
            return (
              <div
                key={item.path}
                className={"queue-row" + (draggingPath === item.path ? " dragging" : "") + (dragOverPath === item.path ? " drag-over" : "")}
                draggable
                onDragStart={() => setDraggingPath(item.path)}
                onDragOver={(e) => { e.preventDefault(); setDragOverPath(item.path); }}
                onDragLeave={() => setDragOverPath((p) => (p === item.path ? null : p))}
                onDrop={(e) => { e.preventDefault(); handleDrop(item.path); }}
                onDragEnd={() => { setDraggingPath(null); setDragOverPath(null); }}
                data-od-id={"queue-row-" + item.path.replace(/\//g, "-")}
              >
                <span className="queue-grip" aria-hidden="true"><GripIcon /></span>
                <span className="queue-row-index">{globalIndex + 1}</span>
                <span className="queue-row-name">{item.filename}</span>
                <div className="queue-row-actions">
                  <button
                    className="queue-icon-btn"
                    disabled={globalIndex === 0}
                    onClick={() => onChange(moveItem(items, globalIndex, "up"))}
                    aria-label={t("queue.moveFileUpAria", { filename: item.filename })}
                  >
                    <ArrowIcon direction="up" />
                  </button>
                  <button
                    className="queue-icon-btn"
                    disabled={globalIndex === items.length - 1}
                    onClick={() => onChange(moveItem(items, globalIndex, "down"))}
                    aria-label={t("queue.moveFileDownAria", { filename: item.filename })}
                  >
                    <ArrowIcon direction="down" />
                  </button>
                  <button
                    className="queue-icon-btn remove"
                    onClick={() => onRemove(item.path)}
                    aria-label={t("queue.removeFileAria", { filename: item.filename })}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
