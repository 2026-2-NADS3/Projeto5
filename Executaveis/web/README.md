# Próxima Etapa — Painel administrativo (admin-web)

Painel web da equipe da ONG **Próxima Etapa**, que ajuda jovens de escola pública da periferia de São Paulo a
chegar ao ensino superior. Projeto Interdisciplinar do 3º semestre de ADS da FECAP (Grupo 1, turma 3NAADS).

A solução tem três partes: o **app Android** (alunos), a **API** Node + Express + TypeScript + Prisma e este
**painel web** (equipe da ONG). Alunos nunca usam o painel. A especificação completa — regras, modelo de dados,
endpoints, telas e plano por fases — está no documento **"Módulo Web Administrativo — Documento de Implementação"**.

## O que o painel faz

| Área | O que a equipe faz | Tela |
|---|---|---|
| **Dashboard** | Palestra do dia com atalho para o check-in; indicadores do mês (com filtro de mês); palestras por mês; perfis DISC e RIASEC; ranking do mês (top 10) e geral (top 5) | 9.2 |
| **Alunos** | Busca por nome/e-mail, filtros por status e DISC; detalhe com inscrições, presenças, faltas (justificar), certificados e testes | 9.3, 9.4 |
| **Palestras** | Lista com filtros; cadastro/edição com evento novo ou existente; detalhe com as abas **Inscritos** (e lista de espera), **Presença** (presença manual, encerrar lista, justificar falta), **Grupos DISC** (soft skills) e **Certificados** (liberar em lote) | 9.5 a 9.7 |
| **Check-in** | Pelo celular: escolhe a palestra do dia, lê o QR Code do convite pela câmera e mostra o resultado em cores | 9.8 |
| **Testes de perfil** | Editor das perguntas e alternativas do DISC e do RIASEC | 9.9 |
| **Comunicação** | Mensagens segmentadas (todos, inscritos de uma palestra, letra DISC) com confirmação do nº de destinatários; caixa de dúvidas com resposta e fechamento | 9.10 |

## Como rodar

Requisitos: Node 20+ e npm.

```bash
cp .env.example .env
npm install
npm run dev       # http://localhost:5173
```

Login: conta do Supabase Auth com papel `admin` (veja "Banco de dados: Supabase").

Outros comandos:

```bash
npm test          # testes unitários e de integração (Vitest)
npx oxlint src    # lint
npm run build     # versão de produção em dist/ (inclui checagem de tipos)
npm run preview   # serve o dist/ localmente
```

A câmera do check-in só funciona em **HTTPS** (ou em `localhost`). Para testar no celular durante o
desenvolvimento, use um túnel HTTPS (ex.: `npx localtunnel --port 5173`) ou o deploy.

## Banco de dados: Supabase

O painel lê e grava **direto no Supabase** (o mesmo banco do app Android), com `@supabase/supabase-js`.
Não há dados fictícios na tela: o mock em `src/mocks/` só existe para os testes automatizados.

1. **Uma vez só**, rode `supabase/painel_admin.sql` no SQL Editor do Supabase. Ele só *acrescenta*:
   colunas `vagas` e `lista_encerrada` em `eventos`, tabelas `faltas` e `bloqueios`, regras RLS para o papel
   `admin` e o papel `admin` para a conta do painel. Nada que o app usa é alterado.
2. No `.env`: `VITE_SUPABASE_URL` (Project URL) e `VITE_SUPABASE_ANON_KEY` (chave **publishable/anon**).
   Nunca a `service_role`/`secret`: tudo que começa com `VITE_` vai para o navegador.
3. Entre com uma conta do Supabase Auth que tenha o papel `admin` em `user_roles`. Conta de aluno é recusada.

Como as tabelas do app viram o formato das telas (`src/types/dominio.ts`):

