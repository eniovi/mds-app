/** Everything needed to show a generated MDS artifact inside a code editor:
 * which files are text-previewable, what Monaco language to use, and a
 * deterministic, clearly-labelled mock body for text files (there's no real
 * backend yet — see resolveOutputPath in task-form.ts for how the path itself
 * is derived from the real MDS directory layout). */

type TFunc = (key: string, options?: Record<string, unknown>) => string;

const TEXT_EXTENSIONS = new Set(["dbc", "py", "mxs", "sql", "xml"]);

export function extOf(path: string): string {
  const idx = path.lastIndexOf(".");
  return idx === -1 ? "" : path.slice(idx + 1).toLowerCase();
}

export function baseName(path: string): string {
  const idx = path.lastIndexOf("/");
  return idx === -1 ? path : path.slice(idx + 1);
}

export function isTextFile(path: string): boolean {
  return TEXT_EXTENSIONS.has(extOf(path));
}

const SIZE_BASE_BY_EXT: Record<string, number> = {
  dbc: 8000,
  py: 2000,
  mxs: 4000,
  zip: 400000,
  docx: 60000,
  rptdesign: 30000,
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic mock size in bytes — same path always reports the same size,
 * so it doesn't look like it's silently changing on every render. There's no
 * real filesystem yet; this stands in for a real `stat()` call. */
export function mockFileSize(path: string): number {
  const base = SIZE_BASE_BY_EXT[extOf(path)] || 5000;
  return base + (hashString(path) % base);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

const LANGUAGE_BY_EXT: Record<string, string> = {
  dbc: "xml",
  mxs: "xml",
  xml: "xml",
  py: "python",
  sql: "sql",
};

export function languageFor(path: string): string {
  return LANGUAGE_BY_EXT[extOf(path)] || "plaintext";
}

const BINARY_KIND_BY_EXT: Record<string, string> = {
  zip: "zip",
  docx: "docx",
  rptdesign: "rptdesign",
};

/** Names the kind of binary the editor can't preview. It gets interpolated
 * into the translated ideToolbar.noTextPreview sentence, so it has to be
 * translated too — a PT noun inside an EN sentence reads as a bug. */
export function binaryLabel(path: string, t: TFunc): string {
  return t(`ideToolbar.binaryKind.${BINARY_KIND_BY_EXT[extOf(path)] || "default"}`);
}

export interface FileContext {
  taskLabel?: string;
  ticketId?: string;
  generatedAt?: string;
}

function header(path: string, commentOpen: string, commentClose: string, ctx: FileContext): string {
  const when = ctx.generatedAt ? new Date(ctx.generatedAt).toLocaleString("pt-BR") : "—";
  return `${commentOpen} Prévia gerada pelo MDS · ${ctx.taskLabel || baseName(path)} · ticket ${ctx.ticketId || "—"} · ${when}${commentClose}\n`;
}

/** Deterministic mock body — same path always renders the same content, so
 * reopening a file doesn't look like it silently changed. */
export function generateMockContent(path: string, ctx: FileContext = {}): string {
  const ext = extOf(path);
  const name = baseName(path);

  if (ext === "dbc" || ext === "xml") {
    return (
      header(path, "<!-- ", " -->", ctx) +
      `<DBC_Container xmlns="http://www.ibm.com/maximo" creationDateTime="${ctx.generatedAt || ""}">\n` +
      `  <Table name="MAXOBJECT">\n` +
      `    <update primaryKey="OBJECTNAME">\n` +
      `      <field name="OBJECTNAME">SOURCE_OBJECT</field>\n` +
      `      <field name="DESCRIPTION">Extraído via ${ctx.taskLabel || "MDS"}</field>\n` +
      `    </update>\n` +
      `  </Table>\n` +
      `  <!-- ${name}: edite com cuidado — este é o artefato que será aplicado no ambiente. -->\n` +
      `</DBC_Container>\n`
    );
  }

  if (ext === "py") {
    return (
      header(path, "# ", "", ctx) +
      `def initialize(context):\n` +
      `    """Automation script extraído pelo MDS — ${name}."""\n` +
      `    mbo = context.get("mbo")\n` +
      `    if mbo is None:\n` +
      `        return\n` +
      `    # TODO: lógica original do script vai aqui.\n` +
      `    mbo.setValue("STATUS", "READY")\n`
    );
  }

  if (ext === "mxs") {
    return (
      header(path, "<!-- ", " -->", ctx) +
      `<presentation id="${name.replace(/\.mxs$/, "")}">\n` +
      `  <screen name="MAIN">\n` +
      `    <!-- diferenças de tela aplicadas via ${ctx.taskLabel || "MDS"} -->\n` +
      `  </screen>\n` +
      `</presentation>\n`
    );
  }

  if (ext === "sql") {
    return (
      header(path, "-- ", "", ctx) +
      `SELECT *\n  FROM maximo.workorder\n WHERE status = 'WAPPR';\n`
    );
  }

  return header(path, "# ", "", ctx) + "(sem pré-visualização de conteúdo para este tipo de arquivo)\n";
}
