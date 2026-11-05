# =============================================================================
#  Dockerfile - Backend / API do Proxima Etapa  (Node.js + Express)
# -----------------------------------------------------------------------------
#  Boas praticas aplicadas:
#    1. Imagem base enxuta (node:22-alpine, ~130MB contra ~1.1GB da node:22).
#    2. Build em multiplos estagios: as dependencias sao instaladas em um
#       estagio separado e so' o resultado util e' copiado para a imagem final.
#    3. Camadas otimizadas: package.json e' copiado ANTES do codigo-fonte, de
#       modo que alterar um arquivo .js nao invalide o cache do "npm ci".
#    4. Execucao como usuario sem privilegios (node), nunca como root.
#    5. Apenas dependencias de producao na imagem final (--omit=dev).
#    6. HEALTHCHECK, para o Docker saber se a aplicacao esta de pe'.
#    7. dumb-init como PID 1, para que SIGTERM chegue ao processo Node.
# =============================================================================

# -----------------------------------------------------------------------------
#  ESTAGIO 1 - dependencias
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps

WORKDIR /app

# Copia so' os manifestos primeiro. Esta e' a otimizacao de camadas: enquanto
# package.json e package-lock.json nao mudarem, o Docker reaproveita o cache
# desta camada e nao reinstala nada.
COPY package.json package-lock.json* ./

# "npm ci" instala exatamente as versoes do lock file (reproduzivel).
# O "|| npm install" cobre o caso de o lock file ainda nao existir no repo.
RUN npm ci --omit=dev || npm install --omit=dev

# -----------------------------------------------------------------------------
#  ESTAGIO 2 - imagem final
# -----------------------------------------------------------------------------
FROM node:22-alpine AS producao

# dumb-init encaminha os sinais do sistema (SIGTERM) para o processo Node,
# permitindo que o "docker compose down" encerre o container em 1s e nao em 10s.
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production
WORKDIR /app

# Traz as dependencias ja' instaladas no estagio anterior.
# O --chown evita uma camada extra de "chown -R" depois.
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src

# A imagem node:alpine ja' traz um usuario "node" (uid 1000) sem privilegios.
USER node

EXPOSE 3000

# O healthcheck roda de dentro do container, por isso usa localhost.
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
