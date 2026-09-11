"use client";

import { useEffect, useRef, useState } from "react";
import { FolderIcon } from "../icons/FolderIcon";
import { FileIcon } from "../icons/FileIcon";
import { ChevronRightIcon } from "../icons/ChevronRightIcon";
import { TrashIcon } from "../icons/TrashIcon";
import { useLanguage } from "@/lib/useLanguage";
import { runTaskLabel } from "@/lib/task-catalog-i18n";
import { validateFileName } from "@/lib/useWorkspaceFiles";
import { dirOf } from "@/lib/file-tree";
import type { FileNameError } from "@/lib/useWorkspaceFiles";
import type { TreeDirNode, TreeFileEntry } from "@/lib/file-tree";

interface FileTreeProps {
  nodes: TreeDirNode[];
  activePath: string | null;
  dirtyPaths: Set<string>;
  defaultExpanded: Set<string>;
  /** every path currently in the workspace — for the "already exists" check */
  fileMeta: Map<string, TreeFileEntry>;
  /** flat list of directory paths the new-file row can target */
  allDirs: string[];
  onOpenFile: (file: TreeFileEntry) => void;
  onCreateFile: (path: string) => void;
  onRequestDelete: (file: TreeFileEntry) => void;
}

interface ContextMenuState {
  file: TreeFileEntry;
  x: number;
  y: number;
}

const ERROR_KEY: Record<FileNameError, string> = {
  empty: "fileTree.errorEmpty",
  invalidChars: "fileTree.errorInvalidChars",
  noExtension: "fileTree.errorNoExtension",
  unsupportedExtension: "fileTree.errorUnsupportedExtension",
  exists: "fileTree.errorExists",
};

/** Left pane of the IDE. Besides browsing, it now owns the two file-system
 * operations the brief asks for: creating a file (toolbar button → inline row
 * with a folder picker and a name input, validated before anything is
 * written) and deleting one (trash icon on the row, or the row's context
 * menu). Deletion only *requests* — the page confirms with the destructive
 * dialog and does the actual removal, because it also has to close the tab
 * and drop the saved buffer. */
export function FileTree({
  nodes, activePath, dirtyPaths, defaultExpanded, fileMeta, allDirs,
  onOpenFile, onCreateFile, onRequestDelete,
}: FileTreeProps) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState<Set<string>>(defaultExpanded);
  const [creating, setCreating] = useState(false);
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  function toggle(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function handleCreate(path: string) {
    onCreateFile(path);
    // reveal the new file: expand its folder and every ancestor
    setExpanded((prev) => {
      const next = new Set(prev);
      const parts = dirOf(path).split("/");
      parts.forEach((_, i) => next.add(parts.slice(0, i + 1).join("/")));
      return next;
    });
    setCreating(false);
  }

  // the context menu closes on any click elsewhere, Escape, or scroll
  useEffect(() => {
    if (!menu) return;
    function close() { setMenu(null); }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setMenu(null); }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    document.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("scroll", close, true);
    };
  }, [menu]);

  return (
    <div className="ide-tree-pane" data-od-id="file-tree-pane">
      <div className="ide-tree-toolbar">
        <span className="ide-tree-toolbar-title">{t("fileTree.title")}</span>
        <button
          type="button"
          className="ide-tree-new"
          onClick={() => setCreating((c) => !c)}
          aria-expanded={creating}
          data-od-id="file-tree-new-file"
        >
          + {t("fileTree.newFile")}
        </button>
      </div>

      <div className="ide-tree scrollbar-thin" data-od-id="file-tree">
        {creating && (
          <NewFileRow
            dirs={allDirs}
            defaultDir={activePath ? dirOf(activePath) : allDirs[0] || ""}
            fileMeta={fileMeta}
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
          />
        )}
        {nodes.map((n) => (
          <DirRow
            key={n.path}
            node={n}
            depth={0}
            expanded={expanded}
            onToggle={toggle}
            activePath={activePath}
            dirtyPaths={dirtyPaths}
            onOpenFile={onOpenFile}
            onRequestDelete={onRequestDelete}
            onContextMenu={(file, e) => {
              e.preventDefault();
              setMenu({ file, x: e.clientX, y: e.clientY });
            }}
          />
        ))}
      </div>

      {menu && (
        <div
          className="ide-context-menu"
          role="menu"
          style={{ left: menu.x, top: menu.y }}
          onMouseDown={(e) => e.stopPropagation()}
          data-od-id="file-context-menu"
        >
          <div className="ide-context-menu-title">{menu.file.filename}</div>
          <button
            type="button"
            role="menuitem"
            className="ide-context-menu-item destructive"
            onClick={() => {
              onRequestDelete(menu.file);
              setMenu(null);
            }}
            data-od-id="file-context-delete"
          >
            <TrashIcon size={14} /> {t("fileTree.deleteFile")}
          </button>
        </div>
      )}
    </div>
  );
}

