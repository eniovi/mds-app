import { dirOf } from "./file-tree";
import type { TreeFileEntry } from "./file-tree";

export interface QueueGroup {
  dir: string;
  items: TreeFileEntry[];
  startIndex: number;
}

/** Groups are just consecutive same-directory runs of the flat queue order —
 * always derived, never stored, so moving an individual item can never leave
 * the grouping display out of sync with the real order. */
export function computeGroups(items: TreeFileEntry[]): QueueGroup[] {
  const groups: QueueGroup[] = [];
  items.forEach((item, i) => {
    const dir = dirOf(item.path);
    const last = groups[groups.length - 1];
    if (last && last.dir === dir) last.items.push(item);
    else groups.push({ dir, items: [item], startIndex: i });
  });
  return groups;
}

export function moveItem(items: TreeFileEntry[], index: number, direction: "up" | "down"): TreeFileEntry[] {
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** Moves an entire directory group as one contiguous block past its
 * neighboring group — the "reorder by whole directory" requirement. */
export function moveGroup(items: TreeFileEntry[], groupIndex: number, direction: "up" | "down"): TreeFileEntry[] {
  const groups = computeGroups(items);
  const swapWith = direction === "up" ? groupIndex - 1 : groupIndex + 1;
  if (swapWith < 0 || swapWith >= groups.length) return items;
  const reordered = [...groups];
  const [group] = reordered.splice(groupIndex, 1);
  reordered.splice(swapWith, 0, group);
  return reordered.flatMap((g) => g.items);
}

export function reorderByDrag(items: TreeFileEntry[], sourcePath: string, targetPath: string): TreeFileEntry[] {
  const sourceIdx = items.findIndex((i) => i.path === sourcePath);
  const targetIdx = items.findIndex((i) => i.path === targetPath);
  if (sourceIdx === -1 || targetIdx === -1 || sourceIdx === targetIdx) return items;
  const next = [...items];
  const [moved] = next.splice(sourceIdx, 1);
  next.splice(targetIdx, 0, moved);
  return next;
}
