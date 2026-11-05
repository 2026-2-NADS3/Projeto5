# Próxima Etapa — Conteinerização com Docker

Ambiente conteinerizado do projeto **Próxima Etapa**, organizado em
micro-arquitetura de três camadas mais um serviço auxiliar de backup.

**UC:** Cloud Native — Entrega 2
**Grupo:** _(preencher com nome e RA dos integrantes)_

---

## 1. Arquitetura

```
                        ┌─────────────────────────┐
     navegador  ──────► │  localhost:8080         │
     do usuário         └────────────┬────────────┘
                                     │
   ══════════════════════════════════╪══════════════════════════════════
    rede Docker: rede_proximaetapa   │   (driver bridge)
   ══════════════════════════════════╪══════════════════════════════════
                                     │
                        ┌────────────▼────────────┐
                        │  web                    │  camada de
                        │  Nginx 1.27-alpine      │  apresentação
                        │  painel administrativo  │
                        │  + proxy reverso /api/  │
                        └────────────┬────────────┘
                                     │  proxy_pass http://api:3000
                                     │  (resolvido pelo DNS da rede)
                        ┌────────────▼────────────┐
                        │  api                    │  camada de
                        │  Node 22 + Express      │  aplicação
                        │  porta interna 3000     │
                        └────────────┬────────────┘
                                     │  DB_HOST=db
                                     │
                        ┌────────────▼────────────┐
                        │  db                     │  camada de
                        │  PostgreSQL 16-alpine   │  dados
                        │  sem porta publicada    │
                        └────────────┬────────────┘
                                     │  pg_dump via db:5432
                        ┌────────────▼────────────┐
                        │  backup                 │  serviço
                        │  Alpine 3.20 + cron     │  auxiliar
                        │  script da Entrega 1    │
                        └─────────────────────────┘

   VOLUMES NOMEADOS (persistem após "docker compose down")
     pe_dados_postgres  →  db:/var/lib/postgresql/data
     pe_backups         →  backup:/backups

   BIND MOUNTS (somente leitura)
     ./db/init     →  db:/docker-entrypoint-initdb.d
     ./dados_app   →  backup:/dados
```

### Por que nesta ordem

O navegador fala **apenas** com o Nginx. O painel usa caminhos relativos
(`/api/cursos`), e o Nginx repassa para `http://api:3000` — onde `api` é o
**nome do serviço** declarado no `docker-compose.yml`, resolvido pelo servidor
DNS interno da rede Docker.

A consequência é que o banco nunca precisa ser exposto ao host: ele só é
alcançável de dentro de `rede_proximaetapa`.

---

## 2. Serviços

| Serviço | Imagem base | Porta no host | Porta interna | Função |
|---|---|---|---|---|
| `web` | `nginx:1.27-alpine` | **8080** | 80 | Painel administrativo + proxy reverso |
| `api` | `node:22-alpine` | 3000 | 3000 | API REST (Express + pg) |
| `db` | `postgres:16-alpine` | — (não publicada) | 5432 | Banco de dados |
| `backup` | `alpine:3.20` | — | — | Backup agendado via cron |

A porta 3000 da API está publicada apenas para facilitar testes com `curl`
durante a avaliação. O painel funciona sem ela.

---

## 3. Estrutura de arquivos

```
proximaetapa-docker/
├── docker-compose.yml          orquestração dos 4 serviços
├── .env.example                modelo de variáveis (versionado)
├── .env                        credenciais reais (NÃO versionado)
├── .gitignore
├── README.md
│
├── backend/                    camada de aplicação
│   ├── Dockerfile              build em 2 estágios, usuário não-root
│   ├── .dockerignore
│   ├── package.json
│   └── src/
│       ├── server.js           inicialização, /health, encerramento limpo
│       ├── db.js               pool de conexões + espera pelo banco
│       └── routes/api.js       endpoints REST
│
├── frontend/                   camada de apresentação
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── nginx.conf              proxy reverso para api:3000
│   └── public/
│       ├── index.html
│       ├── estilo.css
│       └── app.js
│
├── backup/                     serviço auxiliar (Entrega 1 → Entrega 2)
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── backup.sh               script da Entrega 1, adaptado
│   └── entrypoint.sh           instala o cron e o mantém em primeiro plano
│
├── db/
│   └── init/
│       ├── 01-esquema.sql      tabelas, índices e view
│       └── 02-dados.sql        dados de exemplo
│
└── dados_app/                  arquivos da aplicação (entram no backup)
    ├── config/
    ├── uploads/
    └── exportacoes/
```

