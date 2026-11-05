#!/bin/sh Antes de tudo: esse ajuste do iptables não sobrevive a um restart do Codespace. Se amanhã nada conectar, é só repetir:

#bash
#sudo iptables-legacy -P FORWARD ACCEPT
# =============================================================================
#  backup.sh - Backup automatizado  (versao conteinerizada)
# -----------------------------------------------------------------------------
#  EVOLUCAO DO SCRIPT DA ENTREGA 1
#
#  O que mudou em relacao a Parte 1, e por que:
#
#    1. Shell: /bin/sh (BusyBox) em vez de /bin/bash. A imagem Alpine nao traz
#       o Bash, e instalar o Bash so' para isso aumentaria a imagem sem
#       necessidade. As construcoes especificas do Bash ([[ ]], <<<, arrays)
#       foram reescritas em POSIX shell.
#
#    2. Credenciais: antes vinham de "source .env" dentro do script. Agora
#       chegam como VARIAVEIS DE AMBIENTE injetadas pelo docker-compose, que
#       as le do arquivo .env do projeto. O script nao le mais nenhum arquivo
#       de credencial - e nenhuma senha aparece no codigo.
#
#    3. Host do banco: antes era "localhost". Agora e' o NOME DO SERVICO
#       ("db"), resolvido pelo DNS interno da rede Docker.
#
#    4. Destino: antes era uma pasta local. Agora e' um VOLUME Docker
#       montado em /backups, o que faz os pacotes sobreviverem a' destruicao
#       do container.
#
#    5. Log: alem do arquivo em /backups/logs, tudo e' escrito na saida padrao,
#       para aparecer em "docker compose logs backup".
#
#  O que NAO mudou: a logica de rotacao, o tratamento de erros, a verificacao
#  de codigo de retorno e os codigos de saida continuam os mesmos da Parte 1.
# =============================================================================

set -u   # erro ao usar variavel nao definida

# -----------------------------------------------------------------------------
# 1. CONFIGURACAO (vem do ambiente, com valores padrao)
# -----------------------------------------------------------------------------
DESTINO="${DIR_BACKUPS:-/backups}"
ORIGEM="${DIR_DADOS:-/dados}"
MAX_COPIAS="${MAX_COPIAS:-5}"
PREFIXO="${PREFIXO:-proximaetapa}"
ARQ_LOG="$DESTINO/logs/backup.log"

# Credenciais do banco - injetadas pelo docker-compose a partir do .env
DB_HOST="${DB_HOST:-db}"
DB_PORTA="${DB_PORTA:-5432}"
DB_NOME="${DB_NOME:-}"
DB_USUARIO="${DB_USUARIO:-}"
DB_SENHA="${DB_SENHA:-}"

# -----------------------------------------------------------------------------
# 2. FUNCAO DE LOG
# -----------------------------------------------------------------------------
registrar() {
    nivel="$1"
    shift
    linha="$(date '+%Y-%m-%d %H:%M:%S') [$nivel] $*"
    echo "$linha" >> "$ARQ_LOG"
    echo "$linha"
}

# -----------------------------------------------------------------------------
# 3. PREPARACAO E VALIDACAO (tratamento de erros)
# -----------------------------------------------------------------------------
# Em vez de checar o bit de permissao com [ -w ], o script TENTA criar o
# diretorio e escrever um arquivo. Isso vale para qualquer usuario (inclusive
# root, que ignora os bits de permissao) e tambem detecta disco cheio ou
# volume montado como somente leitura.
if ! mkdir -p "$DESTINO/logs" 2>/dev/null; then
    echo "ERRO: nao foi possivel criar $DESTINO/logs" >&2
    exit 4
fi

if ! touch "$DESTINO/.teste_escrita" 2>/dev/null; then
    echo "ERRO: sem permissao de escrita no destino $DESTINO" >&2
    exit 4
fi
rm -f "$DESTINO/.teste_escrita"

registrar INFO "===== Inicio da execucao (container) ====="
registrar INFO "Origem: $ORIGEM | Destino: $DESTINO | Manter: $MAX_COPIAS copias"

# Area temporaria de montagem, apagada mesmo se o script for interrompido.
AREA_TEMP="$(mktemp -d)"
trap 'rm -rf "$AREA_TEMP"' EXIT INT TERM

# -----------------------------------------------------------------------------
# 4. DUMP DO BANCO DE DADOS
# -----------------------------------------------------------------------------
ARQ_DUMP="$AREA_TEMP/banco_${DB_NOME:-dev}.sql"
DUMP_GERADO="nao"

