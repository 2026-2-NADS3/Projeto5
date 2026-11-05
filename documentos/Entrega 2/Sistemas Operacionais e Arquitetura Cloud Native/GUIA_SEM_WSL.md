# Como rodar o projeto sem WSL e sem instalar nada

Guia alternativo para quem não pode instalar WSL 2 nem Docker Desktop na
máquina — máquina corporativa, computador da faculdade, ou qualquer caso sem
permissão de administrador.

---

## Isso prejudica a entrega?

Não. Vale separar duas coisas:

**O que é avaliado** são os artefatos: os três Dockerfiles, o
`docker-compose.yml`, o `.env.example`, o README com o diagrama, e as
evidências de que tudo sobe e funciona. Nada disso depende do seu sistema
operacional.

**Onde você roda** para gerar essas evidências é indiferente. Um
`docker compose up` executado em um ambiente de nuvem produz exatamente os
mesmos logs, as mesmas portas e os mesmos prints que um executado no Windows.
O professor, por sua vez, vai rodar na máquina dele — e o projeto funciona em
qualquer lugar que tenha Docker.

Por que não existe saída local: o Docker Desktop no Windows precisa de WSL 2
ou de Hyper-V, e os dois exigem instalação com privilégio de administrador.
Rancher Desktop e Podman Desktop, as alternativas mais citadas, também usam
WSL 2 por baixo. Não há caminho local sem admin.

E o Play with Docker, que era o atalho clássico para esse problema, foi
**descontinuado em 1º de março de 2026**.

---

## Opção 1 — GitHub Codespaces (recomendada)

Um ambiente Linux completo no navegador, com VS Code, terminal e Docker.
Nada é instalado na sua máquina.

**Cota gratuita para contas pessoais:** 120 core-hours por mês, o que equivale
a **60 horas** em uma máquina de 2 núcleos, mais 15 GB de armazenamento. Para
este projeto você vai usar algo entre 2 e 4 horas.

O projeto já inclui a pasta `.devcontainer/`, que configura o Docker
automaticamente no Codespace. Você não precisa ajustar nada.

### Passo 1 — Criar a conta e o repositório

1. Crie uma conta gratuita em <https://github.com> (se ainda não tiver)
2. Clique em **New repository**
3. Nome: `proximaetapa-docker`
4. Visibilidade: **Private** é suficiente (a cota gratuita vale para os dois)
5. Deixe sem README, sem `.gitignore` e sem licença — o projeto já traz os seus
6. **Create repository**

### Passo 2 — Enviar os arquivos

Pela interface web, sem precisar instalar Git:

1. Na página do repositório recém-criado, clique em **uploading an existing file**
2. Descompacte o `proximaetapa-docker.zip` no seu Windows
3. Arraste **o conteúdo** da pasta `proximaetapa-docker` para a área de upload
   (os arquivos e as pastas, não a pasta externa)
4. Escreva uma mensagem de commit, por exemplo `Entrega 2 - conteinerizacao`
5. **Commit changes**

> **Atenção com os arquivos ocultos.** O Windows esconde arquivos que começam
> com ponto, e eles são justamente os que valem nota: `.env.example`,
> `.gitignore`, os três `.dockerignore` e a pasta `.devcontainer`.
>
> No Explorador de Arquivos, vá em **Exibir → Mostrar → Itens ocultos** antes
> de arrastar. Depois do upload, confirme na página do repositório que
> `.env.example`, `.gitignore` e `.devcontainer` estão listados, e que
> `backend/`, `frontend/` e `backup/` contêm cada um o seu `.dockerignore`.
>
> Se algum não subiu, use **Add file → Create new file**, digite o caminho
> (por exemplo `backend/.dockerignore`) e cole o conteúdo.

### Passo 3 — Abrir o Codespace

1. Na página do repositório, clique no botão verde **Code**
2. Aba **Codespaces**
3. **Create codespace on main**

A primeira criação leva de 2 a 4 minutos: o ambiente é montado e o Docker é
instalado pelo `devcontainer.json`. Ao final, o VS Code abre no navegador com
um terminal, e o script de preparação já criou o `.env` e corrigiu o fim de
linha dos scripts.

### Passo 4 — Trocar a senha do banco

No terminal do Codespace:

```bash
nano .env
```

Troque `DB_SENHA` por uma senha sua. Salvar: `Ctrl+O`, `Enter`, `Ctrl+X`.

### Passo 5 — Subir os containers

```bash
docker compose up -d --build
```

Confirme:

```bash
docker compose ps
```

### Passo 6 — Abrir o painel

Na barra inferior do VS Code, abra a aba **PORTS** (ou **PORTAS**). A porta
**8080** aparece com o rótulo "Painel administrativo". Clique no ícone de globo
(**Open in Browser**) na linha dela.

O endereço será algo como
`https://seu-codespace-8080.app.github.dev` — é o equivalente do
`http://localhost:8080` do guia original.

> Se a API não responder no painel, verifique na aba **PORTS** se a porta 8080
> está como **Public** ou **Private**: em *Private* o navegador precisa estar
> logado na mesma conta GitHub, o que normalmente já é o caso. Para mudar,
> clique com o botão direito na linha da porta → **Port Visibility**.

### Passo 7 — Rodar os testes

Siga a **seção 7 do README.md** normalmente. Todos os comandos funcionam sem
alteração, porque o terminal do Codespace é um Linux de verdade.