---

## 4. Pré-requisitos

- Docker Engine 24+ e Docker Compose v2
- No Windows: Docker Desktop com backend WSL 2

Confirme a instalação:

```bash
docker --version
docker compose version
```

Guias de instalação, conforme o seu caso:

| Situação | Guia |
|---|---|
| Windows com permissão de administrador | `GUIA_DOCKER_WINDOWS.md` |
| Sem permissão para instalar WSL 2 / Docker Desktop | `GUIA_SEM_WSL.md` |

O projeto inclui `.devcontainer/`, o que permite rodá-lo no GitHub Codespaces
direto do navegador, sem instalar nada na máquina local.

---

## 5. Como buildar e rodar

```bash
# 1. Criar o arquivo de credenciais a partir do modelo
cp .env.example .env

# 2. Editar o .env e trocar a senha do banco
nano .env          # ou o editor de sua preferência

# 3. Buildar as imagens e subir os containers
docker compose up -d --build

# 4. Acompanhar a inicialização
docker compose logs -f
```

Na primeira execução o build leva de 1 a 3 minutos (download das imagens base
e `npm ci`). Nas seguintes, o cache do Docker reduz isso a poucos segundos.

Quando tudo estiver de pé:

```bash
docker compose ps
```

Os quatro containers devem aparecer como `running`, e `pe_db`, `pe_api` e
`pe_web` como `healthy`.

**Painel administrativo:** <http://localhost:8080>

### Comandos do dia a dia

| Objetivo | Comando |
|---|---|
| Subir | `docker compose up -d` |
| Subir reconstruindo as imagens | `docker compose up -d --build` |
| Ver o estado | `docker compose ps` |
| Logs de todos os serviços | `docker compose logs -f` |
| Logs de um serviço | `docker compose logs -f api` |
| Parar (preservando os dados) | `docker compose down` |
| Parar e **apagar os volumes** | `docker compose down -v` |
| Shell em um container | `docker compose exec api sh` |
| Reiniciar um serviço | `docker compose restart api` |

> `docker compose down -v` apaga o banco e os backups. Use apenas quando
> quiser recarregar os dados de exemplo do zero.

---

## 6. Endpoints da API

Base: `http://localhost:3000` (direto) ou `http://localhost:8080/api` (via Nginx).

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Estado da API e da conexão com o banco |
| GET | `/api/resumo` | Totais gerais para os cartões do painel |
| GET | `/api/cursos` | Cursos ativos com contagem de matrículas |
| GET | `/api/alunos` | Alunos e quantos cursos cada um faz |
| GET | `/api/encontros` | Próximos 20 encontros da agenda |
| GET | `/api/participacao` | Percentual de presença por aluno/curso |
| POST | `/api/presencas` | Registra um check-in |

Exemplo de escrita:

```bash
curl -X POST http://localhost:3000/api/presencas \
  -H "Content-Type: application/json" \
  -d '{"aluno_id": 4, "encontro_id": 4, "metodo": "qrcode"}'
```

---

## 7. Como testar

### 7.1 Os containers subiram e estão saudáveis

```bash
docker compose ps
```

Esperado: `pe_db`, `pe_api`, `pe_web` com `(healthy)` e `pe_backup` com `running`.

### 7.2 A API responde e alcança o banco

```bash
curl http://localhost:3000/health
```

```json
{"status":"ok","banco":"conectado","momento":"2026-11-03T22:14:08.512Z"}
```

### 7.3 O painel carrega os dados reais

Abra <http://localhost:8080>. O indicador no topo deve ficar verde
("API no ar · banco conectado") e os cartões devem mostrar 8 alunos e
6 cursos ativos.

### 7.4 A comunicação por nome de serviço funciona

Este é o teste que comprova o requisito de rede. De dentro do container `web`,
resolva e chame o container `api` pelo nome:

```bash
docker compose exec web curl -s http://api:3000/health
```

E o caminho inverso, da API para o banco:

```bash
docker compose exec api sh -c 'nc -z db 5432 && echo "db:5432 alcancavel"'
```

Para ver a rede e os quatro containers nela:

```bash
docker network inspect rede_proximaetapa --format '{{range .Containers}}{{.Name}} {{.IPv4Address}}{{"\n"}}{{end}}'
```

### 7.5 O volume realmente persiste os dados

Este é o teste central do requisito de persistência.

