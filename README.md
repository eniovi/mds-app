# MDS — painel de menus (Next.js)

Consolidação do protótipo (`../login.html`, `../home.html`, `../tickets.html`) em um
projeto Next.js real, com rotas navegáveis, componentes TypeScript e o mesmo design
system da Maxinst (`../brand-spec.md`).

## Rodando localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000` — o login (`/login`) leva à seleção de cliente (`/clients`).

## Hierarquia da navegação

O app inteiro abaixo do login é escopado por **Cliente → Ticket → Tarefas**:

```
/login  →  /clients  →  /tickets  →  /  (painel de tarefas)  →  /files · /run-queue
           (escolhe      (tickets     (tarefas do ticket ativo)
            o cliente)     daquele
                           cliente)
```

`lib/workspace-context.tsx` é o dono dessa hierarquia. Escolher um cliente estreita
de uma vez a lista de tickets, o módulo de ambientes e o painel de atividades — nenhuma
tela precisa redescobrir "em que cliente eu estou". Cair em qualquer rota interna sem
cliente escolhido (sessão nova, storage limpo, link direto) redireciona para `/clients`
(guarda no `AppShell`).

Cliente e ticket também trocam **sem sair da tela**, pelos dois seletores no cabeçalho
global (`components/ContextSwitcher.tsx`).

## Rotas

| Rota | Tela |
|---|---|
| `/login` | Login com conta Microsoft (sem seleção de ambiente — isso agora vive no ticket) |
| `/clients` | Seleção de cliente — grid de cards com busca, contagem de tickets e ambientes |
| `/` | Painel de tarefas do ticket ativo (as 44 tasks do MDS em 9 categorias) |
| `/tickets` | Tickets do cliente ativo — status, responsável (avatar + papel), ambiente, criado/atualizado |
| `/environments` | CRUD de ambientes **do cliente ativo** — cadastrar, editar, remover (com confirmação destrutiva) e testar conexão |
| `/files` | IDE de arquivos do ticket ativo — árvore de diretórios + editor Monaco em tela dividida, com a barra de ações (Salvar, Validar DBC, Executar, Atualizar Script, Gerar DBC) |
| `/run-queue` | Fila de execução — seleciona arquivos gerados por checkbox, ordena por arquivo ou por pasta inteira (drag-and-drop + setas), executa tudo em sequência |

## Estrutura

```
src/
  app/
    layout.tsx        # fontes (next/font), metadata
    globals.css        # tokens de marca + todos os estilos das telas
    page.tsx            # painel de tarefas ("/")
    login/page.tsx
    clients/page.tsx      # seleção de cliente — porta de entrada da hierarquia
    tickets/page.tsx
    environments/page.tsx
    files/page.tsx
    run-queue/page.tsx
  components/
    icons/               # ContinuityMark, MicrosoftLogo, CatIcon, GripIcon, ArrowIcon…
    fields/              # FieldRow, Combobox, YesNo — formulário genérico por tarefa
    TopBar.tsx, Sidebar.tsx, TaskCard.tsx, TaskDrawer.tsx, RunStatusBadge.tsx
    NewTicketModal.tsx, NewEnvironmentModal.tsx, UserDropdownMenu.tsx
    ide/                  # FileTree, SplitPane, EditorTabs, CodeEditorPane (Monaco), ActionToolbar, FileListTable
    queue/                 # FileSourceList, IndeterminateCheckbox, ExecutionQueue
    BatchActionBar.tsx, BatchRunDrawer.tsx  # seleção em lote + execução sequencial com relatório de sucesso/falha
    ErrorLogBlock.tsx, RunErrorModal.tsx, RunHistoryTable.tsx  # detalhe/histórico de erros de execução
  lib/
    types.ts             # Task, TaskField, Ticket, Environment, RunRecord…
    mds-data.ts           # catálogo de 36 tarefas (com outputDir real) + catálogos mock do Maximo/MAS + ambientes seed
    task-form.ts           # validação, preview de comando, resolveOutputPath (diretório real do artefato)
    file-tree.ts, file-content.ts, useFileEdits.ts  # árvore de arquivos + preview de conteúdo + edições salvas
    useGeneratedFiles.ts   # fonte única "quais arquivos existem no workspace do ticket" (usada por /files e /run-queue)
    queue-order.ts          # reordenação pura: por item, por grupo de diretório, por drag-and-drop
    session-context.tsx   # SessionProvider/useSession — identidade global do usuário
    storage.ts, useActiveTicket.ts, useEnvironments.ts, format.ts
```

