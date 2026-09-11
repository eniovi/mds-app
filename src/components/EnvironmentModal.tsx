"use client";

import { useState } from "react";
import { Trans } from "react-i18next";
import { InfoIcon } from "./icons/InfoIcon";
import { EyeIcon } from "./icons/EyeIcon";
import { ServerIcon } from "./icons/ServerIcon";
import { useLanguage } from "@/lib/useLanguage";
import { useDialogDismiss } from "@/lib/useDialogDismiss";
import type { DbType, Environment, EnvironmentKind, EnvironmentStatus } from "@/lib/types";

const MAXIMO_VERSION_OPTIONS = ["IBM Maximo 7.6", "IBM MAS"];

interface EnvironmentModalProps {
  clientId: string;
  /** present in edit mode; absent means "register a new environment" */
  environment?: Environment;
  onClose: () => void;
  onSubmit: (env: Environment) => void;
}

type TestState = "idle" | "testing" | EnvironmentStatus;

/** One modal for both halves of the environment CRUD — registering a new
 * connection and editing an existing one. Same form either way; only the
 * heading, the primary verb and whether the fields start populated differ,
 * which is cheaper to keep honest than two nearly-identical modals.
 *
 * Decision note (carried over from the original form): the brief asks for
 * database credentials on the same form whose own alert says credentials never
 * live here. Both are honoured literally — the fields exist, with a
 * show/hide toggle — but `dbUser`/`dbPassword` stay in this component's local
 * state and never reach the Environment object or storage. `appUser` is
 * different: it is the Maximo application user, not a secret, so it is part of
 * the model and survives an edit. */