/** Inline creation row: folder picker + name input, validated as you type,
 * Enter to create and Escape to abandon. Lives at the top of the tree rather
 * than inside a folder so it is reachable no matter what is expanded. */
function NewFileRow({
  dirs, defaultDir, fileMeta, onSubmit, onCancel,
}: {
  dirs: string[];
  defaultDir: string;
  fileMeta: Map<string, TreeFileEntry>;
  onSubmit: (path: string) => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const [dir, setDir] = useState(dirs.includes(defaultDir) ? defaultDir : dirs[0] || "");
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const error = validateFileName(name, dir, fileMeta);
  const showError = touched && error;

  function submit() {
    setTouched(true);
    if (error) return;
    onSubmit(dir ? `${dir}/${name.trim()}` : name.trim());
  }

  return (
    <div className="ide-new-file" data-od-id="file-tree-new-row">
      <div className="ide-new-file-fields">
        <select
          className="ide-new-file-dir"
          value={dir}
          onChange={(e) => setDir(e.target.value)}
          aria-label={t("fileTree.folderAria")}
          data-od-id="file-tree-new-dir"
        >
          {dirs.map((d) => <option key={d} value={d}>{d}/</option>)}
        </select>
        <input
          ref={inputRef}
          className={"ide-new-file-name" + (showError ? " invalid" : "")}
          placeholder={t("fileTree.namePlaceholder")}
          value={name}
          onChange={(e) => { setName(e.target.value); setTouched(true); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") onCancel();
          }}
          aria-label={t("fileTree.nameAria")}
          aria-invalid={!!showError}
          data-od-id="file-tree-new-name"
        />
      </div>
      {showError && <span className="ide-new-file-error" role="alert">{t(ERROR_KEY[error])}</span>}
      <div className="ide-new-file-actions">
        <button type="button" className="ide-toolbar-btn" onClick={onCancel} data-od-id="file-tree-new-cancel">{t("common.cancel")}</button>
        <button type="button" className="ide-toolbar-btn primary" onClick={submit} disabled={!!error} data-od-id="file-tree-new-create">{t("fileTree.create")}</button>
      </div>
    </div>
  );
}

function DirRow({
  node, depth, expanded, onToggle, activePath, dirtyPaths, onOpenFile, onRequestDelete, onContextMenu,
}: {
  node: TreeDirNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  activePath: string | null;
  dirtyPaths: Set<string>;
  onOpenFile: (file: TreeFileEntry) => void;
  onRequestDelete: (file: TreeFileEntry) => void;
  onContextMenu: (file: TreeFileEntry, e: React.MouseEvent) => void;
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
            <DirRow
              key={c.path}
              node={c}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              activePath={activePath}
              dirtyPaths={dirtyPaths}
              onOpenFile={onOpenFile}
              onRequestDelete={onRequestDelete}
              onContextMenu={onContextMenu}
            />
          ))}
          {node.files.map((f) => (
            <div
              key={f.path}
              className={"ide-tree-row ide-tree-file" + (activePath === f.path ? " active" : "")}
              style={{ paddingLeft: 8 + (depth + 1) * 16 }}
              onContextMenu={(e) => onContextMenu(f, e)}
              data-od-id={"tree-file-" + f.path.replace(/\//g, "-")}
            >
              <button
                type="button"
                className="ide-tree-file-open"
                onClick={() => onOpenFile(f)}
                title={f.origin === "manual" ? t("fileTree.manualFile") : runTaskLabel(f.taskId, f.taskLabel, t)}
              >
                <FileIcon />
                <span className="ide-tree-name">{f.filename}</span>
                {dirtyPaths.has(f.path) && <span className="ide-dirty-dot" aria-label={t("ideToolbar.unsavedChanges")} />}
              </button>
              <button
                type="button"
                className="ide-tree-delete"
                onClick={(e) => { e.stopPropagation(); onRequestDelete(f); }}
                aria-label={t("fileTree.deleteAria", { name: f.filename })}
                title={t("fileTree.deleteFile")}
                data-od-id={"tree-file-delete-" + f.path.replace(/\//g, "-")}
              >
                <TrashIcon size={13} />
              </button>
            </div>
          ))}
          {node.children.length === 0 && node.files.length === 0 && (
            <div className="ide-tree-empty" style={{ paddingLeft: 8 + (depth + 1) * 16 }}>{t("ideToolbar.emptyFolder")}</div>
          )}
        </div>
      )}
    </div>
  );
}
