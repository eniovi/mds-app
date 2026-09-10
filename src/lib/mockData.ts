import type { ActivityEvent, Client, Connection, Environment, Person, Ticket } from "./types";

/* Prototype session data — the Cliente → Ticket → Tarefas hierarchy the whole
   app navigates. Split out of mds-data.ts on purpose: that file is the *task
   catalog* (36 MDS tasks + the mock Maximo/MAS lookups they read), this one is
   *who is using it and on what*. There is no backend anywhere in this
   prototype, so these are the seeds every screen hydrates from on a cold start
   before localStorage takes over. */

export const MDS_CONNECTION: Connection = {
  containerName: "mds",
  containerStatus: "ativo",
  user: "Ana Consultora",
  userInitials: "AC",
  role: "Consultora Funcional",
};

// ---------------------------------------------------------------- people

const CARLOS: Person = { name: "Carlos Silva", initials: "CS", role: "Dev" };
const ANA_COSTA: Person = { name: "Ana Costa", initials: "AC", role: "Tech Lead" };
const RAFAEL: Person = { name: "Rafael Lima", initials: "RL", role: "Dev" };
const MARIANA: Person = { name: "Mariana Alves", initials: "MA", role: "Analista Funcional" };
const BRUNO: Person = { name: "Bruno Tavares", initials: "BT", role: "Dev" };
const JULIA: Person = { name: "Júlia Moreira", initials: "JM", role: "Tech Lead" };

/** The signed-in consultant, as a Person — used when she creates a ticket. */
export const CURRENT_PERSON: Person = {
  name: MDS_CONNECTION.user,
  initials: MDS_CONNECTION.userInitials,
  role: MDS_CONNECTION.role,
};

// --------------------------------------------------------------- clients

export const MDS_CLIENTS: Client[] = [
  { id: "cli-alfa", name: "Cliente Alfa — Indústria", segment: "Indústria", initials: "AL" },
  { id: "cli-beta", name: "Cliente Beta — Logística", segment: "Logística", initials: "BE" },
  { id: "cli-gamma", name: "Cliente Gamma — Energia", segment: "Energia", initials: "GA" },
];

// ---------------------------------------------------------- environments

/** Two to three per client, mixing the two Maximo families the environment
   form offers (IBM Maximo 7.6 / IBM MAS) — the strings have to match the form's
   radio options exactly, or editing an environment opens with no version
   selected. `appUser` is the Maximo application user the MDS
   container authenticates with — passwords deliberately live nowhere in this
   model, matching the warning the environment form itself displays. */
export const MDS_ENVIRONMENTS: Environment[] = [
  { id: "env-alfa-dev", clientId: "cli-alfa", name: "DEV — Desenvolvimento", kind: "DEV", host: "maximo-dev.alfa.local", port: 9081, maximoVersion: "IBM Maximo 7.6", dbType: "DB2", status: "connected", appUser: "maxadmin" },
  { id: "env-alfa-qa", clientId: "cli-alfa", name: "QA — Homologação", kind: "QA", host: "maximo-qa.alfa.local", port: 9081, maximoVersion: "IBM Maximo 7.6", dbType: "DB2", status: "connected", appUser: "maxadmin" },
  { id: "env-alfa-prod", clientId: "cli-alfa", name: "PROD — Produção", kind: "PROD", host: "maximo.alfa.local", port: 9443, maximoVersion: "IBM MAS", dbType: "DB2", status: "untested", appUser: "mdsdeploy" },

  { id: "env-beta-dev", clientId: "cli-beta", name: "DEV — Desenvolvimento", kind: "DEV", host: "mas-dev.beta.local", port: 443, maximoVersion: "IBM MAS", dbType: "Oracle", status: "connected", appUser: "maxadmin" },
  { id: "env-beta-qa", clientId: "cli-beta", name: "QA — Homologação", kind: "QA", host: "mas-qa.beta.local", port: 443, maximoVersion: "IBM MAS", dbType: "Oracle", status: "failed", appUser: "maxadmin" },
  { id: "env-beta-prod", clientId: "cli-beta", name: "PROD — Produção", kind: "PROD", host: "mas.beta.local", port: 443, maximoVersion: "IBM MAS", dbType: "Oracle", status: "connected", appUser: "mdsdeploy" },

  { id: "env-gamma-dev", clientId: "cli-gamma", name: "DEV — Desenvolvimento", kind: "DEV", host: "maximo-dev.gamma.local", port: 9080, maximoVersion: "IBM Maximo 7.6", dbType: "SQL Server", status: "connected", appUser: "maxadmin" },
  { id: "env-gamma-prod", clientId: "cli-gamma", name: "PROD — Produção", kind: "PROD", host: "maximo.gamma.local", port: 9080, maximoVersion: "IBM Maximo 7.6", dbType: "SQL Server", status: "connected", appUser: "mdsdeploy" },
];

