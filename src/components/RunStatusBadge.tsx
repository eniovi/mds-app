"use client";

import { useLanguage } from "@/lib/useLanguage";
import type { RunStatus } from "@/lib/types";

export function RunStatusBadge({ status }: { status: RunStatus }) {
  const { t } = useLanguage();
  if (status === "success") return <span className="badge badge-success"><span className="badge-dot" />{t("status.success")}</span>;
  if (status === "running") return <span className="badge badge-warning"><span className="badge-dot" />{t("status.running")}</span>;
  if (status === "error") return <span className="badge badge-error"><span className="badge-dot" />{t("status.error")}</span>;
  return <span className="badge badge-neutral"><span className="badge-dot" />{t("status.queued")}</span>;
}
