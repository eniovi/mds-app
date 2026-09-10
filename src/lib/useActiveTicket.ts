"use client";

import { useWorkspace } from "./workspace-context";
import type { Ticket } from "./types";

/** The ticket the session is working inside, already narrowed to the active
 * client. Null until a client is chosen. */
export function useActiveTicket(): Ticket | null {
  return useWorkspace().activeTicket;
}