// -------------------------------------------------------------- tickets

export const MDS_TICKETS: Ticket[] = [
  { id: "MDS-1042", clientId: "cli-alfa", title: "Ajuste no workflow de aprovação de OS", status: "in_progress", env: "env-alfa-dev", owner: CARLOS, createdAt: "2026-08-24T09:10:00", updatedAt: "2026-09-08T16:40:00" },
  { id: "MDS-1038", clientId: "cli-alfa", title: "Extração de telas de PM para o pacote v3", status: "open", env: "env-alfa-dev", owner: ANA_COSTA, createdAt: "2026-08-28T11:02:00", updatedAt: "2026-09-05T09:12:00" },
  { id: "MDS-1029", clientId: "cli-alfa", title: "Escalonamento de SR fora do SLA", status: "blocked", env: "env-alfa-qa", owner: MARIANA, createdAt: "2026-08-12T15:20:00", updatedAt: "2026-09-02T14:05:00" },
  { id: "MDS-1015", clientId: "cli-alfa", title: "Pacote de instalação — release de agosto", status: "done", env: "env-alfa-prod", owner: ANA_COSTA, createdAt: "2026-07-30T08:45:00", updatedAt: "2026-08-29T11:30:00" },

  { id: "MDS-2077", clientId: "cli-beta", title: "Integração MIF com o WMS da transportadora", status: "in_progress", env: "env-beta-dev", owner: RAFAEL, createdAt: "2026-08-31T10:15:00", updatedAt: "2026-09-09T17:22:00" },
  { id: "MDS-2064", clientId: "cli-beta", title: "Domínios de status de carga fora do padrão", status: "open", env: "env-beta-qa", owner: JULIA, createdAt: "2026-09-01T13:40:00", updatedAt: "2026-09-07T10:05:00" },
  { id: "MDS-2051", clientId: "cli-beta", title: "Relatórios BIRT de ocorrências de rota", status: "blocked", env: "env-beta-qa", owner: BRUNO, createdAt: "2026-08-19T09:00:00", updatedAt: "2026-09-03T15:48:00" },

  { id: "MDS-3110", clientId: "cli-gamma", title: "Escalonamento de ordens preventivas de subestação", status: "in_progress", env: "env-gamma-dev", owner: JULIA, createdAt: "2026-09-02T08:30:00", updatedAt: "2026-09-09T11:14:00" },
  { id: "MDS-3098", clientId: "cli-gamma", title: "Grupos de segurança da equipe de campo", status: "open", env: "env-gamma-dev", owner: BRUNO, createdAt: "2026-08-27T16:05:00", updatedAt: "2026-09-06T09:37:00" },
  { id: "MDS-3072", clientId: "cli-gamma", title: "Migração de start centers para o MAS", status: "done", env: "env-gamma-prod", owner: CARLOS, createdAt: "2026-07-22T14:10:00", updatedAt: "2026-08-30T18:02:00" },
];

// ----------------------------------------------------- recent activities

/** Timestamps are offsets from module load, not fixed dates: the rail leads
   with relative times ("há 12 min"), and a demo opened three months from now
   should still read as a live feed instead of a museum piece. Real runs the
   user triggers are merged in front of these — see lib/activity.ts. */
