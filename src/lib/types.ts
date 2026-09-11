export type CategoryId =
  | "db"
  | "apps"
  | "automation"
  | "security"
  | "comms"
  | "reports"
  | "integration"
  | "system"
  | "ticket";

export interface Category {
  id: CategoryId;
  label: string;
  hint: string;
}

export type FieldType = "text" | "select" | "yesno" | "catalog" | "context-ticket" | "file" | "revision" | "tabs" | "async-catalog";

export type CatalogKey =
  | "apps"
  | "objects"
  | "domains"
  | "scripts"
  | "workflows"
  | "escalations"
  | "actionGroups"
  | "actions"
  | "commTemplates"
  | "personGroups"
  | "securityGroups"
  | "systemProperties"
  | "reports"
  | "conditionalExpressions"
  | "sigOptions"
  | "startCenters"
  | "messageGroups"
  | "attributesByObject"
  | "indexesByObject"
  | "relationshipsByObject"
  | "messageKeysByGroup";

export interface SelectOption {
  label: string;
  value: string;
}

export interface TaskField {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  default?: string;
  multiple?: boolean;
  options?: SelectOption[];
  catalog?: CatalogKey;
  /** id of a sibling field whose value scopes this field's catalog lookup */
  scopedBy?: string;
  /** fixed scope for this field's catalog lookup, when the scope is a property
   * of the task itself rather than something the user picks. The MIF extraction
   * tasks use it: each one is a single artifact type, so the type is baked into
   * the card instead of being a tab strip inside the form. Takes precedence
   * over scopedBy. */
  scopeConstant?: string;
  /** for type "file" — restricts the picker to files ending in one of these
   * extensions (no dot, e.g. ["dbc", "sql"]); omit to show every generated file */
  fileExtensions?: string[];
  /** for type "catalog" with catalog: "apps" — narrows the option list to the
   * apps that a successful run of *this task id* has produced artifacts for in
   * the ticket (derived from run history via lib/extracted-apps.ts), instead
   * of every app in the mock Maximo catalog. Naming the task is what makes the
   * rule strict: generate-presentation-diff lists apps with a *screen*
   * extraction behind them, not apps touched by any extraction at all. */
  extractedBy?: string;
}

export type RevisionStatus = "active" | "enabled" | "inactive";

export interface WorkflowRevision {
  number: string;
  status: RevisionStatus;
}

export interface Task {
  id: string;
  label: string;
  category: CategoryId;
  detail: string;
  fields: TaskField[];
  beta?: boolean;
  /** Real relative directory (from the MDS repo layout) this task's artifact lands in.
   * Absent for tasks that don't produce a new browsable file (apply/run/validate/sync). */
  outputDir?: string;
  /** Overrides the drawer's default "Executar" primary-button verb (e.g.
   * "Validar Selecionados") — the count from the task's first multiple:true
   * field is appended automatically, so this should NOT include a count. */
  actionLabel?: string;
}

/** A consulting client. Everything below the login is scoped to exactly one of
 * these: its tickets, its environments and its activity feed. */
export interface Client {
  id: string;
  name: string;
  segment: string;
  /** avatar monogram on the client card — kept in the data because it is a
   * property of the client's brand, not something to derive from the name */
  initials: string;
}

/** Named human shown as a ticket's owner (avatar + name + role). */
export interface Person {
  name: string;
  initials: string;
  role: string;
}

export type TicketStatus = "open" | "in_progress" | "blocked" | "done";

export interface Ticket {
  id: string;
  /** references Client.id — a ticket never exists outside a client */
  clientId: string;
  title: string;
  status: TicketStatus;
  /** references Environment.id — which registered Maximo/MAS environment this ticket targets */
  env: string;
  owner: Person;
  createdAt: string;
  updatedAt: string;
}

export interface Connection {
  containerName: string;
  containerStatus: string;
  user: string;
  userInitials: string;
  role: string;
}

export type EnvironmentKind = "DEV" | "QA" | "PROD" | "CUSTOM";
export type DbType = "DB2" | "Oracle" | "SQL Server";
export type EnvironmentStatus = "connected" | "untested" | "failed";

export interface Environment {
  id: string;
  /** references Client.id — the /environments module only ever lists and writes
   * environments belonging to the client active in the session */
  clientId: string;
  name: string;
  kind: EnvironmentKind;
  host: string;
  port: number;
  maximoVersion: string;
  dbType: DbType;
  status: EnvironmentStatus;
  /** Maximo application user the MDS container authenticates with. Never a
   * password — credentials stay in the container's .credentials.env, per the
   * rule the environment form itself states. */
  appUser?: string;
}

export type FieldValue = string | string[];
export type TaskFormValues = Record<string, FieldValue>;

export type RunStatus = "queued" | "running" | "success" | "error";

export interface RunRecord {
  id: string;
  taskId: string;
  taskLabel: string;
  category: CategoryId;
  status: RunStatus;
  startedAt: string;
  ticket: string;
  outputPath?: string;
  /** snapshot of the form values the task was run with — lets later screens
   * ask "what app/object/etc. did this run actually touch?" instead of only
   * knowing that some task succeeded */
  fieldValues?: TaskFormValues;
  /** who ran it — snapshot of MDS_CONNECTION.user at push time, shown in
   * the Histórico de Execuções table */
  user?: string;
  /** present when status is "error" — the mocked Maximo error text shown
   * behind "Ver Logs de Erro" */
  errorMessage?: string;
}

export type ActivityKind = "run" | "file" | "ticket" | "environment";

/** One line in the Recent Activity rail. Real runs are projected into this
 * shape from RunRecord (see lib/activity.ts) and merged with the seeded
 * prototype history in mockData.ts, so the rail is populated on a cold start
 * and still reacts live to anything the user runs. */
export interface ActivityEvent {
  id: string;
  clientId: string;
  kind: ActivityKind;
  status: RunStatus;
  /** catalog task id when the event came from a task run — lets the rail
   * relabel the action through the catalog overlay when the language changes */
  taskId?: string;
  /** i18n key under activity.actions.* for events the app itself logs
   * (ticket created, environment tested, file deleted…) — translated live by
   * the rail, like taskId is for runs */
  actionKey?: string;
  /** fallback label, used when there is neither taskId nor actionKey */
  action: string;
  /** file, artifact or object the action touched */
  target: string;
  ticket: string;
  user: string;
  at: string;
}
