/** Deterministic failure simulation for batch runs — there's no real Maximo
 * behind this, so "does this file fail?" and "with what error?" are both
 * derived from a hash of the path (same approach as mockFileSize in
 * file-content.ts): the same file always fails or always succeeds, so a
 * screenshot/demo is reproducible instead of flaking on reload. */

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const MOCK_ERRORS: string[] = [
  `BMXAA4123E - Falha ao importar objeto MAXOBJECT.
Atributo "STATUS" não encontrado no domínio ALNDOMAIN especificado (ASSETSTATUS).
Verifique se o domínio foi migrado para este ambiente antes de reimportar o pacote.`,
  `BMXAA4101E - O objeto de negócio não pôde ser salvo.
Violação de constraint UNIQUE na coluna WONUM da tabela WORKORDER.
Um registro com esta chave já existe no ambiente de destino.`,
  `BMXAA9410E - Erro de integração MIF.
Timeout ao aguardar resposta do endpoint de publicação (30000ms excedidos).
Canal: JMSQUEUE — verifique se o listener está ativo no servidor de aplicação.`,
  `BMXAA4032E - Erro de sintaxe no script de automação anexado ao objeto.
Line 14: NameError: name 'mbo' is not defined.
A execução do autoscript foi revertida (rollback) antes da confirmação.`,
  `BMXAA7912E - Falha ao validar o pacote DBC.
O elemento <maximoIntObjName> referencia um objeto de integração inexistente
neste ambiente ("MXAPIWO_CUSTOM"). Gere o DBC novamente após sincronizar os
objetos MIF.`,
];

/** ~1-in-4 files fail — enough that a batch of 4+ reliably demonstrates the
 * failure/report UI without making every run look broken. */
export function shouldFail(path: string): boolean {
  return hashString(path) % 4 === 0;
}

export function mockErrorMessage(path: string): string {
  return MOCK_ERRORS[hashString(path + "#err") % MOCK_ERRORS.length];
}
