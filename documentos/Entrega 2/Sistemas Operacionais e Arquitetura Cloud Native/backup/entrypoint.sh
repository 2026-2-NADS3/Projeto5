#!/bin/sh
# =============================================================================
#  entrypoint.sh - Inicializacao do container de backup
# -----------------------------------------------------------------------------
#  Responsabilidades:
#    1. Esperar o banco aceitar conexoes.
#    2. (Opcional) rodar um backup imediato, para o teste nao depender de
#       esperar o horario agendado.
#    3. Instalar a entrada no cron e manter o crond em primeiro plano.
#
#  DETALHE IMPORTANTE DO CRON EM CONTAINER
#  ---------------------------------------
#  O cron NAO herda as variaveis de ambiente do processo principal do
#  container. Um backup agendado rodaria sem DB_SENHA e falharia de forma
#  silenciosa. A solucao abaixo e' gravar o ambiente atual em um arquivo e
#  carrega-lo ("." = source) na propria linha do crontab.
# =============================================================================

set -eu

AGENDA="${CRON_AGENDA:-0 3 * * *}"       # padrao: todos os dias as 03:00
RODAR_AO_SUBIR="${BACKUP_AO_SUBIR:-true}"
ARQ_AMBIENTE="/etc/backup.env"

echo "[backup] Container iniciado. Agenda do cron: '$AGENDA'"

# -----------------------------------------------------------------------------
# 1. Espera o banco responder
# -----------------------------------------------------------------------------
if [ -n "${DB_HOST:-}" ] && [ -n "${DB_USUARIO:-}" ]; then
    echo "[backup] Aguardando o banco em $DB_HOST:${DB_PORTA:-5432}..."
    TENTATIVA=1
    until PGPASSWORD="${DB_SENHA:-}" pg_isready \
            -h "$DB_HOST" -p "${DB_PORTA:-5432}" -U "$DB_USUARIO" -q; do
        if [ "$TENTATIVA" -ge 30 ]; then
            echo "[backup] AVISO: banco nao respondeu em 60s. Seguindo mesmo assim."
            break
        fi
        TENTATIVA=$((TENTATIVA + 1))
        sleep 2
    done
    echo "[backup] Banco acessivel."
fi

# -----------------------------------------------------------------------------
# 2. Grava o ambiente para o cron poder carregar
# -----------------------------------------------------------------------------
# O "export" em cada linha permite usar o arquivo com "." dentro do crontab.
{
    echo "export DB_HOST='${DB_HOST:-db}'"
    echo "export DB_PORTA='${DB_PORTA:-5432}'"
    echo "export DB_NOME='${DB_NOME:-}'"
    echo "export DB_USUARIO='${DB_USUARIO:-}'"
    echo "export DB_SENHA='${DB_SENHA:-}'"
    echo "export DIR_BACKUPS='${DIR_BACKUPS:-/backups}'"
    echo "export DIR_DADOS='${DIR_DADOS:-/dados}'"
    echo "export MAX_COPIAS='${MAX_COPIAS:-5}'"
    echo "export PREFIXO='${PREFIXO:-proximaetapa}'"
} > "$ARQ_AMBIENTE"

chmod 600 "$ARQ_AMBIENTE"   # so' o proprietario le as credenciais

# -----------------------------------------------------------------------------
# 3. Backup imediato (facilita a demonstracao)
# -----------------------------------------------------------------------------
if [ "$RODAR_AO_SUBIR" = "true" ]; then
    echo "[backup] Executando backup inicial..."
    /usr/local/bin/backup.sh || echo "[backup] O backup inicial falhou (veja o log acima)."
fi

# -----------------------------------------------------------------------------
# 4. Instala o agendamento
# -----------------------------------------------------------------------------
# A saida vai para /proc/1/fd/1, que e' a saida padrao do container. Sem isso
# o resultado dos backups agendados nao apareceria em "docker compose logs".
echo "$AGENDA . $ARQ_AMBIENTE; /usr/local/bin/backup.sh >> /proc/1/fd/1 2>&1" > /etc/crontabs/root
chmod 600 /etc/crontabs/root

echo "[backup] Crontab instalado:"
cat /etc/crontabs/root

# -----------------------------------------------------------------------------
# 5. Cron em primeiro plano
# -----------------------------------------------------------------------------
# -f = foreground (o container precisa de um processo em primeiro plano)
# -l 8 = nivel de log detalhado
echo "[backup] Iniciando crond. Aguardando o proximo horario agendado."
exec crond -f -l 8
