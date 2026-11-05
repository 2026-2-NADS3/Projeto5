# Guia de instalação e execução — Docker no Windows

Passo a passo completo, do zero até os quatro containers rodando. Você já tem
WSL com Ubuntu da Entrega 1, o que encurta bastante o caminho.

---

## Parte A — Instalar o Docker Desktop

### A.1 Verificar se a virtualização está ligada

Abra o **Gerenciador de Tarefas** (`Ctrl+Shift+Esc`) → aba **Desempenho** →
**CPU**. No painel da direita, procure a linha **Virtualização**.

- **Habilitado** → siga para A.2.
- **Desabilitado** → precisa ligar no BIOS/UEFI: reinicie, entre no setup
  (geralmente `F2`, `F10`, `Del` ou `F12` durante a inicialização) e procure
  por `Intel VT-x`, `AMD-V` ou `SVM Mode`. Ative, salve e reinicie.

Sem virtualização o Docker Desktop não inicia.

### A.2 Confirmar que o WSL 2 está atualizado

No **PowerShell** (não no Ubuntu):

```powershell
wsl --status
```

A saída deve indicar versão padrão 2. Atualize o kernel por garantia:

```powershell
wsl --update
```

Confirme que sua distribuição está em WSL 2:

```powershell
wsl -l -v
```

A coluna `VERSION` do Ubuntu precisa ser `2`. Se aparecer `1`, converta:

```powershell
wsl --set-version Ubuntu 2
```

### A.3 Baixar e instalar

1. Acesse <https://www.docker.com/products/docker-desktop/>
2. Baixe **Docker Desktop for Windows** (AMD64, salvo se tiver máquina ARM)
3. Execute o instalador
4. Na tela de opções, deixe **"Use WSL 2 instead of Hyper-V"** marcado
5. Conclua e **reinicie o Windows** quando for solicitado

Não é necessário criar conta no Docker Hub para este projeto. A tela de login
pode ser fechada.

### A.4 Primeira inicialização

Abra o **Docker Desktop** pelo menu Iniciar e espere o ícone da baleia, no
canto inferior esquerdo da janela, ficar **verde** com a palavra *Engine
running*. A primeira inicialização costuma levar de 1 a 2 minutos.

### A.5 Liberar o Docker para o Ubuntu do WSL

Este passo é o que a maioria esquece — sem ele o comando `docker` não existe
dentro do Ubuntu.

No Docker Desktop: **Settings** (engrenagem) → **Resources** → **WSL
Integration**.

1. Deixe **"Enable integration with my default WSL distro"** marcado
2. Na lista abaixo, ative o botão da sua distribuição **Ubuntu**
3. Clique em **Apply & restart**

### A.6 Conferir no Ubuntu

Abra o Ubuntu e rode:

```bash
docker --version
docker compose version
```

Esperado: algo como `Docker version 27.x` e `Docker Compose version v2.x`.

Teste de fumaça:

```bash
docker run --rm hello-world
```

Deve baixar uma imagem pequena e imprimir "Hello from Docker!". Se isso
funcionar, o ambiente está pronto.

**Se der `permission denied` no socket:**

```bash
sudo usermod -aG docker $USER
```

Depois feche o Ubuntu, rode `wsl --shutdown` no PowerShell e abra o Ubuntu de
novo.

**Se der `Cannot connect to the Docker daemon`:** o Docker Desktop não está
aberto no Windows, ou a integração do passo A.5 não foi aplicada.

---

## Parte B — Montar o projeto

### B.1 Localizar os arquivos baixados

Como na Entrega 1, seus downloads do Windows ficam em `/mnt/c/`:

```bash
ls /mnt/c/Users/SEU_USUARIO/Downloads
```

### B.2 Criar a pasta do projeto dentro do Linux

Vale repetir o aviso da Entrega 1: **não trabalhe dentro de `/mnt/c/`**. Além
do problema de permissões, o Docker fica drasticamente mais lento lendo arquivos
do sistema de arquivos do Windows.

```bash
mkdir -p ~/proximaetapa/entrega2
cd ~/proximaetapa/entrega2
```

### B.3 Extrair o projeto