```bash
# 1. Gravar um dado novo pelo painel ou pela API
curl -X POST http://localhost:3000/api/presencas \
  -H "Content-Type: application/json" \
  -d '{"aluno_id": 7, "encontro_id": 4, "metodo": "qrcode"}'

# 2. Conferir a contagem
curl -s http://localhost:3000/api/resumo

# 3. DESTRUIR os containers (sem -v, para manter os volumes)
docker compose down

# 4. Subir de novo
docker compose up -d

# 5. A contagem deve ser a MESMA do passo 2
curl -s http://localhost:3000/api/resumo
```

Se o número de presenças se mantiver, o volume está cumprindo seu papel. Para
comparar, repita a sequência usando `docker compose down -v` no passo 3: os
dados voltam ao estado inicial do seed.

### 7.6 O serviço de backup está funcionando

Com `BACKUP_AO_SUBIR=true` (padrão), um backup roda assim que o container sobe:

```bash
docker compose logs backup
```

Esperado no log:

```
[backup] Aguardando o banco em db:5432...
[backup] Banco acessivel.
[backup] Executando backup inicial...
2026-11-03 19:14:12 [INFO] ===== Inicio da execucao (container) =====
2026-11-03 19:14:12 [INFO] Gerando dump de 'proximaetapa' em 'db:5432'...
2026-11-03 19:14:13 [INFO] Dump gerado com sucesso (48.0K).
2026-11-03 19:14:13 [INFO] 7 arquivo(s) de aplicacao incluido(s).
2026-11-03 19:14:13 [INFO] Pacote criado: proximaetapa_2026-11-03_19-14-13.tar.gz (52.0K)
2026-11-03 19:14:13 [INFO] Resumo: dump=sim | arquivos=7 | removidos=0 | total de copias=1
[backup] Crontab instalado:
0 3 * * * . /etc/backup.env; /usr/local/bin/backup.sh >> /proc/1/fd/1 2>&1
```

Liste os pacotes dentro do volume:

```bash
docker compose exec backup ls -lh /backups
```

Rode um backup sob demanda, sem esperar o cron:

```bash
docker compose exec backup /usr/local/bin/backup.sh
```

Veja o conteúdo de um pacote (deve conter o dump **e** os arquivos):

```bash
docker compose exec backup sh -c 'tar -tzf $(ls -t /backups/*.tar.gz | head -1)'
```

Para demonstrar o agendamento na apresentação, troque a agenda no `.env`
e recrie o container:

```bash
# no .env:  CRON_AGENDA=*/2 * * * *
docker compose up -d --force-recreate backup
docker compose logs -f backup      # um backup a cada 2 minutos
```

### 7.7 A rotação de cópias funciona

Com `MAX_COPIAS=5`, rode o backup sete vezes e confira que sobram cinco:

```bash
for i in 1 2 3 4 5 6 7; do
  docker compose exec backup /usr/local/bin/backup.sh > /dev/null
  sleep 1
done
docker compose exec backup sh -c 'ls -1 /backups/*.tar.gz | wc -l'
docker compose exec backup grep removida /backups/logs/backup.log
```

### 7.8 Restaurar um backup

Um backup que nunca foi restaurado não é um backup:

```bash
# Extrair o dump de dentro do pacote mais recente
docker compose exec backup sh -c \
  'tar -xzf $(ls -t /backups/*.tar.gz | head -1) -C /tmp ./banco_proximaetapa.sql'

# Criar um banco de teste e restaurar nele
docker compose exec db psql -U pe_app -d proximaetapa \
  -c "CREATE DATABASE restore_teste OWNER pe_app;"

docker compose exec backup sh -c \
  'PGPASSWORD=$DB_SENHA psql -h db -U $DB_USUARIO -d restore_teste -f /tmp/banco_proximaetapa.sql > /dev/null'

# Conferir que os dados voltaram
docker compose exec db psql -U pe_app -d restore_teste -c "SELECT COUNT(*) FROM alunos;"
```

### 7.9 Resiliência: o que acontece se o banco cair

```bash
docker compose stop db
curl -s http://localhost:3000/health          # deve responder 503 "degradado"
docker compose ps                             # pe_api aparece como unhealthy
docker compose start db
sleep 15
curl -s http://localhost:3000/health          # volta a 200 "ok"
```

### 7.10 Nenhuma credencial vazou para dentro das imagens

```bash
# O .env não deve existir dentro do container (bloqueado pelo .dockerignore)
docker compose exec api sh -c 'ls -la /app' | grep -c "\.env" || echo "OK: .env ausente da imagem"

# As credenciais estão apenas no ambiente, não em arquivos da imagem
docker compose exec api printenv | grep DB_
```

---

