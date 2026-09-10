"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Sidebar } from "@/components/Sidebar";
import { TaskCard } from "@/components/TaskCard";
import { TaskDrawer } from "@/components/TaskDrawer";
import { MDS_CATEGORIES, MDS_TASKS } from "@/lib/mds-data";
import { useActiveTicket } from "@/lib/useActiveTicket";
import { useRunHistory } from "@/lib/useRunHistory";
import { useLanguage } from "@/lib/useLanguage";
import { categoryLabel, taskLabel, taskDetail } from "@/lib/task-catalog-i18n";
import type { CategoryId, Task } from "@/lib/types";

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<CategoryId | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { pushRun } = useRunHistory();
  const activeTicket = useActiveTicket();
  const { t } = useLanguage();

  const counts = useMemo(() => {
    const c: Partial<Record<CategoryId, number>> = {};
    MDS_TASKS.forEach((t) => { c[t.category] = (c[t.category] || 0) + 1; });
    return c;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) return MDS_TASKS.filter((tk) => taskLabel(tk, t).toLowerCase().includes(q) || taskDetail(tk, t).toLowerCase().includes(q));
    if (activeCategory === "all") return MDS_TASKS;
    return MDS_TASKS.filter((tk) => tk.category === activeCategory);
  }, [activeCategory, query, t]);

  const activeCategoryMeta = MDS_CATEGORIES.find((c) => c.id === activeCategory);
  const headTitle = query.trim()
    ? t("home.searchResults", { query: query.trim() })
    : activeCategory === "all"
    ? t("sidebar.allTasks")
    : activeCategoryMeta
    ? categoryLabel(activeCategoryMeta, t)
    : "";

  return (
    <AppShell search={{ query, setQuery }}>
      <div className="body-grid">
        <Sidebar
          activeCategory={activeCategory}
          setActiveCategory={(c) => { setActiveCategory(c); setQuery(""); }}
          counts={counts}
          totalCount={MDS_TASKS.length}
        />
        <main className="main">
          <div className="main-head">
            <div>
              <h2 data-od-id="main-heading">{headTitle}</h2>
              <p>{t("home.tasksAvailable", { count: filtered.length })}</p>
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="task-grid" data-od-id="task-grid">
              {filtered.map((task) => <TaskCard key={task.id} task={task} onOpen={setSelectedTask} />)}
            </div>
          ) : (
            <div className="empty-state">{t("home.noTasksFound")}</div>
          )}
        </main>
      </div>

      {selectedTask && (
        <TaskDrawer task={selectedTask} onClose={() => setSelectedTask(null)} activeTicket={activeTicket} pushRun={pushRun} />
      )}
    </AppShell>
  );
}
