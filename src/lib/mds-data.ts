import type { Category, CatalogKey, SelectOption, Task, WorkflowRevision } from "./types";

/* MDS product data model — task catalog reorganized from the real .vscode/tasks.json
   (36 tasks) into 9 menu categories, plus mock Maximo/MAS system catalogs that stand
   in for a live OSLC/REST lookup. Field-driven so one generic form renderer covers
   every task instead of one hand-built form per task. */

export const MDS_CATEGORIES: Category[] = [
  { id: "db", label: "Banco de Dados", hint: "Tabelas, atributos, índices, domínios, relacionamentos" },
  { id: "apps", label: "Aplicações & Telas", hint: "Apps, menus, apresentação, propriedades condicionais" },
  { id: "automation", label: "Automação & Fluxo", hint: "Scripts, workflows, escalonamentos, ações" },
  { id: "security", label: "Segurança & Acesso", hint: "Grupos de segurança e de pessoas" },
  { id: "comms", label: "Comunicação", hint: "Templates e mensagens do sistema" },
  { id: "reports", label: "Relatórios (BIRT)", hint: "Extração e importação de relatórios" },
  { id: "integration", label: "Integração", hint: "Objetos MIF (web services, canais)" },
  { id: "system", label: "Sistema", hint: "Propriedades globais do ambiente" },
  { id: "ticket", label: "Empacotamento & Ticket", hint: "Pacote de instalação, execução e workspace" },
];

/** Real relative directories used by the MDS repo layout — the ticket workspace's
 * root always has these (some start empty until the matching task runs once). */
export const MDS_EXPECTED_DIRECTORIES: string[] = [
  "action_groups",
  "actions",
  "autoscripts",
  "communication_templates",
  "DBC",
  "documentation",
  "install",
  "person_groups",
  "presentations/original",
  "presentations/changes",
  "reports",
  "system_properties",
  "tables",
];

type ScopedCatalog = Record<string, string[]> & { _default: string[] };