Se você recebeu a pasta compactada:

```bash
unzip /mnt/c/Users/SEU_USUARIO/Downloads/proximaetapa-docker.zip -d .
```

Se o `unzip` não estiver instalado:

```bash
sudo apt update && sudo apt install -y unzip
```

Confira a estrutura:

```bash
ls -la
```

Devem aparecer `docker-compose.yml`, `.env.example`, `README.md`, e as pastas
`backend/`, `frontend/`, `backup/`, `db/` e `dados_app/`.

### B.4 Corrigir o fim de linha (CRLF → LF)

Mesma armadilha da Entrega 1, e aqui ela é pior: um `\r` no fim do shebang faz
o container morrer com `exec format error` ou `no such file or directory` —
mensagens que não dizem nada sobre a causa real.

```bash
sudo apt install -y dos2unix
find . -type f \( -name "*.sh" -o -name "*.yml" -o -name "*.conf" -o -name "*.sql" -o -name "Dockerfile" -o -name ".env*" \) -exec dos2unix {} \;
```

Verifique um dos scripts:

```bash
file backup/backup.sh
```

Não deve conter "CRLF line terminators".

### B.5 (Opcional) Gerar o `package-lock.json`

O projeto vem sem lock file, e o Dockerfile lida com isso: ele tenta
`npm ci` e, se não houver lock, usa `npm install`. Funciona.

Para um build totalmente reproduzível — recomendado, e vale menção na
apresentação — gere o lock file antes do primeiro build:

```bash
docker run --rm -v "$PWD/backend":/app -w /app node:22-alpine \
  npm install --package-lock-only --omit=dev
```

Isso cria `backend/package-lock.json` sem precisar ter o Node instalado no
Ubuntu. Depois disso o `npm ci` do Dockerfile passa a instalar versões
fixas, e o build fica idêntico em qualquer máquina.

### B.6 Criar o arquivo de credenciais

```bash
cp .env.example .env
nano .env
```

Troque a senha:

```bash
DB_SENHA=uma_senha_sua_aqui
```

Salvar no nano: `Ctrl+O`, `Enter`, `Ctrl+X`.

Se editou o `.env` no Notepad em algum momento, rode `dos2unix .env` — CRLF
nesse arquivo quebra a senha de forma silenciosa, e o sintoma é um
`password authentication failed` que não faz sentido.

---

## Parte C — Subir os containers

### C.1 Build e subida

```bash
docker compose up -d --build
```

A primeira vez baixa as imagens base e roda o `npm ci`. Leva de 1 a 3 minutos
em conexão razoável. A saída termina com algo como:

```
[+] Running 6/6
 ✔ Network rede_proximaetapa    Created
 ✔ Volume "pe_dados_postgres"   Created
 ✔ Volume "pe_backups"          Created
 ✔ Container pe_db              Healthy
 ✔ Container pe_api             Started
 ✔ Container pe_web             Started
 ✔ Container pe_backup          Started
```

### C.2 Conferir o estado

```bash
docker compose ps
```

Espere cerca de 30 segundos e rode de novo: `pe_db`, `pe_api` e `pe_web` devem
aparecer como `(healthy)`.

### C.3 Acompanhar os logs

```bash
docker compose logs -f
```

`Ctrl+C` encerra o acompanhamento (não derruba os containers).

Procure por estas três linhas, que confirmam o caminho completo funcionando:

```
pe_db      | database system is ready to accept connections
pe_api     | [db] Conectado ao banco "proximaetapa" em "db".
pe_api     | [api] Servidor ouvindo na porta 3000
```

### C.4 Abrir o painel

No navegador do Windows: <http://localhost:8080>

O WSL expõe as portas para o Windows automaticamente — não é preciso descobrir
o IP da distribuição.

O indicador no topo deve ficar verde e os cartões devem mostrar **8 alunos** e
**6 cursos ativos**.

### C.5 Testar a API direto

```bash
curl http://localhost:3000/health
```

Se o `curl` não estiver instalado: `sudo apt install -y curl`.

---

## Parte D — Os testes que valem print

Siga a **seção 7 do README.md**, que tem os dez testes na ordem. Os quatro que
mais importam para a nota:

