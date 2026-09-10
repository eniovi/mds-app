"use client";

import Link from "next/link";
import { ContinuityMark } from "./icons/ContinuityMark";
import { BuildingIcon } from "./icons/BuildingIcon";
import { UserDropdownMenu } from "./UserDropdownMenu";
import { ContextSwitcher } from "./ContextSwitcher";
import { useWorkspace } from "@/lib/workspace-context";
import { useLanguage } from "@/lib/useLanguage";
import { ticketStatusMeta } from "@/lib/ticket-status";

interface AppHeaderProps {
  /** wire the task search box in; omit on screens that have nothing to search */
  search?: { query: string; setQuery: (q: string) => void };
  backLink?: { href: string; label: string };
}

/** The one header every post-selection screen renders. Besides the brand and
 * the user menu it carries the session's whole context — which client and
 * which ticket the work belongs to — as two switchers that change context in
 * place instead of navigating away. Before the hierarchy existed each page
 * hand-rolled its own <header className="topbar">; they all go through here
 * now so the context can never disagree between screens. */
export function AppHeader({ search, backLink }: AppHeaderProps) {
  const { t } = useLanguage();
  const { clients, activeClient, selectClient, tickets, activeTicket, selectTicket, environments } = useWorkspace();
  const activeEnv = activeTicket ? environments.find((e) => e.id === activeTicket.env) : undefined;

  return (
    <header className="topbar app-header" data-od-id="topbar">
      <div className="brand-mini"><ContinuityMark size={26} /><b>maxinst&nbsp;MDS</b></div>

      {backLink && (
        <Link className="back-link" href={backLink.href} data-od-id="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          {backLink.label}
        </Link>
      )}

      {search && (
        <div className="search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input
            data-od-id="task-search-input"
            placeholder={t("topbar.searchPlaceholder")}
            value={search.query}
            onChange={(e) => search.setQuery(e.target.value)}
          />
        </div>
      )}

      <div className="topbar-right">
        <ContextSwitcher
          odId="client-switcher"
          caption={t("context.client")}
          icon={<BuildingIcon size={15} />}
          value={activeClient ? activeClient.name : null}
          emptyLabel={t("context.noClient")}
          items={clients.map((c) => ({ id: c.id, primary: c.name, secondary: c.segment }))}
          activeId={activeClient ? activeClient.id : null}
          onSelect={selectClient}
          emptyListLabel={t("context.noClientsAvailable")}
          manageHref="/clients"
          manageLabel={t("context.seeAllClients")}
        />

        <ContextSwitcher
          odId="ticket-switcher"
          caption={t("context.ticket")}
          icon={<span aria-hidden="true">🎫</span>}
          value={activeTicket ? `${activeTicket.id} — ${activeTicket.title}` : null}
          emptyLabel={t("context.noTicket")}
          items={tickets.map((tk) => {
            const meta = ticketStatusMeta(tk.status, t);
            return { id: tk.id, primary: tk.id, secondary: tk.title, badge: meta };
          })}
          activeId={activeTicket ? activeTicket.id : null}
          onSelect={selectTicket}
          emptyListLabel={t("context.noTicketsForClient")}
          manageHref="/tickets"
          manageLabel={t("context.seeAllTickets")}
        />

        <Link className="ticket-chip header-files-link" href="/files" data-od-id="files-chip">
          📁&nbsp;{t("topbar.filesLink")}
        </Link>

        <div className="conn-chip" data-od-id="connection-status" title={activeEnv ? `${activeEnv.host}:${activeEnv.port}` : undefined}>
          <span className="pulse-dot" />
          {activeEnv ? `${activeEnv.name} ${t("topbar.connected")}` : activeTicket ? t("topbar.environmentNotFound") : t("topbar.loading")}
        </div>

        <UserDropdownMenu />
      </div>
    </header>
  );
}