export const MDS_CATALOG: Record<CatalogKey, string[] | ScopedCatalog> = {
  apps: ["ASSET", "WORKORDER", "PM", "JOBPLAN", "INVENTORY", "PURCHASEORDER", "PR", "SR", "INCIDENT", "PROBLEM", "CHANGE", "RELEASE", "PERSON", "LOCATIONS", "LABOR", "CI"],
  objects: ["ASSET", "WORKORDER", "PM", "JOBPLAN", "INVENTORY", "PURCHASEORDER", "PR", "SR", "INCIDENT", "PROBLEM", "CHANGE", "RELEASE", "PERSON", "LOCATIONS", "LABOR", "CI"],
  domains: ["ASSETTYPE", "WOSTATUS", "PRIORITY", "YESNO2", "ITEMSTATUS"],
  scripts: ["WORKORDERSTATUS", "PMTRIGGERGEN", "ASSETSPARECHECK", "AUTONUMBERASSIGN", "SRINCIDENTCREATE", "PRAPPROVALROUTE", "INVENTORYREORDER"],
  workflows: ["WOAPPR", "PRAPPR", "INCIDENTFLOW", "CHANGEMGMT", "ASSETLIFECYCLE"],
  escalations: ["WOPASTTARGET", "PMOVERDUE", "SRSLABREACH", "INVENTORYLOW"],
  actionGroups: ["WOAPPRACTIONS", "ASSETACTIONS", "PRAPPRACTIONS"],
  actions: ["CHANGESTATUS", "SENDNOTIFICATION", "CREATEWO", "SETOWNER"],
  commTemplates: ["WO_ASSIGNED", "SR_CREATED", "PM_DUE_SOON", "PR_APPROVED"],
  personGroups: ["MAINTENANCE", "IT_SUPPORT", "SUPERVISORS", "PROCUREMENT"],
  securityGroups: ["MAXADMIN", "MAINTSUPER", "REQSELFSERVICE", "TECHNICIAN"],
  systemProperties: ["mxe.name", "mxe.oslc.webappurl", "mxe.system.timezone", "mxe.db.type", "mxe.int.globaldir"],
  reports: ["wo_print", "pm_schedule", "inventory_valuation", "purchase_order_print"],
  conditionalExpressions: ["ISOWNER", "ISHIGHPRIORITY", "ISOVERDUE"],
  sigOptions: ["APPR", "CHG", "WOCOMP", "CLOSE"],
  startCenters: ["DEFAULT_TECH", "DEFAULT_SUPERVISOR", "DEFAULT_MANAGER"],
  messageGroups: ["system", "wo", "asset", "inventory", "purchasing"],

  attributesByObject: {
    ASSET: ["ASSETNUM", "DESCRIPTION", "LOCATION", "STATUS", "ASSETTYPE", "SERIALNUM", "PARENT", "SITEID"],
    WORKORDER: ["WONUM", "DESCRIPTION", "STATUS", "WORKTYPE", "PRIORITY", "TARGSTARTDATE", "TARGCOMPDATE", "ASSETNUM"],
    PM: ["PMNUM", "DESCRIPTION", "STATUS", "FREQUENCY", "ASSETNUM", "JPNUM"],
    INVENTORY: ["ITEMNUM", "SITEID", "STORELOCATION", "CURBAL", "MINLEVEL", "MAXLEVEL"],
    _default: ["DESCRIPTION", "STATUS", "SITEID", "ORGID"],
  },
  indexesByObject: {
    ASSET: ["ASSET_NDX1", "ASSET_NDX2", "ASSET_LOC_NDX"],
    WORKORDER: ["WO_NDX1", "WO_STATUS_NDX"],
    _default: ["_NDX1"],
  },
  relationshipsByObject: {
    ASSET: ["ASSETSPEC", "ASSETMETER", "WORKORDER", "LOCATION"],
    WORKORDER: ["ASSET", "WOSTATUS", "LABTRANS", "WOMATERIAL"],
    _default: ["CHILDREN", "PARENT"],
  },
  messageKeysByGroup: {
    system: ["BMXAA0001E", "BMXAA0002E", "BMXAA1234I"],
    wo: ["WO_STATUS_CHANGED", "WO_CLOSED_OK"],
    asset: ["ASSET_MOVED", "ASSET_DECOMMISSIONED"],
    _default: ["GENERIC_MSG_01"],
  },
};

export function mdsCatalogFor(key: CatalogKey, scopeValue?: string): string[] {
  const entry = MDS_CATALOG[key];
  if (Array.isArray(entry)) return entry;
  if (entry && typeof entry === "object") {
    return (scopeValue && entry[scopeValue]) || entry._default || [];
  }
  return [];
}

const YES_NO: SelectOption[] = [{ label: "Sim", value: "Yes" }, { label: "Não", value: "No" }];

/** Revisions per workflow process — mirrors real Maximo workflow revision
 * status semantics (a process has exactly one ACTIVE revision at a time;
 * others may be ENABLED — validated and ready but not promoted — or
 * inactive/historical). Scoped by the "process" field on extract-workflow. */
export const MDS_WORKFLOW_REVISIONS: Record<string, WorkflowRevision[]> = {
  WOAPPR: [
    { number: "3", status: "active" },
    { number: "2", status: "inactive" },
    { number: "1", status: "inactive" },
  ],
  PRAPPR: [
    { number: "2", status: "active" },
    { number: "1", status: "inactive" },
  ],
  INCIDENTFLOW: [
    { number: "4", status: "active" },
    { number: "3", status: "enabled" },
    { number: "2", status: "inactive" },
    { number: "1", status: "inactive" },
  ],
  CHANGEMGMT: [{ number: "1", status: "active" }],
  ASSETLIFECYCLE: [
    { number: "2", status: "enabled" },
    { number: "1", status: "active" },
  ],
};

