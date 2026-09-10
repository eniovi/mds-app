"use client";

import { baseName } from "@/lib/file-content";
import { useLanguage } from "@/lib/useLanguage";

interface EditorTabsProps {
  paths: string[];
  activePath: string | null;
  dirtyPaths: Set<string>;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
}

export function EditorTabs({ paths, activePath, dirtyPaths, onSelect, onClose }: EditorTabsProps) {
  const { t } = useLanguage();
  if (paths.length === 0) return null;

  return (
    <div className="ide-tabs scrollbar-thin" data-od-id="editor-tabs">
      {paths.map((path) => (
        <div
          key={path}
          className={"ide-tab" + (activePath === path ? " active" : "")}
          onClick={() => onSelect(path)}
          data-od-id={"editor-tab-" + path.replace(/\//g, "-")}
        >
          {dirtyPaths.has(path) && <span className="ide-dirty-dot" aria-label={t("ideToolbar.unsavedChanges")} />}
          <span className="ide-tab-name">{baseName(path)}</span>
          <button
            className="ide-tab-close"
            onClick={(e) => {
              e.stopPropagation();
              onClose(path);
            }}
            aria-label={t("ideToolbar.closeTabAria", { name: baseName(path) })}
            data-od-id={"close-tab-" + path.replace(/\//g, "-")}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
