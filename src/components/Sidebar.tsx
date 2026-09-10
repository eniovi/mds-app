"use client";

import { MDS_CATEGORIES } from "@/lib/mds-data";
import { useLanguage } from "@/lib/useLanguage";
import { categoryLabel, categoryHint } from "@/lib/task-catalog-i18n";
import type { CategoryId } from "@/lib/types";

interface SidebarProps {
  activeCategory: CategoryId | "all";
  setActiveCategory: (c: CategoryId | "all") => void;
  counts: Partial<Record<CategoryId, number>>;
  totalCount: number;
}

export function Sidebar({ activeCategory, setActiveCategory, counts, totalCount }: SidebarProps) {
  const { t } = useLanguage();
  return (
    <nav className="sidebar" data-od-id="category-sidebar">
      <button className={"cat-btn" + (activeCategory === "all" ? " active" : "")} onClick={() => setActiveCategory("all")} data-od-id="category-all">
        <div className="row"><span className="name">{t("sidebar.allTasks")}</span><span className="count">{totalCount}</span></div>
      </button>
      {MDS_CATEGORIES.map((c) => (
        <button key={c.id} className={"cat-btn" + (activeCategory === c.id ? " active" : "")} onClick={() => setActiveCategory(c.id)} data-od-id={"category-" + c.id}>
          <div className="row"><span className="name">{categoryLabel(c, t)}</span><span className="count">{counts[c.id] || 0}</span></div>
          <span className="hint">{categoryHint(c, t)}</span>
        </button>
      ))}
    </nav>
  );
}