## O que ainda é simulado

- **Todos os dados de sessão** (`lib/mockData.ts`): 3 clientes, 2–3 ambientes por cliente
  (misturando IBM Maximo 7.6 e IBM MAS), 3–4 tickets por cliente com responsável nomeado
  (`Person`: nome, iniciais e papel) e 15 eventos de atividade recente. É a fonte de onde
  toda tela hidrata num cold start, antes do localStorage assumir. `mds-data.ts` ficou só
  com o catálogo de tarefas e os catálogos mock do Maximo — quem usa a aplicação e sobre o
  quê agora mora em `mockData.ts`. Os timestamps das atividades são offsets do carregamento
  do módulo, não datas fixas, para o painel continuar parecendo um feed vivo numa demo
  feita daqui a três meses.
- **Painel de Atividades Recentes** (`components/RecentActivityRail.tsx`, `lib/activity.ts`):
  saiu do rodapé do painel de tarefas e virou um trilho lateral esquerdo logo abaixo do
  cabeçalho, recolhível (estado por usuário, em localStorage). Mostra ícone de status,
  ação, arquivo/objeto tocado, ticket, usuário e hora relativa. As execuções reais do
  usuário são projetadas para o mesmo formato e entram **na frente** do histórico semeado —
  o trilho reage ao vivo ao que se executa e mesmo assim nunca aparece vazio numa demo.
  Fica fora só de `/files`: `.ide-page` é uma superfície de altura total e uma terceira
  coluna estrangularia o split pane.

- **Login**: não chama o Entra ID de verdade — só demonstra o fluxo visual.
- **Catálogos do Maximo/MAS** (`lib/mds-data.ts` → `MDS_CATALOG`): apps, objetos, scripts,
  workflows etc. são listas fixas. Trocar por uma chamada OSLC/REST real ao ambiente
  conectado é o próximo passo natural — o formulário genérico (`FieldRow`/`Combobox`) já
  está pronto para receber dados assíncronos, só falta trocar `mdsCatalogFor` por um fetch.
- **Campos de arquivo** (`type: "file"` em `mds-data.ts`, ex.: "Validar Arquivo DBC",
  "Executar .dbc/.sql no Maximo", "Aplicar Diferença de Apresentação"): não são mais
  texto livre — `components/fields/FilePickerField.tsx` mostra uma DataTable com busca dos
  arquivos já gerados no ticket (mesma fonte de `/files` e `/run-queue`,
  `useGeneratedFiles`), com filtro opcional por extensão (`fileExtensions` no `TaskField`)
  e o `.ds-empty-state` padrão quando o ticket ainda não gerou nenhum arquivo do tipo
  esperado. `.ds-empty-state` ficou como o padrão reutilizável — as outras telas
  (`.dir-empty`, `.queue-empty`, `.empty-state` na home) ainda usam variações mais antigas
  e são candidatas a migrar para ele numa limpeza futura.
- **Apps "extraídos" no seletor de "Gerar Diferença de Apresentação"** (`filterToExtracted`
  no `TaskField`, `lib/extracted-apps.ts`): `TaskDrawer` agora grava um snapshot dos valores
  do formulário em cada `RunRecord` (`fieldValues`). `extractedApps()` varre o histórico do
  ticket e junta os valores de qualquer campo `catalog: "apps"` de uma execução bem
  sucedida — não é uma lista fixa nem um chute; se nenhuma tarefa que toca um app rodou
  ainda, o Combobox mostra 0 opções e o badge fica `badge-warning`, honesto sobre o estado
  real do workspace.
- **Revisão de workflow cascata** (`type: "revision"` em "Extrair Workflow",
  `components/fields/RevisionSelect.tsx`, `MDS_WORKFLOW_REVISIONS` em `mds-data.ts`): campo
  "Revisão" fica desabilitado (`:disabled` nativo, mesmo estilo usado em toda a base) até
  "Processo" ser escolhido — o reset automático já existia (`TaskDrawer` já limpa qualquer
  campo `scopedBy` quando o campo que o escopa muda). Cada opção mostra o número da revisão
  com um badge de status (Ativa/Success, Habilitada/Info, Inativa/Muted). O token `--info`
  é novo — o Manual da Marca só define Success/Warning/Error para badges e proíbe
  explicitamente reusar o teal da marca em badges de status (§8.8); "Habilitada" precisava
  de uma cor própria, então adicionei um azul dedicado em vez de violar essa regra.