export const MDS_TASKS: Task[] = [
  { id: "apply-presentation-diff", label: "Aplicar Diferença de Apresentação", category: "apps",
    detail: "Aplica a diferença de tela (.mxs) sobre a apresentação atual.",
    fields: [{ id: "file", label: "Arquivo .mxs", type: "file", required: true, fileExtensions: ["mxs"] }] },

  { id: "download-autoscripts", label: "Baixar Scripts de Automação", category: "automation",
    detail: "Extrai um ou mais scripts de automação do ambiente para o projeto local.",
    outputDir: "autoscripts",
    fields: [{ id: "scripts", label: "Scripts de automação", type: "catalog", catalog: "scripts", multiple: true, required: true }] },

  { id: "extract-action-group", label: "Extrair Grupo de Ações", category: "automation",
    detail: "Gera um .dbc com um ou mais grupos de ações.",
    outputDir: "action_groups",
    fields: [{ id: "actionGroups", label: "Grupos de ações", type: "catalog", catalog: "actionGroups", multiple: true, required: true }] },

  { id: "extract-actions", label: "Extrair Ações", category: "automation",
    detail: "Gera um .dbc com uma ou mais ações.",
    outputDir: "actions",
    fields: [{ id: "actions", label: "Ações", type: "catalog", catalog: "actions", multiple: true, required: true }] },

  { id: "extract-app", label: "Extrair Aplicação", category: "apps",
    detail: "Extrai todos os artefatos de uma aplicação.",
    outputDir: "DBC",
    fields: [{ id: "app", label: "Aplicação", type: "catalog", catalog: "apps", required: true }] },

  { id: "extract-attributes", label: "Extrair Atributos", category: "db",
    detail: "Extrai atributos de banco e configurações relacionadas (LookupMaps, índices).",
    outputDir: "tables",
    fields: [
      { id: "object", label: "Objeto", type: "catalog", catalog: "objects", required: true },
      { id: "attributes", label: "Atributos", type: "catalog", catalog: "attributesByObject", scopedBy: "object", multiple: true, required: true },
      { id: "extractDomains", label: "Extrair domínios associados?", type: "yesno", options: YES_NO, default: "Yes" },
    ] },

  { id: "extract-birt-reports", label: "Extrair Relatórios BIRT", category: "reports",
    detail: "Extrai um relatório BIRT específico de uma aplicação.",
    outputDir: "reports",
    fields: [
      { id: "ticket", label: "Ticket", type: "context-ticket" },
      { id: "app", label: "Aplicação", type: "catalog", catalog: "apps", required: true },
      { id: "report", label: "Relatório", type: "catalog", catalog: "reports", required: true },
    ] },

  { id: "extract-comm-template", label: "Extrair Template de Comunicação", category: "comms",
    detail: "Extrai um ou mais templates de comunicação.",
    outputDir: "communication_templates",
    fields: [{ id: "templates", label: "Templates", type: "catalog", catalog: "commTemplates", multiple: true, required: true }] },

  { id: "extract-conditional-expression", label: "Extrair Expressão Condicional", category: "automation",
    detail: "Extrai expressões condicionais do ambiente.",
    outputDir: "DBC",
    fields: [{ id: "conditions", label: "Expressões condicionais", type: "catalog", catalog: "conditionalExpressions", multiple: true, required: true }] },

  { id: "extract-conditional-properties", label: "Extrair Propriedades Condicionais", category: "apps",
    detail: "Extrai propriedades condicionais vinculadas a uma opção de assinatura.",
    outputDir: "DBC",
    fields: [
      { id: "app", label: "Aplicação", type: "catalog", catalog: "apps", required: true },
      { id: "sig", label: "Opção de assinatura", type: "catalog", catalog: "sigOptions", required: true },
    ] },

  { id: "extract-domains", label: "Extrair Domínios", category: "db",
    detail: "Extrai domínios específicos do banco de dados.",
    outputDir: "DBC",
    fields: [{ id: "domains", label: "Domínios", type: "catalog", catalog: "domains", multiple: true, required: true }] },

  { id: "extract-escalation", label: "Extrair Escalonamento", category: "automation",
    detail: "Extrai um ou mais escalonamentos.",
    outputDir: "DBC",
    fields: [{ id: "escalations", label: "Escalonamentos", type: "catalog", catalog: "escalations", multiple: true, required: true }] },

  { id: "extract-global-restriction", label: "Extrair Restrição Global", category: "apps",
    detail: "Extrai a restrição global por aplicação, objeto e atributo.",
    outputDir: "DBC",
    fields: [
      { id: "object", label: "Objeto", type: "catalog", catalog: "objects", required: true },
      { id: "app", label: "Aplicação", type: "catalog", catalog: "apps", required: true },
      { id: "attribute", label: "Atributo", type: "catalog", catalog: "attributesByObject", scopedBy: "object", required: true },
      { id: "condition", label: "Extrair expressão condicional?", type: "yesno", options: YES_NO, default: "Yes" },
    ] },

  { id: "extract-indexes", label: "Extrair Índices", category: "db",
    detail: "Extrai índices de banco de dados de um objeto específico.",
    outputDir: "tables",
    fields: [
      { id: "object", label: "Objeto", type: "catalog", catalog: "objects", required: true },
      { id: "indexes", label: "Índices", type: "catalog", catalog: "indexesByObject", scopedBy: "object", multiple: true, hint: "Deixe em branco para extrair todos os índices do objeto." },
    ] },

  { id: "extract-menu", label: "Extrair Menu", category: "apps",
    detail: "Extrai menus criados para uma aplicação.",
    outputDir: "DBC",
    fields: [
      { id: "app", label: "Aplicação", type: "catalog", catalog: "apps", required: true },
      { id: "menuType", label: "Tipo de menu", type: "select", default: "ALL",
        /* Application values — these labels stay in English in every language, and
           carry no "catalog.tasks.extract-menu.fields.menuType.options" overlay in
           en.json/es.json on purpose. Translating them would mean the backend has to
           map the displayed text back to the Maximo menu type it was sent, so don't
           "fix" this into Portuguese. The field *label* above is normal UI copy and
           is translated like any other. */
        options: [{ label: "Action", value: "APPMENU" }, { label: "Search", value: "SEARCHMENU" }, { label: "Tool", value: "APPTOOL" }, { label: "All", value: "ALL" }] },
    ] },

  /* MIF extraction — one task per artifact type. These used to be a single
     "Extrair Objetos MIF" card with a tab strip for the type; the type is now
     the card itself, so the form opens straight on the artifact picker and the
     type never has to be re-picked inside the drawer. `scopeConstant` is what
     feeds fetchArtifactNames in mif-artifacts.ts (same numeric MIF type keys as
     before). Ordered by MIF artifact type, not alphabetically by id, so the
     family reads in Maximo's own order — 7 is unused in Maximo, hence the gap. */
  { id: "extract-mif-object-structure", label: "Extrair Estrutura de Objeto", category: "integration",
    detail: "Extrai uma ou mais estruturas de objeto (Object Structures) do MIF.",
    outputDir: "DBC",
    fields: [
      { id: "artifactValue", label: "Estruturas de objeto", type: "async-catalog", scopeConstant: "1", multiple: true, required: true },
      { id: "extractDependencies", label: "Extrair dependências relacionadas?", type: "yesno", options: YES_NO, default: "Yes" },
    ] },

  { id: "extract-mif-endpoint", label: "Extrair End Point", category: "integration",
    detail: "Extrai um ou mais End Points do MIF.",
    outputDir: "DBC",
    fields: [
      { id: "artifactValue", label: "End Points", type: "async-catalog", scopeConstant: "2", multiple: true, required: true },
      { id: "extractDependencies", label: "Extrair dependências relacionadas?", type: "yesno", options: YES_NO, default: "Yes" },
    ] },

  { id: "extract-mif-web-service", label: "Extrair Web Service", category: "integration",
    detail: "Extrai um ou mais web services do MIF.",
    outputDir: "DBC",
    fields: [
      { id: "artifactValue", label: "Web services", type: "async-catalog", scopeConstant: "3", multiple: true, required: true },
      { id: "extractDependencies", label: "Extrair dependências relacionadas?", type: "yesno", options: YES_NO, default: "Yes" },
    ] },

  { id: "extract-mif-enterprise-service", label: "Extrair Enterprise Service", category: "integration",
    detail: "Extrai um ou mais Enterprise Services do MIF.",
    outputDir: "DBC",
    fields: [
      { id: "artifactValue", label: "Enterprise services", type: "async-catalog", scopeConstant: "4", multiple: true, required: true },
      { id: "extractDependencies", label: "Extrair dependências relacionadas?", type: "yesno", options: YES_NO, default: "Yes" },
    ] },

  { id: "extract-mif-external-system", label: "Extrair Sistema Externo", category: "integration",
    detail: "Extrai um ou mais sistemas externos do MIF.",
    outputDir: "DBC",
    fields: [
      { id: "artifactValue", label: "Sistemas externos", type: "async-catalog", scopeConstant: "5", multiple: true, required: true },
      { id: "extractDependencies", label: "Extrair dependências relacionadas?", type: "yesno", options: YES_NO, default: "Yes" },
    ] },

  { id: "extract-mif-publish-channel", label: "Extrair Canal de Publicação", category: "integration",
    detail: "Extrai um ou mais canais de publicação do MIF.",
    outputDir: "DBC",
    fields: [
      { id: "artifactValue", label: "Canais de publicação", type: "async-catalog", scopeConstant: "6", multiple: true, required: true },
      { id: "extractDependencies", label: "Extrair dependências relacionadas?", type: "yesno", options: YES_NO, default: "Yes" },
    ] },

  { id: "extract-mif-invoke-channel", label: "Extrair Canal de Invocação", category: "integration",
    detail: "Extrai um ou mais canais de invocação do MIF.",
    outputDir: "DBC",
    fields: [
      { id: "artifactValue", label: "Canais de invocação", type: "async-catalog", scopeConstant: "8", multiple: true, required: true },
      { id: "extractDependencies", label: "Extrair dependências relacionadas?", type: "yesno", options: YES_NO, default: "Yes" },
    ] },

  { id: "extract-mif-oslc-resources", label: "Extrair Recursos OSLC", category: "integration",
    detail: "Extrai um ou mais recursos OSLC do MIF.",
    outputDir: "DBC",
    fields: [
      { id: "artifactValue", label: "Recursos OSLC", type: "async-catalog", scopeConstant: "9", multiple: true, required: true },
      { id: "extractDependencies", label: "Extrair dependências relacionadas?", type: "yesno", options: YES_NO, default: "Yes" },
    ] },

  { id: "extract-mif-json-resources", label: "Extrair Recursos JSON", category: "integration",
    detail: "Extrai um ou mais recursos JSON do MIF.",
    outputDir: "DBC",
    fields: [
      { id: "artifactValue", label: "Recursos JSON", type: "async-catalog", scopeConstant: "10", multiple: true, required: true },
      { id: "extractDependencies", label: "Extrair dependências relacionadas?", type: "yesno", options: YES_NO, default: "Yes" },
    ] },

  { id: "extract-person-groups", label: "Extrair Grupos de Pessoas", category: "security",
    detail: "Extrai um ou mais Person Groups.",
    outputDir: "person_groups",
    fields: [{ id: "groups", label: "Grupos de pessoas", type: "catalog", catalog: "personGroups", multiple: true, required: true }] },

  { id: "extract-presentation", label: "Extrair Apresentação", category: "apps",
    detail: "Extrai o XML de apresentação de uma ou mais aplicações.",
    outputDir: "presentations",
    fields: [
      { id: "xmlVersion", label: "Versão do XML", type: "select", default: "original", options: [{ label: "Original", value: "original" }, { label: "Alterações", value: "changes" }] },
      { id: "app", label: "Aplicações", type: "catalog", catalog: "apps", multiple: true, required: true },
    ] },

  { id: "extract-relationships", label: "Extrair Relacionamentos", category: "db",
    detail: "Extrai relacionamentos de um objeto pai.",
    outputDir: "tables",
    fields: [
      { id: "parentObject", label: "Objeto pai", type: "catalog", catalog: "objects", required: true },
      { id: "relationships", label: "Relacionamentos", type: "catalog", catalog: "relationshipsByObject", scopedBy: "parentObject", multiple: true, hint: "Deixe em branco para extrair todos os relacionamentos do objeto." },
    ] },

  { id: "extract-security-group", label: "Extrair Grupo de Segurança", category: "security",
    detail: "Extrai um ou mais grupos de segurança.",
    outputDir: "DBC",
    fields: [{ id: "groups", label: "Grupos de segurança", type: "catalog", catalog: "securityGroups", multiple: true, required: true }] },

  { id: "extract-signature-options", label: "Extrair Opções de Assinatura", category: "apps",
    detail: "Extrai opções de assinatura (sigoptions) de uma aplicação.",
    outputDir: "DBC",
    fields: [
      { id: "app", label: "Aplicação", type: "catalog", catalog: "apps", required: true },
      { id: "sig", label: "Opções de assinatura", type: "catalog", catalog: "sigOptions", multiple: true, required: true },
    ] },

  { id: "extract-start-center", label: "Extrair Start Center", category: "apps", beta: true,
    detail: "Extrai um ou mais Start Centers.",
    outputDir: "DBC",
    fields: [
      { id: "template", label: "Template de Start Center", type: "catalog", catalog: "startCenters", required: true },
      { id: "groups", label: "Grupos de pessoas", type: "catalog", catalog: "personGroups", multiple: true, required: true },
    ] },

  { id: "extract-system-properties", label: "Extrair Propriedades do Sistema", category: "system",
    detail: "Extrai uma ou mais propriedades do sistema.",
    outputDir: "system_properties",
    fields: [{ id: "props", label: "Propriedades", type: "catalog", catalog: "systemProperties", multiple: true, required: true }] },

  { id: "extract-tables", label: "Extrair Tabelas", category: "db",
    detail: "Extrai uma ou mais tabelas, junto com relacionamentos e índices.",
    outputDir: "tables",
    fields: [
      { id: "tables", label: "Tabelas", type: "catalog", catalog: "objects", multiple: true, required: true },
      { id: "extractDomain", label: "Extrair domínio dos atributos?", type: "yesno", options: YES_NO, default: "Yes" },
    ] },

  { id: "extract-messages", label: "Extrair Mensagens", category: "comms",
    detail: "Extrai mensagens de um grupo específico.",
    outputDir: "DBC",
    fields: [
      { id: "group", label: "Grupo de mensagens", type: "catalog", catalog: "messageGroups", required: true },
      { id: "keys", label: "Chaves de mensagem", type: "catalog", catalog: "messageKeysByGroup", scopedBy: "group", multiple: true, hint: "Deixe em branco para extrair todas as mensagens do grupo." },
    ] },

  { id: "extract-workflow", label: "Extrair Workflow", category: "automation",
    detail: "Extrai um processo de workflow específico.",
    outputDir: "DBC",
    fields: [
      { id: "process", label: "Processo", type: "catalog", catalog: "workflows", required: true },
      { id: "revision", label: "Revisão", type: "revision", scopedBy: "process", hint: "deixe em branco para a mais recente" },
      { id: "subprocess", label: "Extrair subprocessos?", type: "yesno", options: YES_NO, default: "Yes" },
    ] },

  { id: "generate-dbc-autoscript", label: "Gerar DBC de Automação", category: "automation",
    detail: "Converte todos os scripts da pasta local autoscripts em um único arquivo .dbc.",
    outputDir: "DBC", fields: [] },

  { id: "generate-new-ticket", label: "Gerar Novo Ticket", category: "ticket",
    detail: "Cria a estrutura de pastas do projeto para um novo ticket.",
    fields: [{ id: "ticketNumber", label: "Número do ticket", type: "text", required: true, placeholder: "ex.: MDS-1050" }] },

  { id: "generate-package", label: "Gerar Pacote", category: "ticket",
    detail: "Cria o pacote completo com todos os artefatos para instalação.",
    outputDir: "install",
    fields: [
      { id: "os", label: "Sistema operacional de destino", type: "select", default: "linux", options: [{ label: "Linux", value: "linux" }, { label: "Windows", value: "windows" }] },
      { id: "includeDoc", label: "Incluir documentação técnica?", type: "yesno", options: YES_NO, default: "Yes" },
      { id: "includeAutoscript", label: "Incluir DBC de automação?", type: "yesno", options: YES_NO, default: "Yes" },
      { id: "includeDiff", label: "Incluir diferenças de tela?", type: "yesno", options: YES_NO, default: "Yes" },
      { id: "includeReport", label: "Incluir relatórios?", type: "yesno", options: YES_NO, default: "Yes" },
      { id: "language", label: "Idioma do pacote", type: "select", default: "en", options: [{ label: "Português (BR)", value: "pt-BR" }, { label: "Inglês", value: "en" }] },
    ] },

  { id: "generate-presentation-diff", label: "Gerar Diferença de Apresentação", category: "apps",
    detail: "Cria arquivos .mxs a partir das pastas presentations/original e presentations/changes.",
    outputDir: "presentations",
    fields: [{ id: "apps", label: "Aplicações", type: "catalog", catalog: "apps", multiple: true, filterToExtracted: true, hint: "Só aparecem apps já extraídos neste ticket. Deixe em branco para incluir todos." }] },

  { id: "generate-tech-document", label: "Gerar Documento Técnico", category: "ticket",
    detail: "Gera a documentação técnica do projeto a partir do ticket ativo.",
    outputDir: "documentation", fields: [] },

  { id: "import-birt-reports", label: "Importar Relatórios BIRT", category: "reports",
    detail: "Importa um relatório BIRT específico para a aplicação indicada.",
    outputDir: "reports",
    fields: [
      { id: "ticket", label: "Ticket", type: "context-ticket" },
      { id: "app", label: "Aplicação", type: "catalog", catalog: "apps", required: true },
      { id: "report", label: "Relatório", type: "catalog", catalog: "reports", required: true },
    ] },

  { id: "run-script-file", label: "Executar .dbc/.sql no Maximo", category: "ticket",
    detail: "Executa o arquivo .dbc/.sql selecionado dentro do container do MDS.",
    fields: [{ id: "file", label: "Arquivo .dbc/.sql", type: "file", required: true, fileExtensions: ["dbc", "sql"] }] },

  { id: "update-autoscript", label: "Atualizar Script de Automação", category: "automation",
    detail: "Envia a versão local de um script de automação para o ambiente.",
    /* The input is the *local* .py file being sent up — which is what the detail
       above always described — not a script picked from the environment's
       catalog. Shaped like validate-dbc-file/run-script-file so the IDE
       toolbar's "Atualizar Script de Automação" can act on the open tab by the
       same rule as the other two current-file actions. */
    fields: [{ id: "file", label: "Script de automação", type: "file", required: true, fileExtensions: ["py"] }] },

  { id: "update-remote-ticket", label: "Atualizar Ticket Remoto", category: "ticket",
    detail: "Sincroniza o projeto inteiro do ticket ativo com o repositório remoto.", fields: [] },

  { id: "validate-dbc-file", label: "Validar Arquivo DBC", category: "ticket",
    detail: "Valida um ou mais arquivos .dbc já gerados e reporta os erros encontrados.",
    actionLabel: "Validar Selecionados",
    fields: [{ id: "file", label: "Arquivos .dbc", type: "file", required: true, fileExtensions: ["dbc"], multiple: true }] },
];

/* Client, environment, ticket, activity and connection seeds moved to
   mockData.ts — this file stays the task catalog and the mock Maximo/MAS
   lookups. Import them from "@/lib/mockData". */
