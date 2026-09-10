"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { EnvironmentModal } from "@/components/EnvironmentModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { PencilIcon } from "@/components/icons/PencilIcon";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { environmentKindMeta } from "@/lib/environment-meta";
import { useWorkspace } from "@/lib/workspace-context";
import { useLanguage } from "@/lib/useLanguage";
import type { Environment, EnvironmentStatus } from "@/lib/types";

type TFunc = (key: string, options?: Record<string, unknown>) => string;

function statusMeta(status: EnvironmentStatus, t: TFunc): { label: string; cls: string } {
  if (status === "connected") return { label: t("environments.statusConnected"), cls: "badge-success" };
  if (status === "failed") return { label: t("environments.statusFailed"), cls: "badge-error" };
  return { label: t("environments.statusUntested"), cls: "badge-neutral" };
}

export default function EnvironmentsPage() {
  const { t } = useLanguage();
  const {
    activeClient, environments, createEnvironment, updateEnvironment,
    removeEnvironment, setEnvironmentStatus,
  } = useWorkspace();

  const [formFor, setFormFor] = useState<Environment | "new" | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Environment | null>(null);
  const [testing, setTesting] = useState<Record<string, boolean>>({});

  function testConnection(id: string) {
    setTesting((s) => ({ ...s, [id]: true }));
    setTimeout(() => {
      setTesting((s) => ({ ...s, [id]: false }));
      setEnvironmentStatus(id, "connected");
    }, 1100);
  }

  function submitEnvironment(env: Environment) {
    if (formFor === "new") createEnvironment(env);
    else updateEnvironment(env);
    setFormFor(null);
  }

  return (
    <AppShell backLink={{ href: "/", label: t("environments.backToPanel") }}>
      <main className="tickets-main">
        <div className="page-head">
          <div>
            <span className="eyebrow" data-od-id="client-eyebrow">
              {activeClient ? activeClient.name : t("context.noClient")}
            </span>
            <h1 data-od-id="page-heading">{t("environments.heading")}</h1>
            <p>{t("environments.intro")}</p>
          </div>
          <button className="btn btn-primary" onClick={() => setFormFor("new")} data-od-id="open-new-environment-button">
            {t("environments.newEnvironment")}
          </button>
        </div>

        <div className="card" style={{ overflowX: "auto", marginTop: "var(--sp-24)" }}>
          <table className="data-table data-table-wide" data-od-id="environments-table">
            <thead>
              <tr>
                <th>{t("environments.colName")}</th>
                <th>{t("environments.colType")}</th>
                <th>{t("environments.colConnection")}</th>
                <th>{t("environments.colVersion")}</th>
                <th>{t("environments.colDatabase")}</th>
                <th>{t("environments.colStatus")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {environments.map((env) => {
                const km = environmentKindMeta(env.kind, t);
                const sm = statusMeta(env.status, t);
                return (
                  <tr key={env.id} data-od-id={"environment-row-" + env.id}>
                    <td className="ticket-title">{env.name}</td>
                    <td><span className={"badge " + km.cls}><span className="badge-dot" />{km.label}</span></td>
                    <td className="text-muted">{env.host}:{env.port}</td>
                    <td className="text-muted">{env.maximoVersion}</td>
                    <td className="text-muted">{env.dbType}</td>
                    <td><span className={"badge " + sm.cls}><span className="badge-dot" />{sm.label}</span></td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => testConnection(env.id)}
                          disabled={!!testing[env.id]}
                          data-od-id={"test-environment-" + env.id}
                        >
                          {testing[env.id] ? t("environments.testing") : t("environments.testConnection")}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => setFormFor(env)}
                          aria-label={t("environments.editAria", { name: env.name })}
                          title={t("common.edit")}
                          data-od-id={"edit-environment-" + env.id}
                        >
                          <PencilIcon size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm btn-icon btn-icon-danger"
                          onClick={() => setConfirmRemove(env)}
                          aria-label={t("environments.removeAria", { name: env.name })}
                          title={t("common.remove")}
                          data-od-id={"remove-environment-" + env.id}
                        >
                          <TrashIcon size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {environments.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-muted" style={{ textAlign: "center", padding: "var(--sp-32)" }}>
                    {t("environments.noneFound")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {formFor && activeClient && (
        <EnvironmentModal
          clientId={activeClient.id}
          environment={formFor === "new" ? undefined : formFor}
          onClose={() => setFormFor(null)}
          onSubmit={submitEnvironment}
        />
      )}

      {confirmRemove && (
        <ConfirmModal
          odId="remove-environment-confirm"
          title={t("environments.confirmRemoveTitle")}
          message={t("environments.confirmRemoveMessage", { name: confirmRemove.name })}
          confirmLabel={t("common.remove")}
          onCancel={() => setConfirmRemove(null)}
          onConfirm={() => {
            removeEnvironment(confirmRemove.id);
            setConfirmRemove(null);
          }}
        />
      )}
    </AppShell>
  );
}