| Tela | Tabela(s) |
|---|---|
| Palestras | `eventos` (cada linha já é uma edição com data; `tipo = EXTERNO` fica fora; `requer_testes` = soft skills) |
| Inscritos | `inscricoes` + `alunos` |
| Check-in / Presença | `presencas` (o QR do convite é o `codigo_ingresso` da inscrição), `faltas`, `bloqueios` |
| Certificados | `certificados` (liberar = gravar a linha com código de validação; o app gera o PDF) |
| Alunos / Dashboard / Ranking | `alunos`, `resultados_teste`, `presencas`, `faltas`, `bloqueios` |
| Comunicação | `notificacoes` ("todos" = 1 linha sem aluno; segmentada = 1 linha por aluno) |

Ainda sem tabela no banco (a tela mostra vazio e avisa ao tentar usar): **dúvidas**, **grupos DISC**,
**lista de espera** e **badges**.

Código: `src/lib/supabase.ts` (cliente), `src/providers/authProvider.ts` (login),
`src/providers/supabase/` (provider + conversões testadas em `mapeamento.test.ts`).

## Testes

| Tipo | Arquivos | O que cobre |
|---|---|---|
| Unitários | `src/regras/*.test.ts`, `src/pages/palestras/*.test.ts` | Regras puras: 72h, pontos e bloqueio, justificativa, certificado único por evento, ranking, grupos DISC, segmentos de mensagem, validação dos testes de perfil |
| Serviço | `src/mocks/servicos.test.ts` | Fluxos sobre os dados fictícios (o roteiro dos testes da API) |
| Integração | `src/mocks/integracao.test.ts` | Pela camada de rotas que as telas usam: **check-in por QR** (gravada, já registrado, QR inválido, não inscrito) e **encerramento de lista** (409 antes do início, faltas geradas, check-in fechado, justificativa, certificados) |

## Deploy

O painel é um site estático (SPA): `npm run build` gera `dist/`, e os dados vêm do Supabase. Não há servidor próprio.

**Vercel** — `vercel.json` já redireciona as rotas para o `index.html` e define cabeçalhos de
segurança, incluindo `Permissions-Policy: camera=(self)` para o check-in. A Vercel serve em HTTPS automaticamente.
Configure as variáveis de ambiente do `.env.example` no painel do projeto.

Variáveis (`.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ROUTER` (`browser` em produção). Tudo que começa com `VITE_` vai para o navegador: **nunca** coloque segredos ali.

## Estrutura

```
src/
  config/resources.ts   as 5 áreas do menu
  types/dominio.ts      contrato dos dados com a API
  regras/               regras de negócio puras + testes
  mocks/                dados fictícios e mock das rotas /admin/*
  providers/            authProvider (login), dataProvider (API), sessão
  hooks/useAcaoAdmin.ts ações que não são CRUD + atualização das listas
  lib/datas.ts          datas no formato brasileiro
  components/ui/        Button, Card, Badge, DataTable, Tabs, Alert, ConfirmDialog, BarChart, form/Field…
  components/layout/    AppLayout, Sidebar, Topbar
  pages/                uma pasta por área (dashboard, alunos, palestras, checkin, testes, comunicacao)
  styles/               tokens.css (cores, fontes, espaçamento) e global.css
```

## Convenções do time

- Do Figma do app vem só o **visual** (cores, formas, componentes); funcionalidades e textos seguem o documento.
- Cor, raio, sombra, fonte ou espaçamento novo entra em `src/styles/tokens.css`, nunca solto num componente.
- Regra de negócio fica em `src/regras/` (pura e testada); a tela só exibe.
- Coleta mínima (LGPD): o painel mostra do aluno só nome, e-mail, situação de faltas e resultados dos testes. Sem CPF.
- Acessibilidade: rótulo visível em todo campo, foco visível, `aria-live` nos avisos, confirmação com `ConfirmDialog`.

## Stack

React 19 · Vite · TypeScript · [Refine](https://refine.dev) v5 (headless) · React Router 7 · CSS Modules ·
lucide-react · `@zxing/browser` (leitura de QR) · Vitest · oxlint.