- **Artefatos MIF (categoria Integração)** (`type: "async-catalog"` + `scopeConstant`,
  `components/fields/AsyncCatalogField.tsx`, `lib/mif-artifacts.ts`): são **9 tarefas, uma
  por tipo de artefato** (Estrutura de Objeto, End Point, Web Service, Enterprise Service,
  Sistema Externo, Canal de Publicação, Canal de Invocação, Recursos OSLC, Recursos JSON).
  Antes era uma tarefa única "Extrair Objetos MIF" com uma faixa de abas (`type: "tabs"`)
  para escolher o tipo dentro do formulário; o tipo agora é o próprio cartão, então o
  drawer abre direto no seletor de artefato. Cada tarefa fixa seu tipo MIF em
  `scopeConstant` (as mesmas chaves numéricas de antes — 7 não existe no Maximo), e é isso
  que alimenta `fetchArtifactNames`. O campo de artefato é um Combobox assíncrono que
  "consulta o Maximo" (`setTimeout` simulando latência real) e mostra `.ds-skeleton`
  (canônico) enquanto carrega, com guarda de condição de corrida (`requestId`).
  Reaproveita a mesma interação de busca/chips do Combobox síncrono. `TabsField.tsx` e o
  `FieldType` `"tabs"` continuam no projeto mas nenhuma tarefa os usa hoje — o `.ds-tabs`
  em si segue em uso na fila de execução (abas Fila / Histórico).
