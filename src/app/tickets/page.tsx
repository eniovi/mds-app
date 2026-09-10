"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { NewTicketModal } from "@/components/NewTicketModal";
import { EnvironmentTagPopover } from "@/components/EnvironmentTagPopover";
import { environmentKindMeta } from "@/lib/environment-meta";
import { ticketStatusMeta } from "@/lib/ticket-status";
import { useWorkspace } from "@/lib/workspace-context";
import { useLanguage } from "@/lib/useLanguage";
import { LOCALE_BY_LANGUAGE } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import type { Ticket } from "@/lib/types";

export default function TicketsPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const {
    activeClient, tickets, activeTicket, selectTicket, createTicket,
    setTicketEnvironment, touchTicket, environments,
  } = useWorkspace();

  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  function handleCreate(ticket: Ticket) {
    createTicket(ticket);
    setShowNew(false);
  }

  function syncTicket(id: string) {
    setSyncing((s) => ({ ...s, [id]: true }));
    setTimeout(() => {
      setSyncing((s) => ({ ...s, [id]: false }));
      touchTicket(id);
    }, 1100);
  }

  /** Selecting a ticket is what opens the workspace — the brief's step 3. The
   * table row therefore commits the choice *and* moves on, instead of leaving
   * the user to find the way to the task panel afterwards. */
  function enterTicket(id: string) {
    selectTicket(id);
    router.push("/");
  }

  const filtered = tickets.filter((ticket) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      ticket.id.toLowerCase().includes(q) ||
      ticket.title.toLowerCase().includes(q) ||
      ticket.owner.name.toLowerCase().includes(q)
    );
  });

  return (
    <AppShell>
      <main className="tickets-main">
        <div className="page-head">
          <div>
            <span className="eyebrow" data-od-id="client-eyebrow">
              {activeClient ? activeClient.name : t("context.noClient")}
            </span>
            <h1 data-od-id="page-heading">{t("tickets.heading")}</h1>
            <p>{t("tickets.intro")}</p>
          </div>
          <div className="page-head-actions">
            <Link className="btn btn-secondary" href="/clients" data-od-id="switch-client-link">
              {t("tickets.switchClient")}
            </Link>
            <button className="btn btn-primary" onClick={() => setShowNew(true)} data-od-id="open-new-ticket-button">
              {t("tickets.newTicket")}
            </button>
          </div>
        </div>

        {activeTicket && (
          <div className="card active-ticket-panel" data-od-id="active-ticket-panel">
            <div className="active-ticket-panel-info">
              <span className="eyebrow">{t("tickets.activeTicket")}</span>
              <h3>{activeTicket.id} — {activeTicket.title}</h3>
            </div>
            <EnvironmentTagPopover
              environmentId={activeTicket.env}
              onChange={(envId) => setTicketEnvironment(activeTicket.id, envId)}
            />
          </div>
        )}

        <div className="toolbar">
          <input
            placeholder={t("tickets.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t("tickets.searchPlaceholder")}
            data-od-id="ticket-search-input"
          />
        </div>

        <div className="card" style={{ overflowX: "auto" }}>
          <table className="data-table data-table-wide" data-od-id="tickets-table">
            <thead>
              <tr>
                <th>{t("tickets.colTicket")}</th>
                <th>{t("tickets.colStatus")}</th>
                <th>{t("tickets.colOwner")}</th>
                <th>{t("tickets.colEnvironment")}</th>
                <th>{t("tickets.colCreated")}</th>
                <th>{t("tickets.colUpdated")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ticket) => {
                const meta = ticketStatusMeta(ticket.status, t);
                const isActive = activeTicket?.id === ticket.id;
                const ticketEnv = environments.find((e) => e.id === ticket.env);
                return (
                  <tr key={ticket.id} className={isActive ? "active-row" : ""} data-od-id={"ticket-row-" + ticket.id}>
                    <td>
                      <span className="ticket-id">{ticket.id}</span>
                      <span className="ticket-title">{ticket.title}</span>
                    </td>
                    <td><span className={"badge " + meta.cls}><span className="badge-dot" />{meta.label}</span></td>
                    <td>
                      <span className="owner-cell">
                        <span className="owner-avatar" aria-hidden="true">{ticket.owner.initials}</span>
                        <span className="owner-text">
                          <span className="owner-name">{ticket.owner.name}</span>
                          <span className="owner-role">{ticket.owner.role}</span>
                        </span>
                      </span>
                    </td>
                    <td>
                      {ticketEnv ? (
                        <span className="env-tag-readonly">
                          <span className="env-tag-name">{ticketEnv.name}</span>
                          <span className={"badge " + environmentKindMeta(ticketEnv.kind, t).cls}>
                            <span className="badge-dot" />
                            {environmentKindMeta(ticketEnv.kind, t).label}
                          </span>
                        </span>
                      ) : (
                        <span className="env-tag">{t("tickets.environmentRemoved")}</span>
                      )}
                    </td>
                    <td className="text-muted">{formatDate(ticket.createdAt, LOCALE_BY_LANGUAGE[language])}</td>
                    <td className="text-muted">{formatDate(ticket.updatedAt, LOCALE_BY_LANGUAGE[language])}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => syncTicket(ticket.id)}
                          disabled={!!syncing[ticket.id]}
                          data-od-id={"sync-ticket-" + ticket.id}
                        >
                          {syncing[ticket.id] ? t("tickets.syncing") : t("tickets.syncRemote")}
                        </button>
                        <button
                          className={"btn btn-sm " + (isActive ? "btn-primary" : "btn-secondary")}
                          onClick={() => enterTicket(ticket.id)}
                          data-od-id={"select-ticket-" + ticket.id}
                        >
                          {isActive ? t("tickets.openWorkspace") : t("tickets.select")}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-muted" style={{ textAlign: "center", padding: "var(--sp-32)" }}>
                    {t("tickets.noneFound")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {showNew && activeClient && (
        <NewTicketModal clientId={activeClient.id} onClose={() => setShowNew(false)} onCreate={handleCreate} />
      )}
    </AppShell>
  );
}
