import { CatIcon } from "./icons/CatIcon";
import { MDS_CATEGORIES } from "@/lib/mds-data";
import { useLanguage } from "@/lib/useLanguage";
import { categoryLabel, taskLabel, taskDetail } from "@/lib/task-catalog-i18n";
import type { Task } from "@/lib/types";

export function TaskCard({ task, onOpen }: { task: Task; onOpen: (task: Task) => void }) {
  const { t } = useLanguage();
  const cat = MDS_CATEGORIES.find((c) => c.id === task.category);
  return (
    <button className="card task-card" onClick={() => onOpen(task)} data-od-id={"task-card-" + task.id}>
      <div className="top-row">
        <CatIcon id={task.category} />
        {task.beta && <span className="badge badge-warning"><span className="badge-dot" />BETA</span>}
      </div>
      <div>
        <span className="cat-tag">{cat ? categoryLabel(cat, t) : task.category}</span>
        <h4>{taskLabel(task, t)}</h4>
      </div>
      <p className="detail">{taskDetail(task, t)}</p>
    </button>
  );
}
