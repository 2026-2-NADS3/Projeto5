# Testes — Próxima Etapa (App do Aluno) · E2 Testes e Qualidade

4 testes unitários + 2 testes de integração, em Jest + TypeScript (back-end Node.js + Express).

## Estrutura

```
src/
  app.ts                      API: POST /auth/login, GET /alunos/me/cursos, POST /presencas, GET /presencas/historico
  db.ts                       conexão PostgreSQL (DATABASE_URL)
  middlewares/auth.ts         middleware JWT
  services/presencaService.ts serviço de presença (teste unitário 1)
  utils/participacao.ts       percentual de participação
  utils/qrcode.ts             geração/validação do QR Code (token JWT com prazo)
db/
  migrations/001_init.sql     tabelas, incl. UNIQUE (aluno_id, encontro_id) em presenca
  seed.ts                     dados FICTÍCIOS de teste (2 alunos, 3 cursos, 7 encontros)
prisma/schema.prisma          schema Prisma equivalente à migração SQL
tests/unit/                   testes unitários 1–4
tests/integration/            testes de integração 1–2 (Supertest + banco real)
docker-compose.yml            PostgreSQL de teste na porta 5433
```

## Como rodar

```bash
npm install
docker compose up -d        # sobe o PostgreSQL de teste (porta 5433)
npm test                    # roda todos (unitários + integração)
npm run test:unit           # só unitários (não precisa de banco)
npm run test:integration    # só integração
```

As variáveis ficam em `.env.test` (somente segredos fictícios de teste). As tabelas são
criadas e os dados fictícios inseridos automaticamente antes de cada suíte de integração.

## Testes de integração

| Nº | Cenário | Fluxo |
|---|---|---|
| 1 | Login e consulta de cursos | POST /auth/login → token → GET /alunos/me/cursos (só cursos 1 e 2 da aluna fictícia; nada do outro aluno) |
| 2 | Check-in por QR Code | POST /presencas (201) → repetição (409, 1 linha no banco) → QR expirado (400) → GET /presencas/historico (presença + 25%) |

## Observação para o back-end (Prisma)

A camada de dados usa `pg` (node-postgres) com consultas parametrizadas. O `prisma/schema.prisma`
gera exatamente as mesmas tabelas. Ao migrar as rotas para o Prisma, os testes de integração
não mudam, porque testam a API por HTTP e o resultado no banco. O 409 de presença duplicada
vem da restrição UNIQUE do banco (no Prisma, erro `P2002`).

## Teste de carga (k6)

Arquivos em `carga/`: `teste-carga.js` (script k6 com os cenários normal, pico e estresse),
`rodar-cenario.sh` (executa o cenário, mede CPU/memória e confere presenças duplicadas no banco),
e as saídas de cada execução (`saida-k6-*.txt`, `resultado-*.json`, `recursos-*.txt`, `duplicadas-*.txt`).

```bash
npm run build
npm run seed:carga                         # 500 alunos, 20 cursos, 200 encontros fictícios
ENV_FILE=.env.test npm start &             # API na porta 3000
set -a; . ./.env.test; set +a
./carga/rodar-cenario.sh normal            # 50 VUs, 6 min
./carga/rodar-cenario.sh pico              # 200 VUs, 2,5 min
./carga/rodar-cenario.sh estresse          # opcional: +50 VUs a cada 2 min
```

Com a API em container, acompanhe CPU/memória com `docker stats` em outro terminal.
O 409 do check-in repetido é tratado como resposta esperada (não conta como erro);
a taxa de erro do critério considera só respostas 5xx e timeouts.
