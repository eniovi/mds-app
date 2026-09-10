export interface TreeFileEntry {
  path: string;
  filename: string;
  taskId: string;
  taskLabel: string;
  startedAt: string;
}

export function dirOf(path: string): string {
  const idx = path.lastIndexOf("/");
  return idx === -1 ? "" : path.slice(0, idx);
}

export interface TreeDirNode {
  name: string;
  path: string;
  children: TreeDirNode[];
  files: TreeFileEntry[];
}

/** Builds a nested tree from the flat MDS_EXPECTED_DIRECTORIES list (some
 * entries are already nested paths, e.g. "presentations/original") plus the
 * generated files grouped by their exact directory. */
export function buildFileTree(dirs: string[], filesByDir: Map<string, TreeFileEntry[]>): TreeDirNode[] {
  const root: TreeDirNode[] = [];

  function insert(parts: string[]): TreeDirNode {
    let level = root;
    let currentPath = "";
    let node: TreeDirNode | undefined;
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      node = level.find((n) => n.name === part);
      if (!node) {
        node = { name: part, path: currentPath, children: [], files: [] };
        level.push(node);
      }
      level = node.children;
    }
    return node as TreeDirNode;
  }

  dirs.forEach((dir) => {
    const node = insert(dir.split("/"));
    node.files = (filesByDir.get(dir) || [])
      .slice()
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  });

  return root;
}

/** Every directory path that (directly or via a descendant) contains at
 * least one file — used to auto-expand the tree to where the content is. */
export function pathsWithFiles(nodes: TreeDirNode[]): Set<string> {
  const result = new Set<string>();
  function walk(node: TreeDirNode): boolean {
    const childHasFiles = node.children.map(walk).some(Boolean);
    const hasFiles = node.files.length > 0 || childHasFiles;
    if (hasFiles) result.add(node.path);
    return hasFiles;
  }
  nodes.forEach(walk);
  return result;
}
