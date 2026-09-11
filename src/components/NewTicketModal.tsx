"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CURRENT_PERSON } from "@/lib/mockData";
import { useEnvironments } from "@/lib/useEnvironments";
import { useLanguage } from "@/lib/useLanguage";
import { useDialogDismiss } from "@/lib/useDialogDismiss";
import type { Ticket } from "@/lib/types";

export function NewTicketModal({ clientId, onClose, onCreate }: { clientId: string; onClose: () => void; onCreate: (t: Ticket) => void }) {
  const { t } = useLanguage();
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [env, setEnv] = useState("");
  const environments = useEnvironments();
  const valid = id.trim().length > 2 && !!env;
  // anything typed = unsaved work: Escape stops closing, backdrop never did
  useDialogDismiss(onClose, id.trim().length > 0 || title.trim().length > 0);

  useEffect(() => {
    if (!env && environments.length > 0) setEnv(environments[0].id);
  }, [environments, env]);

  return (
    <div className="modal-backdrop" data-od-id="new-ticket-backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="new-ticket-title" data-od-id="new-ticket-modal">
        <div className="modal-head">
          <div>
            <h3 id="new-ticket-title">{t("newTicketModal.title")}</h3>
            <p className="text-sm text-muted">{t("newTicketModal.subtitle")}</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label={t("common.close")} data-od-id="new-ticket-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="field">
          <label className="label" htmlFor="new-ticket-id">{t("newTicketModal.idLabel")} <span style={{ color: "var(--destructive)" }}>*</span></label>
          <input id="new-ticket-id" className="input" placeholder={t("newTicketModal.idPlaceholder")} value={id} onChange={(e) => setId(e.target.value)} data-od-id="new-ticket-id-input" />
        </div>
        <div className="field">
          <label className="label" htmlFor="new-ticket-title">{t("newTicketModal.descriptionLabel")}</label>
          <input id="new-ticket-title" className="input" placeholder={t("newTicketModal.descriptionPlaceholder")} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label className="label" htmlFor="new-ticket-env">{t("newTicketModal.environmentLabel")}</label>
          {environments.length > 0 ? (
            <select id="new-ticket-env" className="select" value={env} onChange={(e) => setEnv(e.target.value)} data-od-id="new-ticket-env-select">
              {environments.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          ) : (
            <p className="field-hint">{t("environments.noneFound")}</p>
          )}
          <Link href="/environments" className="text-sm" style={{ width: "fit-content" }}>{t("newTicketModal.addEnvironmentLink")}</Link>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>{t("common.cancel")}</button>
          <button
            className="btn btn-primary"
            disabled={!valid}
            onClick={() =>
              onCreate({
                id: id.trim(),
                clientId,
                title: title.trim() || t("newTicketModal.noDescription"),
                env,
                status: "open",
                owner: CURRENT_PERSON,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
            }
            data-od-id="create-ticket-button"
          >
            {t("newTicketModal.createButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
