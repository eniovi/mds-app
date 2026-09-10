"use client";

import { useEffect, useState } from "react";
import { PanelToggleIcon } from "./icons/PanelToggleIcon";
import { useActivityFeed } from "@/lib/activity";
import { useLanguage } from "@/lib/useLanguage";
import { LOCALE_BY_LANGUAGE } from "@/lib/i18n";
import { readString, writeString } from "@/lib/storage";
import { formatDateTime, timeAgo } from "@/lib/format";
import { runTaskLabel } from "@/lib/task-catalog-i18n";
import type { ActivityEvent, RunStatus } from "@/lib/types";

const RAIL_STORAGE_KEY = "mds_activity_rail";

/** Status marker on the timeline. Deliberately a dot on a rule rather than a
 * .badge: a badge per row would put nine saturated chips down the rail and
 * fight the page for attention. Colours stay on the semantic status tokens. */
function statusDotClass(status: RunStatus): string {
  if (status === "error") return "act-dot-error";
  if (status === "running" || status === "queued") return "act-dot-running";
  return "act-dot-success";
}

function ActivityRow({ event }: { event: ActivityEvent }) {
  const { t, language } = useLanguage();
  const action = event.taskId ? runTaskLabel(event.taskId, event.action, t) : event.action;

  return (
    <li className="act-row" data-od-id={"activity-" + event.id}>
      <span className={"act-dot " + statusDotClass(event.status)} aria-hidden="true" />
      <div className="act-body">
        <p className="act-action">{action}</p>
        <p className="act-target" title={event.target}>{event.target}</p>
        <p className="act-meta">
          <span className="act-ticket">{event.ticket}</span>
          <span aria-hidden="true">·</span>
          <span>{event.user}</span>
        </p>
      </div>
      <time className="act-when" dateTime={event.at} title={formatDateTime(event.at, LOCALE_BY_LANGUAGE[language])}>
        {timeAgo(event.at, t)}
      </time>
    </li>
  );
}

/** Recent activity, promoted out of the footer of the task panel into a
 * persistent right rail directly under the header — it is the one thing a
 * consultant checks between actions, and at the bottom of a 36-card grid it
 * was effectively invisible. Collapsible because the task panel already owns
 * a category sidebar; collapsed state is per-viewer and survives navigation
 * (localStorage, read in an effect so SSR and first paint agree). */
export function RecentActivityRail() {
  const { t } = useLanguage();
  const events = useActivityFeed();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(readString(RAIL_STORAGE_KEY) === "collapsed");
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      writeString(RAIL_STORAGE_KEY, next ? "collapsed" : "expanded");
      return next;
    });
  }

  if (collapsed) {
    return (
      <aside className="activity-rail collapsed" data-od-id="activity-rail">
        <button
          type="button"
          className="act-toggle"
          onClick={toggle}
          aria-expanded={false}
          aria-label={t("activity.expand")}
          title={t("activity.expand")}
          data-od-id="activity-rail-toggle"
        >
          <PanelToggleIcon collapsed />
        </button>
        <span className="act-rail-spine" aria-hidden="true">
          {t("activity.heading")}
          {events.length > 0 && <b className="act-spine-count">{events.length}</b>}
        </span>
      </aside>
    );
  }

  return (
    <aside className="activity-rail" aria-label={t("activity.heading")} data-od-id="activity-rail">
      <div className="act-head">
        <h2 className="act-title">
          {t("activity.heading")}
          {events.length > 0 && <span className="act-count">{events.length}</span>}
        </h2>
        <button
          type="button"
          className="act-toggle"
          onClick={toggle}
          aria-expanded
          aria-label={t("activity.collapse")}
          title={t("activity.collapse")}
          data-od-id="activity-rail-toggle"
        >
          <PanelToggleIcon collapsed={false} />
        </button>
      </div>

      {events.length === 0 ? (
        <div className="ds-empty-state act-empty" data-od-id="activity-empty">
          <p>{t("activity.emptyTitle")}</p>
          <span className="text-sm text-muted">{t("activity.emptyDesc")}</span>
        </div>
      ) : (
        <ol className="act-list scrollbar-thin" data-od-id="activity-list">
          {events.map((event) => <ActivityRow key={event.id} event={event} />)}
        </ol>
      )}
    </aside>
  );
}
