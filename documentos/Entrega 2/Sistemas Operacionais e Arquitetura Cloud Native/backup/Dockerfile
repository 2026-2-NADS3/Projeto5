# =============================================================================
#  Dockerfile - Servico de backup agendado
# -----------------------------------------------------------------------------
#  Este container e' a PONTE ENTRE A ENTREGA 1 E A ENTREGA 2: ele empacota o
#  script Bash da Parte 1 (adaptado para POSIX shell) e o executa de forma
#  agendada, via cron, dentro de um container proprio.
#
#  Boas praticas aplicadas:
#    1. Imagem base minima: alpine:3.20 tem cerca de 7MB.
#    2. Um unico "apk add --no-cache", o que evita camadas extras e nao deixa
#       o indice de pacotes dentro da imagem.
#    3. Fuso horario configurado, para que o cron dispare no horario de
#       Brasilia e nao em UTC.
#    4. Nenhuma credencial na imagem: tudo chega por variavel de ambiente.
#    5. O cron roda em primeiro plano (crond -f), como manda o modelo de
#       "um processo por container".
#
#  NOTA SOBRE O USUARIO: este container roda como root de proposito. O crond
#  do BusyBox exige privilegios para ler /etc/crontabs, e o container nao
#  expoe nenhuma porta de rede - sua unica superficie e' o volume de backups.
# =============================================================================

FROM alpine:3.20

# postgresql16-client: fornece pg_dump e pg_isready na MESMA versao principal
#   do servidor (postgres:16-alpine). Versoes diferentes fazem o pg_dump
#   recusar a conexao com erro de "server version mismatch".
# tzdata: necessario para que a variavel TZ tenha efeito no cron.
RUN apk add --no-cache \
        postgresql16-client \
        tzdata \
        tar \
        gzip

# Fuso horario de Brasilia (o cron agenda no horario local).
ENV TZ=America/Sao_Paulo
RUN cp /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime && \
    echo "America/Sao_Paulo" > /etc/timezone

# Scripts. O chmod +x acontece no build, nao em tempo de execucao.
COPY backup.sh     /usr/local/bin/backup.sh
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/entrypoint.sh

# Pontos de montagem: /backups recebe o volume persistente, /dados recebe
# (em modo leitura) os arquivos da aplicacao.
VOLUME ["/backups"]

# Verifica se o crond continua vivo dentro do container.
HEALTHCHECK --interval=60s --timeout=5s --start-period=30s --retries=3 \
    CMD pgrep crond > /dev/null || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
