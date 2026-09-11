"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { MDS_CLIENTS, MDS_ENVIRONMENTS, MDS_TICKETS } from "./mockData";
import { readJSON, readString, writeJSON, writeString } from "./storage";
import { logActivity } from "./activity-log";
import type { Client, Environment, EnvironmentStatus, Ticket } from "./types";

export const CLIENTS_STORAGE_KEY = "mds_clients";
export const ENVIRONMENTS_STORAGE_KEY = "mds_environments";
export const TICKETS_STORAGE_KEY = "mds_tickets";
export const ACTIVE_CLIENT_STORAGE_KEY = "mds_active_client";
export const ACTIVE_TICKET_STORAGE_KEY = "mds_active_ticket";

interface WorkspaceContextValue {
  hydrated: boolean;
  clients: Client[];
  /** per-client totals for the client-selection cards, so that screen can show
   * how much work sits behind each card without being handed every client's
   * tickets and environments */
  clientStats: Record<string, { tickets: number; environments: number }>;

  activeClient: Client | null;
  selectClient: (clientId: string) => void;

  /** environments of the active client only — the /environments module never
   * sees another client's connections */
  environments: Environment[];
  createEnvironment: (env: Environment) => void;
  updateEnvironment: (env: Environment) => void;
  removeEnvironment: (envId: string) => void;
  setEnvironmentStatus: (envId: string, status: EnvironmentStatus) => void;

