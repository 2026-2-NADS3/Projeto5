#!/usr/bin/env bash
# =============================================================================
#  preparar.sh - roda automaticamente quando o Codespace e' criado
# -----------------------------------------------------------------------------
#  1. Cria o .env a partir do modelo, se ainda nao existir.
#  2. Normaliza o fim de linha dos scripts (defesa contra CRLF do Windows).
#  3. Garante a permissao de execucao dos scripts.
# =============================================================================

set -eu

echo "==> Preparando o ambiente do projeto Proxima Etapa"

# -----------------------------------------------------------------------------
# 1. Arquivo de credenciais
# -----------------------------------------------------------------------------
if [ ! -f .env ]; then
    cp .env.example .env
    echo "    .env criado a partir do .env.example"
    echo "    ATENCAO: troque DB_SENHA no .env antes de entregar o trabalho."
else
    echo "    .env ja existia, mantido como estava"
fi

# -----------------------------------------------------------------------------
# 2. Fim de linha (CRLF -> LF)
# -----------------------------------------------------------------------------
# Um \r no fim do shebang faz o container morrer com "exec format error".
if command -v dos2unix > /dev/null 2>&1; then
    FERRAMENTA="dos2unix"
else
    FERRAMENTA="sed"
fi

CORRIGIDOS=0
for arquivo in $(find . -type f \
        \( -name "*.sh" -o -name "*.yml" -o -name "*.conf" \
           -o -name "*.sql" -o -name "Dockerfile" -o -name ".env*" \) \
        -not -path "./node_modules/*" -not -path "./.git/*"); do
    if [ "$FERRAMENTA" = "dos2unix" ]; then
        dos2unix -q "$arquivo" 2>/dev/null || true
    else
        sed -i 's/\r$//' "$arquivo" 2>/dev/null || true
    fi
    CORRIGIDOS=$((CORRIGIDOS + 1))
done
echo "    $CORRIGIDOS arquivo(s) verificado(s) quanto ao fim de linha"

# -----------------------------------------------------------------------------
# 3. Permissao de execucao
# -----------------------------------------------------------------------------
chmod +x backup/backup.sh backup/entrypoint.sh 2>/dev/null || true
echo "    permissao de execucao aplicada aos scripts"

# -----------------------------------------------------------------------------
echo
echo "==> Pronto. Para subir o projeto:"
echo
echo "      docker compose up -d --build"
echo
echo "    Depois abra a porta 8080 na aba PORTS do VS Code."