1. **7.4** — comunicação por nome de serviço (`docker compose exec web curl http://api:3000/health`)
2. **7.5** — persistência no volume (`down` e `up` sem perder dados)
3. **7.6** — serviço de backup rodando com o script da Entrega 1
4. **7.10** — nenhuma credencial dentro das imagens

Para cada um, tire screenshot do comando **e** da saída.

### Capturar as saídas em arquivo

Útil para colar no documento da entrega sem depender só de imagem:

```bash
mkdir -p evidencias

docker compose ps                     > evidencias/01-containers.txt
docker compose logs --no-color        > evidencias/02-logs-completos.txt
curl -s localhost:3000/health         > evidencias/03-health.json
curl -s localhost:3000/api/resumo     > evidencias/04-resumo.json
docker compose exec -T web curl -s http://api:3000/health \
                                      > evidencias/05-rede-nome-servico.json
docker compose exec -T backup ls -lh /backups \
                                      > evidencias/06-backups.txt
docker network inspect rede_proximaetapa \
                                      > evidencias/07-rede.json
docker images | grep proximaetapa     > evidencias/08-imagens.txt

ls -la evidencias/
```

Para copiar a pasta de evidências para o Windows:

```bash
cp -r evidencias /mnt/c/Users/SEU_USUARIO/Desktop/
```

---

## Parte E — Rotina depois de reiniciar o Windows

Diferente do Postgres da Entrega 1 (que exigia `sudo service postgresql start`
a cada reinício), aqui a rotina é:

1. Abrir o **Docker Desktop** e esperar o ícone ficar verde
2. No Ubuntu: `cd ~/proximaetapa/entrega2 && docker compose up -d`

Os containers com `restart: unless-stopped` voltam sozinhos assim que o Docker
Desktop inicia, desde que não tenham sido parados manualmente com
`docker compose down`.

---

## Parte F — Problemas específicos do Windows/WSL

| Sintoma | Causa | Solução |
|---|---|---|
| `docker: command not found` no Ubuntu | Integração WSL desativada | Passo A.5 |
| `Cannot connect to the Docker daemon` | Docker Desktop fechado | Abra o Docker Desktop e espere o ícone verde |
| `exec /usr/local/bin/entrypoint.sh: no such file or directory` | CRLF nos scripts | Passo B.4 (`dos2unix`) |
| `exec format error` | CRLF no shebang | Passo B.4 |
| `port is already allocated` | Porta 8080 ou 3000 ocupada no Windows | Troque `PORTA_WEB`/`PORTA_API_HOST` no `.env` e rode `docker compose up -d` |
| Build muito lento | Projeto dentro de `/mnt/c/` | Mova para `~/` (passo B.2) |
| `localhost:8080` não abre | Containers não subiram | `docker compose ps` e `docker compose logs web` |
| Docker Desktop consome muita RAM | Padrão do WSL 2 | Crie `C:\Users\SEU_USUARIO\.wslconfig` com `[wsl2]` e `memory=4GB`, depois `wsl --shutdown` |
| `password authentication failed` sem motivo aparente | CRLF no `.env` | `dos2unix .env && docker compose down -v && docker compose up -d` |
| Mudei o `.env` e nada mudou | Variáveis são lidas na criação do container | `docker compose up -d --force-recreate` |

---

## Parte G — Antes de entregar

- [ ] `docker compose up -d --build` funciona a partir de um clone limpo
- [ ] `docker compose down -v && docker compose up -d --build` também funciona
      (prova que o projeto não depende de estado residual da sua máquina)
- [ ] O `.env` **não** está no repositório; o `.env.example` **está**
- [ ] Nenhuma senha real aparece em `docker-compose.yml`, Dockerfiles ou código
- [ ] Os prints do README são as suas execuções, não as do exemplo
- [ ] O diagrama da seção 1 do README está no documento da entrega
- [ ] A tabela da seção 9 (Entrega 1 → Entrega 2) está citada, porque é o que
      comprova a continuidade exigida pelo edital

O segundo item é o que mais derruba trabalho na correção: o professor vai rodar
em uma máquina que nunca viu seu projeto.