Única diferença: onde o README diz `curl http://localhost:3000/...`, continue
usando exatamente isso — dentro do Codespace, `localhost` é o próprio ambiente.

### Passo 8 — Trazer as evidências para o Windows

Gere os arquivos de evidência (comandos na parte D do
`GUIA_DOCKER_WINDOWS.md`) e compacte:

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

zip -r evidencias.zip evidencias
```

No explorador de arquivos do VS Code (painel da esquerda), clique com o botão
direito em `evidencias.zip` → **Download**.

Para os screenshots, use a tecla **Print Screen** do Windows normalmente — o
Codespace está rodando dentro do seu navegador.

### Passo 9 — Desligar para economizar cota

O Codespace continua consumindo horas enquanto está ligado. Ao terminar:

1. Volte para <https://github.com/codespaces>
2. No menu `...` do seu Codespace → **Stop codespace**

Ele para de consumir e o conteúdo fica preservado. Ligar de novo leva segundos.
Por padrão o Codespace também hiberna sozinho após 30 minutos de inatividade.

---

## Opção 2 — Google Cloud Shell (plano B)

Também roda no navegador, com Docker pré-instalado, e só precisa de uma conta
Google. Não exige cartão de crédito.

**Limites:** 50 horas por semana, 5 GB no diretório pessoal, sessão encerrada
após 12 horas ou 40 minutos de inatividade. Arquivos fora de `$HOME` são
perdidos quando a sessão termina — mantenha o projeto em `$HOME` e está tudo
bem.

### Passos

1. Acesse <https://shell.cloud.google.com> e faça login com a conta Google
2. Confirme que o Docker está presente:

```bash
docker --version
docker compose version
```

Se `docker compose version` falhar, instale o plugin:

```bash
mkdir -p ~/.docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o ~/.docker/cli-plugins/docker-compose
chmod +x ~/.docker/cli-plugins/docker-compose
docker compose version
```

3. Envie o projeto. O jeito mais simples é pelo menu de três pontos do terminal
   → **Upload** → selecione o `proximaetapa-docker.zip`. Depois:

```bash
cd ~
unzip proximaetapa-docker.zip
cd proximaetapa-docker
```

4. Prepare e suba:

```bash
sed -i 's/\r$//' $(find . -type f \( -name "*.sh" -o -name "*.yml" -o -name "*.conf" -o -name "*.sql" -o -name "Dockerfile" \))
chmod +x backup/*.sh
cp .env.example .env
nano .env                     # trocar DB_SENHA
docker compose up -d --build
```

5. Abra o painel: botão **Visualização da Web** (ícone de olho, no topo à
   direita do terminal) → **Alterar porta** → digite `8080` → **Alterar e
   visualizar**.

   A visualização da web aceita portas de 2000 a 65000, então 8080 e 3000
   funcionam.

6. Siga a seção 7 do README para os testes.

---

## Opção 3 — Verificar antes se você já tem acesso a Docker

Antes de montar ambiente em nuvem, vale checar duas coisas que podem resolver
em cinco minutos:

**Os laboratórios da faculdade.** Uma UC de Cloud Native normalmente tem
máquinas preparadas com Docker. Se existirem, é o caminho mais direto, e os
prints saem de um ambiente que o professor reconhece.

**Outra máquina sua.** Se tiver um computador pessoal onde você é
administrador, o `GUIA_DOCKER_WINDOWS.md` original se aplica sem mudança.

---

## Comparação rápida

| | Codespaces | Cloud Shell | Máquina com admin |
|---|---|---|---|
| Instala algo no Windows | não | não | sim |
| Conta necessária | GitHub | Google | — |
| Cota | 60 h/mês (2 núcleos) | 50 h/semana | ilimitada |
| Docker Compose | instalado pelo devcontainer | pode precisar do plugin | você instala |
| Acesso ao painel | aba PORTS | Visualização da Web | `localhost:8080` |
| Persistência | volume do Codespace | `$HOME` (5 GB) | disco local |
| Projeto já versionado no Git | sim, por construção | não | não |

A coluna do Codespaces tem uma vantagem extra que vale mencionar na
apresentação: o projeto nasce em um repositório Git, que é como código de
infraestrutura é entregue na prática.

---

## O que escrever no README da entrega

Vale uma linha de honestidade técnica, que costuma contar a favor:

> O ambiente foi validado em GitHub Codespaces (Ubuntu 24.04, Docker Engine
> com Docker Compose v2), já que a máquina de desenvolvimento não permitia a
> instalação do Docker Desktop. A pasta `.devcontainer/` reproduz esse
> ambiente, e o projeto roda sem alteração em qualquer host com Docker
> Compose v2.

Isso demonstra que você entendeu a ideia central de conteinerização: o
ambiente de execução acompanha o projeto, não a máquina.

---

## Fontes

- [Play with Docker is deprecated and will be unavailable starting March 1, 2026](https://forums.docker.com/t/play-with-docker-is-deprecated-and-will-be-unavailable-starting-march-1-2026-learn-about-alternatives/151177)
- [GitHub Codespaces — cota gratuita de 120 core-hours e 15 GB](https://github.com/features/codespaces)
- [Cloud Shell — quotas e limites](https://docs.cloud.google.com/shell/docs/quotas-limits)
- [Cloud Shell — ferramentas pré-instaladas](https://docs.cloud.google.com/shell/docs/features)
- [Cloud Shell — visualização da web, portas 2000 a 65000](https://docs.cloud.google.com/shell/docs/using-web-preview)
