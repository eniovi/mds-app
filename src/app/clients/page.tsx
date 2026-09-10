"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ContinuityMark } from "@/components/icons/ContinuityMark";
import { UserDropdownMenu } from "@/components/UserDropdownMenu";
import { ChevronRightIcon } from "@/components/icons/ChevronRightIcon";
import { useWorkspace } from "@/lib/workspace-context";
import { useLanguage } from "@/lib/useLanguage";

/** First screen after the login: pick which client this session works on.
 * Everything downstream — tickets, environments, the activity rail — is scoped
 * to the choice made here, so it gets a screen of its own rather than a
 * dropdown buried in a header.
 *
 * Deliberately does not use AppShell: this screen sits *above* the hierarchy,
 * so it has no context to switch and no activity feed to show yet. */
export default function ClientsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { clients, clientStats, selectClient, activeClient } = useWorkspace();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q) || c.segment.toLowerCase().includes(q));
  }, [clients, query]);

  function choose(clientId: string) {
    selectClient(clientId);
    router.push("/tickets");
  }

  return (
    <div className="app-shell">
      <header className="topbar" data-od-id="topbar">
        <div className="brand-mini"><ContinuityMark size={26} /><b>maxinst&nbsp;MDS</b></div>
        <div className="topbar-right">
          <UserDropdownMenu />
        </div>
      </header>

      <main className="clients-main">
        <div className="page-head">
          <div>
            <h1 data-od-id="page-heading">{t("clients.heading")}</h1>
            <p>{t("clients.intro")}</p>
          </div>
        </div>

        <div className="toolbar">
          <input
            placeholder={t("clients.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t("clients.searchPlaceholder")}
            data-od-id="client-search-input"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="ds-empty-state" data-od-id="clients-empty">
            <p>{t("clients.noneFound")}</p>
            <span className="text-sm text-muted">{t("clients.noneFoundHint")}</span>
          </div>
        ) : (
          <div className="client-grid" data-od-id="client-grid">
            {filtered.map((client) => {
              const stats = clientStats[client.id] || { tickets: 0, environments: 0 };
              const isActive = activeClient?.id === client.id;
              return (
                <button
                  type="button"
                  key={client.id}
                  className={"card client-card" + (isActive ? " current" : "")}
                  onClick={() => choose(client.id)}
                  data-od-id={"client-card-" + client.id}
                >
                  <div className="client-card-top">
                    <span className="client-monogram" aria-hidden="true">{client.initials}</span>
                    {isActive && <span className="badge badge-info"><span className="badge-dot" />{t("clients.current")}</span>}
                  </div>
                  <div className="client-card-body">
                    <h3>{client.name}</h3>
                    <p className="text-sm text-muted">{client.segment}</p>
                  </div>
                  <dl className="client-card-stats">
                    <div>
                      <dt>{t("clients.statTickets")}</dt>
                      <dd>{stats.tickets}</dd>
                    </div>
                    <div>
                      <dt>{t("clients.statEnvironments")}</dt>
                      <dd>{stats.environments}</dd>
                    </div>
                  </dl>
                  <span className="client-card-cta">
                    {t("clients.enter")}
                    <ChevronRightIcon size={14} />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