const MINUTE = 60_000;
const ago = (minutes: number) => new Date(Date.now() - minutes * MINUTE).toISOString();

export const MDS_ACTIVITIES: ActivityEvent[] = [
  { id: "act-1", clientId: "cli-alfa", kind: "run", status: "success", taskId: "extract-workflow", action: "Extrair Workflow", target: "DBC/extract-workflow-WOAPPR.dbc", ticket: "MDS-1042", user: "Carlos Silva", at: ago(12) },
  { id: "act-2", clientId: "cli-alfa", kind: "file", status: "success", action: "Salvou alterações", target: "autoscripts/WOAPPR_VALIDATE.py", ticket: "MDS-1042", user: "Ana Consultora", at: ago(38) },
  { id: "act-3", clientId: "cli-alfa", kind: "run", status: "error", taskId: "validate-dbc-file", action: "Validar Arquivo DBC", target: "DBC/extract-menu-WOTRACK.dbc", ticket: "MDS-1042", user: "Ana Consultora", at: ago(96) },
  { id: "act-4", clientId: "cli-alfa", kind: "ticket", status: "success", action: "Atualizou o ticket", target: "MDS-1038", ticket: "MDS-1038", user: "Ana Costa", at: ago(210) },
  { id: "act-5", clientId: "cli-alfa", kind: "run", status: "success", taskId: "generate-package", action: "Gerar Pacote de Instalação", target: "install/MDS-1015.zip", ticket: "MDS-1015", user: "Ana Costa", at: ago(1450) },
  { id: "act-6", clientId: "cli-alfa", kind: "environment", status: "success", action: "Testou a conexão", target: "QA — Homologação", ticket: "—", user: "Ana Consultora", at: ago(1620) },

  { id: "act-7", clientId: "cli-beta", kind: "run", status: "success", taskId: "extract-mif-publish-channel", action: "Extrair Canal de Publicação", target: "DBC/extract-mif-publish-channel-WMS.dbc", ticket: "MDS-2077", user: "Rafael Lima", at: ago(24) },
  { id: "act-8", clientId: "cli-beta", kind: "run", status: "error", taskId: "extract-domains", action: "Extrair Domínios", target: "DBC/extract-domains-CARGOSTATUS.dbc", ticket: "MDS-2064", user: "Júlia Moreira", at: ago(140) },
  { id: "act-9", clientId: "cli-beta", kind: "file", status: "success", action: "Salvou alterações", target: "reports/rota_ocorrencias.rptdesign", ticket: "MDS-2051", user: "Bruno Tavares", at: ago(320) },
  { id: "act-10", clientId: "cli-beta", kind: "environment", status: "error", action: "Testou a conexão", target: "QA — Homologação", ticket: "—", user: "Rafael Lima", at: ago(430) },
  { id: "act-11", clientId: "cli-beta", kind: "ticket", status: "success", action: "Criou o ticket", target: "MDS-2064", ticket: "MDS-2064", user: "Júlia Moreira", at: ago(1180) },

  { id: "act-12", clientId: "cli-gamma", kind: "run", status: "success", taskId: "extract-escalation", action: "Extrair Escalonamento", target: "DBC/extract-escalation-PMSUB.dbc", ticket: "MDS-3110", user: "Júlia Moreira", at: ago(45) },
  { id: "act-13", clientId: "cli-gamma", kind: "run", status: "success", taskId: "extract-security-group", action: "Extrair Grupo de Segurança", target: "DBC/extract-security-group-CAMPO.dbc", ticket: "MDS-3098", user: "Bruno Tavares", at: ago(260) },
  { id: "act-14", clientId: "cli-gamma", kind: "file", status: "success", action: "Salvou alterações", target: "DBC/start_center_mas.dbc", ticket: "MDS-3072", user: "Carlos Silva", at: ago(900) },
  { id: "act-15", clientId: "cli-gamma", kind: "ticket", status: "success", action: "Concluiu o ticket", target: "MDS-3072", ticket: "MDS-3072", user: "Carlos Silva", at: ago(1500) },
];