export function EnvironmentModal({ clientId, environment, onClose, onSubmit }: EnvironmentModalProps) {
  const { t } = useLanguage();
  const isEdit = !!environment;

  const [name, setName] = useState(environment?.name ?? "");
  const [kind, setKind] = useState<EnvironmentKind>(environment?.kind ?? "DEV");
  const [host, setHost] = useState(environment?.host ?? "");
  const [port, setPort] = useState(String(environment?.port ?? 9081));
  const [appUser, setAppUser] = useState(environment?.appUser ?? "");
  const [dbUser, setDbUser] = useState("");
  const [dbPassword, setDbPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [maximoVersion, setMaximoVersion] = useState(environment?.maximoVersion ?? MAXIMO_VERSION_OPTIONS[0]);
  const [dbType, setDbType] = useState<DbType>(environment?.dbType ?? "DB2");
  const [testState, setTestState] = useState<TestState>("idle");

  const valid = name.trim().length > 2 && host.trim().length > 2 && /^\d+$/.test(port.trim());

  // Dirty = differs from what the dialog opened with (the environment being
  // edited, or the empty defaults). The credential fields count too: they
  // are never saved, but typing them is still work the user would lose.
  const dirty =
    name !== (environment?.name ?? "") ||
    kind !== (environment?.kind ?? "DEV") ||
    host !== (environment?.host ?? "") ||
    port !== String(environment?.port ?? 9081) ||
    appUser !== (environment?.appUser ?? "") ||
    dbUser !== "" ||
    dbPassword !== "" ||
    maximoVersion !== (environment?.maximoVersion ?? MAXIMO_VERSION_OPTIONS[0]) ||
    dbType !== (environment?.dbType ?? "DB2");
  useDialogDismiss(onClose, dirty);

  /** In-form connectivity check, so a connection can be proven before it is
   * saved rather than only from the table afterwards. Mocked like every other
   * round trip in this prototype. */
  function testConnection() {
    setTestState("testing");
    setTimeout(() => setTestState(host.trim().startsWith("mas-qa") ? "failed" : "connected"), 1100);
  }

  function submit() {
    onSubmit({
      id: environment?.id ?? "env-" + Date.now(),
      clientId,
      name: name.trim(),
      kind,
      host: host.trim(),
      port: Number(port) || 9081,
      maximoVersion,
      dbType,
      appUser: appUser.trim() || undefined,
      // a saved edit keeps whatever the row already proved, unless this form
      // just tested the connection itself
      status: testState === "connected" || testState === "failed" ? testState : environment?.status ?? "untested",
    });
  }

  return (
    <div className="modal-backdrop" data-od-id="environment-modal-backdrop">
      <div className="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="environment-modal-title" data-od-id="environment-modal">
        <div className="modal-head">
          <h3 id="environment-modal-title">{isEdit ? t("environmentModal.editTitle") : t("environmentModal.createTitle")}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label={t("common.close")} data-od-id="environment-modal-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div className="ds-alert" data-od-id="environment-security-alert">
          <InfoIcon size={15} />
          <p><Trans i18nKey="newEnvironmentModal.securityAlert" components={{ code: <code /> }} /></p>
        </div>

        <div className="ds-form-grid">
          <div className="field field-span-2">
            <label className="label" htmlFor="env-name">{t("newEnvironmentModal.nameLabel")} <span style={{ color: "var(--destructive)" }}>*</span></label>
            <input id="env-name" className="input" placeholder={t("newEnvironmentModal.namePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} data-od-id="environment-name-input" />
          </div>

          <div className="field">
            <label className="label" htmlFor="env-kind">{t("newEnvironmentModal.kindLabel")}</label>
            <select id="env-kind" className="select" value={kind} onChange={(e) => setKind(e.target.value as EnvironmentKind)} data-od-id="environment-kind-select">
              <option value="DEV">DEV</option>
              <option value="QA">QA</option>
              <option value="PROD">PROD</option>
              <option value="CUSTOM">{t("newEnvironmentModal.kindOther")}</option>
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor="env-host">{t("newEnvironmentModal.hostLabel")} <span style={{ color: "var(--destructive)" }}>*</span></label>
            <input id="env-host" className="input" placeholder={t("newEnvironmentModal.hostPlaceholder")} value={host} onChange={(e) => setHost(e.target.value)} data-od-id="environment-host-input" />
          </div>

          <div className="field">
            <label className="label" htmlFor="env-port">{t("newEnvironmentModal.portLabel")}</label>
            <input id="env-port" type="number" className="input" placeholder="9081" value={port} onChange={(e) => setPort(e.target.value)} data-od-id="environment-port-input" />
          </div>

          <div className="field">
            <label className="label" htmlFor="env-db">{t("newEnvironmentModal.dbLabel")}</label>
            <select id="env-db" className="select" value={dbType} onChange={(e) => setDbType(e.target.value as DbType)} data-od-id="environment-db-select">
              <option value="DB2">DB2</option>
              <option value="Oracle">Oracle</option>
              <option value="SQL Server">SQL Server</option>
            </select>
          </div>

          <div className="field field-span-2">
            <label className="label" htmlFor="env-app-user">{t("environmentModal.appUserLabel")}</label>
            <input id="env-app-user" className="input" placeholder={t("environmentModal.appUserPlaceholder")} value={appUser} onChange={(e) => setAppUser(e.target.value)} autoComplete="off" data-od-id="environment-app-user-input" />
            <span className="field-hint">{t("environmentModal.appUserHint")}</span>
          </div>

          <div className="field">
            <label className="label" htmlFor="env-db-user">{t("newEnvironmentModal.dbUserLabel")}</label>
            <input id="env-db-user" className="input" placeholder={t("newEnvironmentModal.dbUserPlaceholder")} value={dbUser} onChange={(e) => setDbUser(e.target.value)} autoComplete="off" data-od-id="environment-db-user-input" />
          </div>

          <div className="field">
            <label className="label" htmlFor="env-db-password">{t("newEnvironmentModal.dbPasswordLabel")}</label>
            <div className="ds-password-field">
              <input
                id="env-db-password"
                type={showPassword ? "text" : "password"}
                className="input"
                placeholder="••••••••"
                value={dbPassword}
                onChange={(e) => setDbPassword(e.target.value)}
                autoComplete="new-password"
                data-od-id="environment-db-password-input"
              />
              <button
                type="button"
                className="ds-password-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? t("newEnvironmentModal.hidePassword") : t("newEnvironmentModal.showPassword")}
                data-od-id="environment-toggle-password"
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          <div className="field field-span-2">
            <label className="label">{t("newEnvironmentModal.maximoVersionLabel")}</label>
            <div className="ds-radio-group" role="radiogroup" aria-label={t("newEnvironmentModal.maximoVersionLabel")} data-od-id="environment-maximo-version">
              {MAXIMO_VERSION_OPTIONS.map((option) => (
                <label className="ds-radio-option" key={option}>
                  <input
                    type="radio"
                    name="env-maximo-version"
                    className="ds-radio"
                    value={option}
                    checked={maximoVersion === option}
                    onChange={() => setMaximoVersion(option)}
                    data-od-id={"environment-version-" + option.replace(/\s+/g, "-").toLowerCase()}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-actions modal-actions-split">
          <div className="modal-test">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={testConnection}
              disabled={!valid || testState === "testing"}
              data-od-id="environment-test-button"
            >
              <ServerIcon size={14} />
              {testState === "testing" ? t("environments.testing") : t("environments.testConnection")}
            </button>
            {testState === "connected" && (
              <span className="badge badge-success" data-od-id="environment-test-result"><span className="badge-dot" />{t("environments.statusConnected")}</span>
            )}
            {testState === "failed" && (
              <span className="badge badge-error" data-od-id="environment-test-result"><span className="badge-dot" />{t("environments.statusFailed")}</span>
            )}
          </div>
          <div className="modal-actions-right">
            <button className="btn btn-secondary" onClick={onClose}>{t("common.cancel")}</button>
            <button className="btn btn-primary" disabled={!valid} onClick={submit} data-od-id="environment-submit-button">
              {isEdit ? t("common.save") : t("newEnvironmentModal.createButton")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