if [ -n "$DB_NOME" ] && [ -n "$DB_USUARIO" ]; then

    if ! command -v pg_dump > /dev/null 2>&1; then
        registrar ERRO "pg_dump nao encontrado na imagem."
    else
        registrar INFO "Gerando dump de '$DB_NOME' em '$DB_HOST:$DB_PORTA'..."

        # A senha vai por variavel de ambiente para nao aparecer na lista de
        # processos (ps) de dentro do container.
        PGPASSWORD="$DB_SENHA" pg_dump \
            --host="$DB_HOST" \
            --port="$DB_PORTA" \
            --username="$DB_USUARIO" \
            --dbname="$DB_NOME" \
            --no-password \
            --file="$ARQ_DUMP" 2>> "$ARQ_LOG"

        if [ "$?" -eq 0 ]; then
            TAM_DUMP="$(du -h "$ARQ_DUMP" | cut -f1)"
            registrar INFO "Dump gerado com sucesso ($TAM_DUMP)."
            DUMP_GERADO="sim"
        else
            registrar ERRO "Falha no pg_dump. Verifique as variaveis do .env."
            rm -f "$ARQ_DUMP"
        fi
    fi
else
    registrar AVISO "Credenciais do banco incompletas. Backup seguira apenas com os arquivos."
fi

# -----------------------------------------------------------------------------
# 5. ARQUIVOS DA APLICACAO
# -----------------------------------------------------------------------------
QTD_ARQUIVOS=0
mkdir -p "$AREA_TEMP/arquivos"

if [ -d "$ORIGEM" ]; then
    cp -r "$ORIGEM"/. "$AREA_TEMP/arquivos/" 2>> "$ARQ_LOG"
    if [ "$?" -ne 0 ]; then
        registrar AVISO "Alguns arquivos de $ORIGEM nao puderam ser copiados."
    fi
    QTD_ARQUIVOS="$(find "$AREA_TEMP/arquivos" -type f | wc -l | tr -d ' ')"
    registrar INFO "$QTD_ARQUIVOS arquivo(s) de aplicacao incluido(s)."
else
    registrar AVISO "Diretorio de dados $ORIGEM nao existe. Backup so' do banco."
fi

# Se nada foi coletado, nao faz sentido gerar um pacote vazio.
if [ "$DUMP_GERADO" = "nao" ] && [ "$QTD_ARQUIVOS" -eq 0 ]; then
    registrar ERRO "Nada a salvar: sem dump e sem arquivos. Abortando."
    exit 5
fi

# -----------------------------------------------------------------------------
# 6. COMPACTACAO
# -----------------------------------------------------------------------------
DATA_HORA="$(date '+%Y-%m-%d_%H-%M-%S')"
NOME_PACOTE="${PREFIXO}_${DATA_HORA}.tar.gz"
CAMINHO_PACOTE="$DESTINO/$NOME_PACOTE"

registrar INFO "Compactando em $NOME_PACOTE ..."
tar -czf "$CAMINHO_PACOTE" -C "$AREA_TEMP" . 2>> "$ARQ_LOG"

if [ "$?" -ne 0 ]; then
    registrar ERRO "Falha na compactacao. Pacote nao gerado."
    rm -f "$CAMINHO_PACOTE"
    exit 6
fi

TAM_PACOTE="$(du -h "$CAMINHO_PACOTE" | cut -f1)"
registrar INFO "Pacote criado: $NOME_PACOTE ($TAM_PACOTE)"

# -----------------------------------------------------------------------------
# 7. ROTACAO - mantem apenas as N copias mais recentes
# -----------------------------------------------------------------------------
#  Reescrito em POSIX shell: o "find -printf" do GNU nao existe no BusyBox,
#  entao a ordenacao usa o proprio nome do arquivo, que comeca com a data no
#  formato AAAA-MM-DD_HH-MM-SS (ordenavel alfabeticamente).
registrar INFO "Verificando rotacao (limite de $MAX_COPIAS copias)..."

REMOVIDOS=0
LISTA_EXCEDENTE="$(ls -1 "$DESTINO" 2>/dev/null \
    | grep "^${PREFIXO}_.*\.tar\.gz$" \
    | sort -r \
    | awk -v limite="$MAX_COPIAS" 'NR > limite')"

if [ -n "$LISTA_EXCEDENTE" ]; then
    # Estrutura de repeticao
    echo "$LISTA_EXCEDENTE" | while IFS= read -r pacote; do
        [ -z "$pacote" ] && continue
        rm -f "$DESTINO/$pacote"
        if [ "$?" -eq 0 ]; then
            registrar INFO "Copia antiga removida: $pacote"
        else
            registrar AVISO "Nao foi possivel remover: $pacote"
        fi
    done
    REMOVIDOS="$(echo "$LISTA_EXCEDENTE" | grep -c .)"
else
    registrar INFO "Nenhuma copia excedente a remover."
fi

# -----------------------------------------------------------------------------
# 8. RESUMO
# -----------------------------------------------------------------------------
TOTAL_ATUAL="$(ls -1 "$DESTINO" 2>/dev/null | grep -c "^${PREFIXO}_.*\.tar\.gz$")"

registrar INFO "Resumo: dump=$DUMP_GERADO | arquivos=$QTD_ARQUIVOS | removidos=$REMOVIDOS | total de copias=$TOTAL_ATUAL"
registrar INFO "===== Fim da execucao (sucesso) ====="

exit 0