  /** tickets of the active client only */
  tickets: Ticket[];
  activeTicket: Ticket | null;
  selectTicket: (ticketId: string) => void;
  createTicket: (ticket: Ticket) => void;
  setTicketEnvironment: (ticketId: string, envId: string) => void;
  touchTicket: (ticketId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

/** Owns the Cliente → Ticket → Ambiente hierarchy for the whole app (mounted
 * once in the root layout, inside SessionProvider). Everything below the login
 * is scoped through here: pick a client and the ticket list, the environment
 * module and the activity rail all narrow to it at once, which is the whole
 * point of the hierarchy — no screen has to re-derive "which client am I on".
 *
 * SSR rule, same as every other localStorage-backed value in this app: render
 * the seeds on the server and on the first client render, then hydrate in an
 * effect. Never read localStorage in a render-time initializer or server and
 * client output won't match. */
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [clients, setClients] = useState<Client[]>(MDS_CLIENTS);
  const [allEnvironments, setAllEnvironments] = useState<Environment[]>(MDS_ENVIRONMENTS);
  const [allTickets, setAllTickets] = useState<Ticket[]>(MDS_TICKETS);
  const [activeClientId, setActiveClientId] = useState("");
  const [activeTicketId, setActiveTicketId] = useState("");

  // Latest environments for the callbacks below, so they can look an entry up
  // *outside* a setState updater (updaters are re-run by strict mode and must
  // stay pure — logging inside one would double-post the event in dev).
  const envsRef = useRef(allEnvironments);
  useEffect(() => { envsRef.current = allEnvironments; }, [allEnvironments]);

  useEffect(() => {
    setClients(readJSON<Client[]>(CLIENTS_STORAGE_KEY, MDS_CLIENTS));
    setAllEnvironments(readJSON<Environment[]>(ENVIRONMENTS_STORAGE_KEY, MDS_ENVIRONMENTS));
    setAllTickets(readJSON<Ticket[]>(TICKETS_STORAGE_KEY, MDS_TICKETS));
    setActiveClientId(readString(ACTIVE_CLIENT_STORAGE_KEY) || "");
    setActiveTicketId(readString(ACTIVE_TICKET_STORAGE_KEY) || "");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeJSON(ENVIRONMENTS_STORAGE_KEY, allEnvironments);
  }, [allEnvironments, hydrated]);

  useEffect(() => {
    if (hydrated) writeJSON(TICKETS_STORAGE_KEY, allTickets);
  }, [allTickets, hydrated]);

  useEffect(() => {
    if (hydrated) writeString(ACTIVE_CLIENT_STORAGE_KEY, activeClientId);
  }, [activeClientId, hydrated]);

  useEffect(() => {
    if (hydrated) writeString(ACTIVE_TICKET_STORAGE_KEY, activeTicketId);
  }, [activeTicketId, hydrated]);

  const clientStats = useMemo(() => {
    const stats: Record<string, { tickets: number; environments: number }> = {};
    for (const client of clients) stats[client.id] = { tickets: 0, environments: 0 };
    for (const ticket of allTickets) if (stats[ticket.clientId]) stats[ticket.clientId].tickets += 1;
    for (const env of allEnvironments) if (stats[env.clientId]) stats[env.clientId].environments += 1;
    return stats;
  }, [clients, allTickets, allEnvironments]);

  const activeClient = useMemo(
    () => clients.find((c) => c.id === activeClientId) || null,
    [clients, activeClientId],
  );

  const environments = useMemo(
    () => (activeClient ? allEnvironments.filter((e) => e.clientId === activeClient.id) : []),
    [allEnvironments, activeClient],
  );

  const tickets = useMemo(
    () => (activeClient ? allTickets.filter((tk) => tk.clientId === activeClient.id) : []),
    [allTickets, activeClient],
  );

  /** Falls back to the client's first ticket so a freshly picked client never
   * lands on the task panel with no context. Deliberately not written back to
   * storage here — it is a display fallback, not a user choice. */
  const activeTicket = useMemo(
    () => tickets.find((tk) => tk.id === activeTicketId) || tickets[0] || null,
    [tickets, activeTicketId],
  );

  const selectClient = useCallback((clientId: string) => {
    setActiveClientId(clientId);
    // the ticket in hand belongs to the previous client, so drop it and let the
    // new client's first ticket take over until the user picks one
    setActiveTicketId("");
  }, []);

  const selectTicket = useCallback((ticketId: string) => setActiveTicketId(ticketId), []);

  const createTicket = useCallback((ticket: Ticket) => {
    setAllTickets((prev) => [ticket, ...prev]);
    setActiveTicketId(ticket.id);
    logActivity({ clientId: ticket.clientId, kind: "ticket", actionKey: "activity.actions.ticketCreated", target: ticket.id, ticket: ticket.id });
  }, []);

  const setTicketEnvironment = useCallback((ticketId: string, envId: string) => {
    setAllTickets((prev) =>
      prev.map((tk) => (tk.id === ticketId ? { ...tk, env: envId, updatedAt: new Date().toISOString() } : tk)),
    );
  }, []);

  const touchTicket = useCallback((ticketId: string) => {
    setAllTickets((prev) =>
      prev.map((tk) => (tk.id === ticketId ? { ...tk, updatedAt: new Date().toISOString() } : tk)),
    );
  }, []);

  // Environment actions log to the activity rail here, at the single point
  // every screen goes through, so no caller can forget to emit the event.
  const createEnvironment = useCallback((env: Environment) => {
    setAllEnvironments((prev) => [env, ...prev]);
    logActivity({ clientId: env.clientId, kind: "environment", actionKey: "activity.actions.environmentCreated", target: env.name, ticket: "—" });
  }, []);

  const updateEnvironment = useCallback((env: Environment) => {
    setAllEnvironments((prev) => prev.map((e) => (e.id === env.id ? env : e)));
    logActivity({ clientId: env.clientId, kind: "environment", actionKey: "activity.actions.environmentUpdated", target: env.name, ticket: "—" });
  }, []);

  const removeEnvironment = useCallback((envId: string) => {
    const gone = envsRef.current.find((e) => e.id === envId);
    setAllEnvironments((prev) => prev.filter((e) => e.id !== envId));
    if (gone) logActivity({ clientId: gone.clientId, kind: "environment", actionKey: "activity.actions.environmentRemoved", target: gone.name, ticket: "—" });
  }, []);

  const setEnvironmentStatus = useCallback((envId: string, status: EnvironmentStatus) => {
    const env = envsRef.current.find((e) => e.id === envId);
    setAllEnvironments((prev) => prev.map((e) => (e.id === envId ? { ...e, status } : e)));
    if (env) logActivity({ clientId: env.clientId, kind: "environment", status: status === "failed" ? "error" : "success", actionKey: "activity.actions.environmentTested", target: env.name, ticket: "—" });
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      hydrated,
      clients,
      clientStats,
      activeClient,
      selectClient,
      environments,
      createEnvironment,
      updateEnvironment,
      removeEnvironment,
      setEnvironmentStatus,
      tickets,
      activeTicket,
      selectTicket,
      createTicket,
      setTicketEnvironment,
      touchTicket,
    }),
    [
      hydrated, clients, clientStats, activeClient, selectClient, environments, createEnvironment,
      updateEnvironment, removeEnvironment, setEnvironmentStatus, tickets, activeTicket,
      selectTicket, createTicket, setTicketEnvironment, touchTicket,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within <WorkspaceProvider>");
  return ctx;
}