## 8. Boas práticas aplicadas nos Dockerfiles

| Prática | Onde | Efeito |
|---|---|---|
| Imagem base enxuta | `node:22-alpine`, `nginx:1.27-alpine`, `alpine:3.20`, `postgres:16-alpine` | ~130 MB em vez de ~1,1 GB (`node:22`) |
| Build em múltiplos estágios | `backend/Dockerfile` | As dependências são instaladas em um estágio separado; a imagem final não carrega cache do npm |
| Camadas otimizadas | `COPY package.json` antes de `COPY src` | Alterar código não refaz o `npm ci` |
| `.dockerignore` | Nos três serviços | Build mais rápido e, principalmente, `.env` fora da imagem |
| Apenas dependências de produção | `npm ci --omit=dev` | Imagem menor e menos superfície de ataque |
| Usuário sem privilégios | `USER node` no backend | O processo não roda como root |
| `HEALTHCHECK` | Nos quatro serviços | O Compose sabe quando cada serviço está realmente pronto |
| Encerramento limpo | `dumb-init` + `SIGTERM` no `server.js` | `docker compose down` em ~1 s em vez de 10 s |
| `depends_on: service_healthy` | `api` e `backup` | A API não tenta conectar antes do banco aceitar conexões |
| Fuso horário explícito | `TZ` + `tzdata` | O cron dispara no horário de Brasília, não em UTC |
| Credenciais fora do código | `.env` + `environment:` | Nenhuma senha em Dockerfile, compose ou código-fonte |
| Banco sem porta publicada | `db` sem `ports:` | O banco só é alcançável dentro da rede Docker |

---

## 9. Da Entrega 1 para a Entrega 2

O script de backup da Parte 1 virou o serviço `backup`. O que mudou:

| Aspecto | Entrega 1 | Entrega 2 |
|---|---|---|
| Shell | `/bin/bash` | `/bin/sh` (BusyBox do Alpine — não há Bash na imagem) |
| Credenciais | `source .env` dentro do script | Variáveis de ambiente injetadas pelo Compose |
| Host do banco | `localhost` | `db` (nome do serviço, via DNS da rede Docker) |
| Destino | pasta local `./backups` | volume nomeado `pe_backups` em `/backups` |
| Agendamento | `crontab -e` na máquina | `crond` dentro do container, agenda vinda do `.env` |
| Log | arquivo local | arquivo no volume **e** saída padrão (`docker compose logs`) |

O que **não** mudou: a lógica de rotação, a validação de entrada, a
verificação de código de retorno após cada operação crítica e os códigos de
saída (`0` sucesso, `4` destino inacessível, `5` nada a salvar, `6` falha na
compactação).

Detalhe de implementação que vale citar na apresentação: o `crond` **não herda
as variáveis de ambiente** do container. Um backup agendado rodaria sem
`DB_SENHA` e falharia silenciosamente. O `entrypoint.sh` resolve isso gravando
o ambiente em `/etc/backup.env` (com permissão `600`) e carregando esse arquivo
na própria linha do crontab.

---

## 10. Problemas comuns

| Sintoma | Causa | Solução |
|---|---|---|
| `port is already allocated` | Porta 8080 ou 3000 em uso | Troque `PORTA_WEB` / `PORTA_API_HOST` no `.env` |
| `pe_api` reinicia em laço | Banco ainda não pronto, ou senha divergente | `docker compose logs api`; se trocou `DB_SENHA` depois do primeiro `up`, rode `docker compose down -v` |
| Painel abre mas as tabelas falham | API fora do ar | `docker compose logs api` e `curl localhost:3000/health` |
| Alterei `02-dados.sql` e nada mudou | Os scripts de init só rodam com o volume vazio | `docker compose down -v && docker compose up -d` |
| `server version mismatch` no backup | `pg_dump` em versão diferente do servidor | O Dockerfile fixa `postgresql16-client` para o `postgres:16` — não troque um sem o outro |
| Backup roda em horário errado | Container em UTC | Confirme `TZ` no `.env` e `tzdata` instalado na imagem |
| `permission denied` em `/backups` | Volume criado por outro usuário | `docker compose down -v` recria o volume |

---

## 11. Limpeza

```bash
# Parar e remover containers e rede (mantendo os dados)
docker compose down

# Remover também os volumes (apaga banco e backups)
docker compose down -v

# Remover as imagens construídas por este projeto
docker rmi proximaetapa/api:1.0 proximaetapa/web:1.0 proximaetapa/backup:1.0

# Liberar espaço de builds antigos
docker system prune -f
```
