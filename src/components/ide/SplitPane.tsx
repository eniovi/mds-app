"use client";

import { useCallback, useRef, useState } from "react";
import { useLanguage } from "@/lib/useLanguage";

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
}

/** Resizable two-pane layout, drag handle styled with DS tokens
 * (var(--border) at rest, var(--brand-strong) while hovering/dragging —
 * the same hover language already used on inputs/cards elsewhere). */
export function SplitPane({ left, right, defaultLeftWidth = 260, minLeftWidth = 180, maxLeftWidth = 480 }: SplitPaneProps) {
  const { t } = useLanguage();
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const draggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const next = Math.min(maxLeftWidth, Math.max(minLeftWidth, e.clientX - rect.left));
      setLeftWidth(next);
    },
    [minLeftWidth, maxLeftWidth]
  );

  const stopDragging = useCallback(() => {
    draggingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  return (
    <div className="ide-split" ref={containerRef}>
      <div className="ide-split-left" style={{ width: leftWidth }}>{left}</div>
      <div
        className="ide-split-handle"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        role="separator"
        aria-orientation="vertical"
        aria-label={t("ideToolbar.resizePanelAria")}
        data-od-id="ide-splitter"
      />
      <div className="ide-split-right">{right}</div>
    </div>
  );
}