- **"Validar Arquivo DBC"** (`task.actionLabel`, `primaryMultiFieldCount` em `task-form.ts`):
  virou seleção múltipla (`multiple: true`) na mesma `FilePickerField` — o botão principal do
  `TaskDrawer` agora lê `task.actionLabel` ("Validar Selecionados" em vez do "Executar"
  genérico) e mostra a contagem ao vivo do primeiro campo `multiple + required`, ficando
  desabilitado em 0 sem esperar uma primeira tentativa inválida. Fica restrito a campos
  `required` de propósito — campos multi-seleção opcionais (ex.: "apps" em "Gerar Diferença
  de Apresentação", onde vazio significa "todos") continuam sem contagem/sem essa trava,
  para não reportar errado o que deixar em branco faz. A tabela ganhou a coluna "Tamanho"
  (`mockFileSize`/`formatFileSize` em `file-content.ts` — mesmo padrão de dado determinístico
  e claramente simulado já usado no conteúdo dos arquivos).
- **Modal "Cadastrar ambiente"** (`components/NewEnvironmentModal.tsx`): ganhou `.ds-alert`
  (canônico, reaproveita os tokens `--info`/`--info-surface` já criados para o badge
  "Habilitada" em vez de uma quarta cor para o mesmo significado), `.ds-form-grid` de 2
  colunas (também canônico), campos "Usuário do Banco" e "Senha do Banco" (com botão de
  mostrar/ocultar, `.ds-password-toggle`), e "Versão do Maximo" virou `.ds-radio-group` de
  verdade (`accent-color`, mesma técnica do `.ds-checkbox`) em vez de texto livre. **Nota
  de decisão:** o brief pediu esses dois campos de credencial no mesmo formulário cujo
  alerta diz "nunca aqui" sobre credenciais — mantive os dois pedidos literalmente (o campo
  existe, com toggle, do jeito especificado), mas `dbUser`/`dbPassword` ficam só no estado
  local do modal e nunca entram no objeto passado a `onCreate`, nem no tipo `Environment`
  — assim o alerta continua verdadeiro. Se o time quiser que a senha realmente vá a algum
  lugar (ex.: só para copiar um trecho de `.credentials.env`), isso é uma decisão de produto
  que vale confirmar antes de mudar esse comportamento.
- **Execução de tarefa** (`TaskDrawer`): o console e o "arquivo gerado" são simulados com
  `setInterval`. Em produção isso vira uma chamada real ao backend/container `mds`
  (streaming de log via SSE ou WebSocket seria o caminho natural).
- **Tickets e Ambientes**: persistidos em `localStorage`, não em um backend.
- **Arquivos gerados**: a tela `/files` lê do histórico de execuções (`mds_run_history`)
  em vez de um filesystem real — quando a execução virar uma chamada real ao container,
  essa tela passa a listar o conteúdo real da pasta do ticket.
- **Conteúdo dos arquivos no editor** (`lib/file-content.ts`): como não há backend, cada
  arquivo abre com um corpo gerado deterministicamente (mesmo path → mesmo conteúdo),
  claramente identificado no cabeçalho como prévia. Arquivos binários (`.zip`, `.docx`,
  `.rptdesign`) não tentam simular conteúdo de texto — mostram um aviso em vez disso.
  Edições ficam em `localStorage` (`mds_file_edits`), sobrevivem a reload.

## Notas de implementação

- Todo componente com estado/efeitos tem `"use client"` — o App Router do Next.js
  assume Server Components por padrão.
- Nenhum acesso a `localStorage` acontece no valor inicial de `useState`; sempre em
  `useEffect`, para não quebrar a renderização no servidor nem gerar hydration mismatch.
- CSS é um único `globals.css` com classes simples (sem CSS-in-JS/Tailwind) para ficar
  o mais próximo possível do protótipo aprovado — uma extração para CSS Modules por
  página é uma limpeza razoável para uma próxima iteração, se o time preferir.
- **Identidade do usuário é global**: `lib/session-context.tsx` (`SessionProvider`/`useSession`)
  é montado uma única vez em `app/layout.tsx` e consumido por `components/UserDropdownMenu.tsx`
  — o mesmo componente, com o mesmo estado, em todas as telas autenticadas (`TopBar` e os
  cabeçalhos de `/tickets`, `/environments`, `/files`). Nenhuma tela reimplementa o menu por
  conta própria; trocar a fonte do usuário (mock → auth real) é uma mudança só em
  `session-context.tsx`.
- **Editor de código** (`/files`): usa `@monaco-editor/react`, que por padrão carrega o
  Monaco de um CDN (jsdelivr) em runtime — não precisa empacotar o `monaco-editor` inteiro
  no bundle. O `Editor` é importado via `next/dynamic` com `ssr: false` porque o Monaco só
  roda no browser. Não consegui rodar `npm install`/`next build` neste ambiente (sem rede) —
  vale essa checagem localmente antes de considerar a tela pronta.
- **Reordenação da fila** (`/run-queue`): drag-and-drop é HTML5 nativo (`draggable` +
  `onDragStart`/`onDragOver`/`onDrop`), não `@dnd-kit` — mesma restrição de rede acima me
  fez evitar mais uma dependência nova. Todo item também tem botões de subir/descer, que
  além de cobrirem quem não usa mouse são o que garante a fila operável por teclado (drag
  sozinho não seria). Se o time preferir animações mais suaves de reordenação, trocar por
  `@dnd-kit/sortable` é direto — a lógica pura de reordenação já está isolada em
  `lib/queue-order.ts`, só a camada de eventos de arrastar muda.
- **Ambiente inline no ticket** (`/tickets`): a página foi renomeada de "Tickets e
  Workspace" para só "Tickets" (label do menu e `<h1>`). O painel do ticket ativo ganhou
  um seletor de ambiente inline (`components/EnvironmentTagPopover.tsx`): a Tag mostra
  nome + badge de tipo (PROD/QA/DEV) e, tanto clicar nela quanto no botão "Alterar
  Ambiente", abre o mesmo popover — trocar o ambiente ali atualiza `ticket.env` na hora,
  sem passar pela tela `/environments`. O mapeamento tipo→badge (`environmentKindMeta`)
  foi extraído para `lib/environment-meta.ts` e agora é a única fonte usada tanto por
  `/environments` quanto por esse popover, pra não haver duas definições divergentes do
  que "PROD" vira visualmente. Na tabela de tickets, a coluna Ambiente ficou só leitura
  (mostra nome + badge, sem abrir popover) — trocar o ambiente de um ticket que não é o
  ativo continua exigindo selecioná-lo primeiro; isso é intencional, para não haver dois
  pontos de edição simultânea do mesmo dado na mesma tela.
- **Executar/Validar — arquivo corrente vs. lote** (`/files`): a Action Toolbar do editor
  ganhou os botões `Executar Arquivo Corrente` (PlayIcon) e `Validar Arquivo Corrente`
  (CheckCircleIcon), sempre restritos à aba ativa — já existiam antes com nomes/ícones
  diferentes, só renomeados/reiconizados para bater com o padrão pedido. Fora do editor, a
  página ganhou um toggle "Editor" / "Lista de Arquivos" (reaproveita `.ds-tabs`): no modo
  Lista, `FileListTable` mostra só os arquivos `.dbc`/`.sql` do ticket (mesma estrutura de
  colunas Arquivo/Data de geração/Tamanho de `FilePickerField`, mas como tela própria, não
  dentro de um formulário) com checkboxes; assim que 1+ está marcado, `BatchActionBar`
  aparece no topo da tabela com `Validar Selecionados (N)` e `Executar Selecionados no
  Maximo (N)`. O N de "Validar" conta só os `.dbc` selecionados (Maximo não valida `.sql`
  solto do jeito que valida um pacote `.dbc`) — selecionar só `.sql` deixa esse botão
  desabilitado em "(0)", mas "Executar" continua contando os dois.
  Progresso individual por item (pedido explícito do brief) reaproveita o que já existia
  em `QueueRunDrawer`: esse componente foi generalizado para `BatchRunDrawer.tsx`, agora
  recebendo a `Task` (validar ou rodar) em vez de vir fixo em "run-script-file" — tanto a
  fila de execução quanto essa ação em lote nova mostram o mesmo drawer com uma linha de
  console por arquivo e um badge "N/total", em vez de duas implementações quase iguais.
- **Relatório de execução, histórico e persistência local** (`/run-queue`): três pedidos
  do mesmo brief, todos resolvidos em cima do que já existia.
  - *Nada é deletado ao executar*: já era verdade antes desta ticket — `run-script-file` e
    `validate-dbc-file` nunca tiveram `outputDir`, então nunca alteraram `filesByDir`.
    O que faltava era deixar isso visível: `/run-queue` agora mostra um aviso discreto
    ("Os arquivos permanecem no workspace...") acima da fila, só texto + `InfoIcon`, sem
    o peso visual de um `.ds-alert` — o brief pede "discreto", não um banner.
  - *Falha simulada, determinística*: como nunca existiu um caminho de erro real,
    `lib/mock-errors.ts` decide sucesso/falha por hash do path do arquivo (mesmo padrão
    de `mockFileSize`) — o mesmo arquivo sempre falha ou sempre passa, então uma falha é
    reproduzível para captura de tela em vez de aparecer aleatoriamente. As mensagens de
    erro simulam o formato real de erro do Maximo (código `BMXAA####E` + causa).
  - `BatchRunDrawer` ganhou um "Relatório de Execução" no lugar do antigo card genérico de
    sucesso: contador "X executados com sucesso | Y falhas", uma linha por arquivo com
    `RunStatusBadge`, e nos itens com falha um expansor "Ver Logs de Erro" que revela
    `ErrorLogBlock` — um `<pre>` claro (não o console escuro da execução ao vivo; a regra
    §8.8 já estabelecida reserva o tratamento escuro pro momento operacional, não pra um
    resultado já concluído sendo revisado depois).
  - **Histórico de Execuções**: nova aba em `/run-queue` (toggle "Fila"/"Histórico",
    `.ds-tabs`) com `RunHistoryTable` — Data/Hora, Tarefa, Ticket, Usuário, Status, e um
    "Ver Logs de Erro" que abre `RunErrorModal` reaproveitando o mesmo `ErrorLogBlock`.
    Isso expôs que o histórico de runs estava duplicado (a home page e `useGeneratedFiles`
    liam/escreviam "mds_run_history" cada um com seu próprio `useState`, cada um cortando
    em 8 registros de forma independente) — extraí `lib/useRunHistory.ts` como fonte única
    e subi o limite de 8 para 50, porque uma aba "Histórico" com 8 registros no total do
    app inteiro (não por ticket) ficava curta demais pra valer o nome. A "Atividade
    recente" da home continua mostrando só os 8 mais recentes — é uma prévia, não a tela
    de histórico.
  - `RunRecord` ganhou `user` (nome do usuário logado, `MDS_CONNECTION.user`, já setado em
    todo `pushRun`, não só nos em lote) e `errorMessage`.
- **Suporte multi-idioma (PT/EN/ES)**: `react-i18next` + `i18next`
  (`lib/i18n/index.ts`, `lib/i18n/locales/{pt,en,es}.json`), montado via `I18nProvider`
  em `app/layout.tsx` e consumido em todo componente via `lib/useLanguage.ts` (wrapper
  fino sobre `useTranslation` que também persiste a escolha em `localStorage` e chama um
  stub `persistToUserPreferencesApi` — sem backend real neste protótipo, é só o ponto
  isolado onde um `PATCH /api/user/preferences` entraria). O seletor
  (`components/LanguageSelector.tsx`) vive dentro do `UserDropdownMenu`, então está
  disponível em todas as telas autenticadas pelo mesmo componente global de sessão.
  `<html lang>` é sincronizado num `useEffect` (não no render inicial, pra não gerar
  hydration mismatch contra o SSR fixo em "pt"), e `lib/format.ts#formatDateTime` agora
  resolve o locale de data pela mesma tabela (`LOCALE_BY_LANGUAGE`) em vez de fixar
  `pt-BR`. Todo texto de interface passou por `t()`/`<Trans>`. O único texto que fica
  fora de propósito é o kicker de marca "Always running. Always ready." do login, que é
  a mesma tagline em qualquer idioma. Build (`next build`) e `tsc --noEmit` rodaram
  limpos neste ambiente — a checagem de rede que bloqueava isso em turnos anteriores não
  se aplica mais aqui.
- **Tradução do catálogo de tarefas (correção)**: a primeira leva do suporte a idiomas
  tinha deixado de fora o conteúdo de domínio — rótulos de categoria, título/descrição de
  cada uma das 36 tarefas, rótulos/hints/placeholders de campo e labels de opções (select/
  tabs) continuavam em PT mesmo com EN/ES selecionado, porque esses textos vêm de dados
  (`lib/mds-data.ts`), não de `t()` direto. `lib/mds-data.ts` continua sendo a única fonte
  de verdade em português — não duplica conteúdo. `lib/task-catalog-i18n.ts` é a camada de
  tradução: cada resolver (`categoryLabel`, `taskLabel`, `taskDetail`, `taskActionLabel`,
  `fieldLabel`, `fieldHint`, `fieldPlaceholder`, `optionLabel`, `runTaskLabel`) busca a
  chave `catalog.*` correspondente em `en.json`/`es.json` e cai de volta pro texto PT do
  próprio objeto via `defaultValue` do i18next quando a chave não existe — então uma tarefa
  nova em `mds-data.ts` nunca renderiza uma chave i18n crua, só aparece sem tradução até
  alguém preencher o `catalog.tasks.<id>` correspondente. `pt.json` não ganhou o namespace
  `catalog` (seria puro texto duplicado); só `en.json`/`es.json` o têm, com cobertura
  verificada programaticamente contra `MDS_TASKS`/`MDS_CATEGORIES` (36/36 tarefas, todos os
  campos e todas as opções, sem chave faltando nem sobrando). `RunRecord`/`TreeFileEntry`
  já guardavam `taskId` (ou ganharam, no caso do segundo) — histórico de execuções, modal
  de erro e a árvore de arquivos resolvem o nome traduzido da tarefa em tempo de renderização
  a partir do `taskId`, em vez de ficarem congelados no idioma em que a tarefa rodou.
  Os campos `yesno` (Sim/Não) resolvem por `common.yes`/`common.no` — o mesmo par de opções
  é reusado por 9 tarefas diferentes, então não faz sentido duplicá-lo por tarefa+campo.
- **Exceção deliberada — opções de "Tipo de menu" (`extract-menu`) ficam fixas em EN**: os
  `value` desse select (`APPMENU`/`SEARCHMENU`/`APPTOOL`/`ALL`) são os literais que o
  Maximo espera e é isso que `buildCommandPreview`/o `.dbc` realmente usam — o rótulo
  exibido nunca influencia esse valor, então traduzir o texto não quebraria a montagem do
  `.dbc` por si só. Ainda assim, por pedido explícito (as opções mapeiam vocabulário fixo
  do Maximo — que é sempre em inglês no banco —, não texto de interface livre), os 4
  `option.label` em `lib/mds-data.ts` foram escritos direto em inglês ("Action"/"Search"/
  "Tool"/"All"), e `catalog.tasks.extract-menu.fields.menuType` em `en.json`/`es.json` não
  tem `options` — sem entrada no overlay, o resolver cai no `defaultValue` (o label do
  próprio campo), então essas 4 opções aparecem como "Action"/"Search"/"Tool"/"All" em
  PT, EN e ES igualmente. O rótulo do campo em si ("Tipo de menu" → "Menu type"/"Tipo de
  menú") continua traduzindo normalmente — só o texto das 4 opções é fixo. Se outro campo
  de select ligado a um valor fixo do Maximo precisar da mesma regra, o padrão é esse:
  escrever o `option.label` já em inglês na própria task em `mds-data.ts` e não adicionar
  `options` para aquele campo no `catalog` de nenhum idioma.
