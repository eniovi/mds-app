"use client";

import { useState } from "react";
import { FolderIcon } from "../icons/FolderIcon";
import { FileIcon } from "../icons/FileIcon";
import { ChevronRightIcon } from "../icons/ChevronRightIcon";
import { useLanguage } from "@/lib/useLanguage";
import { runTaskLabel } from "@/lib/task-catalog-i18n";
import type { TreeDirNode, TreeFileEntry } from "@/lib/file-tree";

interface FileTreeProps {
  nodes: TreeDirNode[];
  activePath: string | null;
  dirtyPaths: Set<string>;
  defaultExpanded: Set<string>;
  onOpenFile: (file: TreeFileEntry) => void;
}

export function FileTree({ nodes, activePath, dirtyPaths, defaultExpanded, onOpenFile }: FileTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(defaultExpanded);

  function toggle(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  return (
    <div className="ide-tree scrollbar-thin" data-od-id="file-tree">
      {nodes.map((n) => (
        <DirRow key={n.path} node={n} depth={0} expanded={expanded} onToggle={toggle} activePath={activePath} dirtyPaths={dirtyPaths} onOpenFile={onOpenFile} />
      ))}
    </div>
  );
}

function DirRow({
  node,
  depth,
  expanded,
  onToggle,
  activePath,
  dirtyPaths,
  onOpenFile,
}: {
  node: TreeDirNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  activePath: string | null;
  dirtyPaths: Set<string>;
  onOpenFile: (file: TreeFileEntry) => void;
}) {
  const { t } = useLanguage();
  const isOpen = expanded.has(node.path);
  const totalFiles = node.files.length;

  return (
    <div>
      <button
        className="ide-tree-row ide-tree-dir"
        style={{ paddingLeft: 8 + depth * 16 }}
        onClick={() => onToggle(node.path)}
        data-od-id={"tree-dir-" + node.path.replace(/\//g, "-")}
      >
        <ChevronRightIcon expanded={isOpen} />
        <FolderIcon />
        <span className="ide-tree-name">{node.name}</span>
        {totalFiles > 0 && <span className="ide-tree-count">{totalFiles}</span>}
      </button>
      {isOpen && (
        <div>
          {node.children.map((c) => (
            <DirRow key={c.path} node={c} depth={depth + 1} expanded={expanded} onToggle={onToggle} activePath={activePath} dirtyPaths={dirtyPaths} onOpenFile={onOpenFile} />
          ))}
          {node.files.map((f) => (
            <button
              key={f.path}
              className={"ide-tree-row ide-tree-file" + (activePath === f.path ? " active" : "")}
              style={{ paddingLeft: 8 + (depth + 1) * 16 }}
              onClick={() => onOpenFile(f)}
              title={runTaskLabel(f.taskId, f.taskLabel, t)}
              data-od-id={"tree-file-" + f.path.replace(/\//g, "-")}
            >
              <FileIcon />
              <span className="ide-tree-name">{f.filename}</span>
              {dirtyPaths.has(f.path) && <span className="ide-dirty-dot" aria-label={t("ideToolbar.unsavedChanges")} />}
            </button>
          ))}
          {node.children.length === 0 && node.files.length === 0 && (
            <div className="ide-tree-empty" style={{ paddingLeft: 8 + (depth + 1) * 16 }}>{t("ideToolbar.emptyFolder")}</div>
          )}
        </div>
      )}
    </div>
  );
}
