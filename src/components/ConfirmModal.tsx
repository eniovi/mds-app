"use client";

import { useLanguage } from "@/lib/useLanguage";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  odId: string;
}

/** Destructive confirmation, replacing window.confirm — a native dialog can't
 * carry the brand, can't say what exactly is about to be lost, and gives the
 * destructive action the same weight as the safe one. The confirm button uses
 * --destructive; Cancel stays the neutral secondary and is what Escape and a
 * backdrop click resolve to. */
export function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel, odId }: ConfirmModalProps) {
  const { t } = useLanguage();

  return (
    <div className="modal-backdrop" onClick={onCancel} data-od-id={odId + "-backdrop"}>
      <div className="modal modal-narrow" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()} data-od-id={odId}>
        <div>
          <h3>{title}</h3>
          <p className="text-sm text-muted">{message}</p>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel} data-od-id={odId + "-cancel"}>{t("common.cancel")}</button>
          <button className="btn btn-destructive" onClick={onConfirm} data-od-id={odId + "-confirm"}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
