/** The "pre/console style" error block the brief asks for, reused by both
 * BatchRunDrawer's per-item "Ver Logs de Erro" expander and the Histórico
 * de Execuções detail modal. Deliberately light (not the dark
 * .console-wrap treatment) — per §8.8 the dark console is reserved for the
 * live execution moment; both places this renders show a *past* result on
 * an otherwise light surface. */
export function ErrorLogBlock({ message }: { message: string }) {
  return (
    <pre className="error-log-block" data-od-id="error-log-block">
      {message}
    </pre>
  );
}
