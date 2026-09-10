"use client";

import { PlayIcon } from "./icons/PlayIcon";
import { CheckCircleIcon } from "./icons/CheckCircleIcon";
import { extOf } from "@/lib/file-content";
import { useLanguage } from "@/lib/useLanguage";

interface BatchActionBarProps {
  selectedPaths: string[];
  onValidate: () => void;
  onRun: () => void;
}

/** Docked above the file table the instant 1+ rows are selected — only
 * .dbc files count toward "Validar" (Maximo doesn't validate raw .sql the
 * way it validates a .dbc package), while both .dbc and .sql count toward
 * "Executar", mirroring the same extension rules already used by the IDE's
 * Action Toolbar and the validate-dbc-file/run-script-file task fields. */
export function BatchActionBar({ selectedPaths, onValidate, onRun }: BatchActionBarProps) {
  const { t } = useLanguage();
  if (selectedPaths.length === 0) return null;

  const validateCount = selectedPaths.filter((p) => extOf(p) === "dbc").length;
  const runCount = selectedPaths.length;

  return (
    <div className="batch-action-bar" data-od-id="batch-action-bar">
      <span className="batch-action-bar-count">
        {t("runQueue.selected", { count: selectedPaths.length })}
      </span>
      <div className="batch-action-bar-actions">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={validateCount === 0}
          onClick={onValidate}
          title={validateCount === 0 ? t("batch.validateHint") : undefined}
          data-od-id="batch-action-validate"
        >
          <CheckCircleIcon size={14} /> {t("batch.validateSelected", { count: validateCount })}
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={runCount === 0}
          onClick={onRun}
          data-od-id="batch-action-run"
        >
          <PlayIcon size={14} /> {t("batch.executeSelected", { count: runCount })}
        </button>
      </div>
    </div>
  );
}
