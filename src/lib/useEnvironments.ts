"use client";

import { useWorkspace } from "./workspace-context";
import type { Environment } from "./types";

export { ENVIRONMENTS_STORAGE_KEY } from "./workspace-context";

/** Environments of the client active in the session. Thin wrapper kept so the
 * components that only need to read the list (TopBar, EnvironmentTagPopover,
 * NewTicketModal, TaskDrawer) don't each have to reach into the whole
 * workspace context. */
export function useEnvironments(): Environment[] {
  return useWorkspace().environments;
}
