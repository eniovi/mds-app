"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Trans } from "react-i18next";
import { isTextFile, languageFor, binaryLabel, extOf } from "@/lib/file-content";
import { useLanguage } from "@/lib/useLanguage";

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.Editor), {
  ssr: false,
  loading: () => <MonacoLoading />,
});

function MonacoLoading() {
  const { t } = useLanguage();
  return <div className="ide-editor-empty">{t("ideToolbar.loadingEditor")}</div>;
}

interface CodeEditorPaneProps {
  path: string | null;
  content: string;
  onChange: (value: string) => void;
}

/** monaco's theming API needs literal hex, not CSS custom properties — these
 * mirror --dark-bg-1 (#160B2E), --dark-bg-2 (#211440) and --brand-teal
 * (#32B9BF) from globals.css, the same dark "control room" surface already
 * used by the task execution console. `monaco` is typed loosely here since
 * this project doesn't have monaco-editor's own type package installed
 * (@monaco-editor/react loads the engine from its CDN loader at runtime). */
function defineMdsTheme(monaco: any) {
  monaco.editor.defineTheme("mds-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#160B2E",
      "editor.foreground": "#E9E4F5",
      "editorLineNumber.foreground": "#5B4E78",
      "editorLineNumber.activeForeground": "#32B9BF",
      "editor.selectionBackground": "#6025A566",
      "editorCursor.foreground": "#32B9BF",
      "editor.lineHighlightBackground": "#211440",
      "editorGutter.background": "#160B2E",
    },
  });
}

export function CodeEditorPane({ path, content, onChange }: CodeEditorPaneProps) {
  const { t } = useLanguage();
  if (!path) {
    return (
      <div className="ide-editor-empty" data-od-id="ide-editor-empty">
        {t("ideToolbar.selectFileToOpen")}
      </div>
    );
  }

  if (!isTextFile(path)) {
    return (
      <div className="ide-editor-empty" data-od-id="ide-editor-binary">
        {t("ideToolbar.noTextPreview", { kind: binaryLabel(path, t), ext: extOf(path) })}
        <br />
        <Trans i18nKey="ideToolbar.downloadPackage" components={{ tickets: <Link href="/tickets" />, environments: <Link href="/environments" /> }} />
      </div>
    );
  }

  return (
    <MonacoEditor
      key={path}
      height="100%"
      language={languageFor(path)}
      theme="mds-dark"
      value={content}
      beforeMount={defineMdsTheme}
      onMount={(editor) => {
        // monaco measures its container inside create(); the pane is already at
        // its final flex size by then, so the ResizeObserver behind
        // automaticLayout never fires and the editor stays at its 5px fallback
        // rendering nothing. One explicit layout on mount (plus one after the
        // next frame, for the case where the flex height lands a tick later)
        // is what actually gets the file on screen. Re-runs per file because
        // key={path} remounts the editor on every tab switch.
        editor.layout();
        requestAnimationFrame(() => editor.layout());
      }}
      onChange={(value) => onChange(value ?? "")}
      options={{
        fontSize: 13,
        minimap: { enabled: false },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: "on",
        padding: { top: 12 },
      }}
    />
  );
}
