#!/bin/bash

# ==============================================================================
# Projeto: proxima_etapa_backups (Entrega 1 - Cloud Native)
# Descrição: Script auto-executável para provisionamento do ambiente de dev, execução do backup e retenção.
# Uso: ./backup.sh
# ==============================================================================

# Definição de parâmetros padrão caso não sejam passados via CLI
ORIGEM="${1:-./banco_dev}"
DESTINO="${2:-./backups}"
RETENCAO="${3:-3}"
LOG_DIR="./logs"
LOG_FILE="$LOG_DIR/backup.log"

# Garante a existência da estrutura de pastas do projeto
mkdir -p "$ORIGEM" "$DESTINO" "$LOG_DIR"

# Função para gravação de logs auditáveis
registrar_log() {
    local MENSAGEM="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $MENSAGEM" | tee -a "$LOG_FILE"
}

# 1. AUTO-PROVISIONAMENTO DA BASE DE DADOS FICTÍCIA
if [ ! -f "$ORIGEM/dev_database.db" ]; then
    registrar_log "Criando banco de dados fictício para testes em $ORIGEM..."
    if command -v sqlite3 &>/dev/null; then
        sqlite3 "$ORIGEM/dev_database.db" <<EOF
CREATE TABLE IF NOT EXISTS alunos (id INTEGER PRIMARY KEY, nome TEXT, curso TEXT);
INSERT INTO alunos (nome, curso) VALUES ('Carlos Silva', 'Desenvolvimento Web');
INSERT INTO alunos (nome, curso) VALUES ('Ana Souza', 'Programação Mobile');
EOF
    else
        # Fallback caso o sqlite3 não esteja instalado
        echo "ID,NOME,CURSO" > "$ORIGEM/dev_database.csv"
        echo "1,Carlos Silva,Desenvolvimento Web" >> "$ORIGEM/dev_database.csv"
        echo "2,Ana Souza,Programação Mobile" >> "$ORIGEM/dev_database.csv"
    fi
fi

# 2. EXECUÇÃO DO PROCESSAMENTO DE BACKUP
registrar_log "=== Iniciando processo de backup ==="

TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
ARQUIVO_NOME="backup_dev_${TIMESTAMP}.tar.gz"
CAMINHO_FINAL="${DESTINO}/${ARQUIVO_NOME}"

# Compactação dos dados da aplicação (tar/gzip)
tar -czf "$CAMINHO_FINAL" -C "$ORIGEM" . 2>/dev/null

# Verificação do código de retorno
if [ $? -eq 0 ]; then
    TAMANHO=$(du -h "$CAMINHO_FINAL" | awk '{print $1}')
    registrar_log "SUCESSO: Backup criado em $CAMINHO_FINAL (Tamanho: $TAMANHO)"
else
    registrar_log "ERRO: Falha ao criar o arquivo de backup."
    exit 1
fi

# 3. POLÍTICA DE RETENÇÃO (Mantém apenas os N backups mais recentes)
registrar_log "Aplicando retenção (Mantendo apenas os $RETENCAO backups mais recentes)..."
BACKUPS_EXCEDENTES=$(ls -1t "$DESTINO"/backup_dev_*.tar.gz 2>/dev/null | tail -n +$((RETENCAO + 1)))

if [ -n "$BACKUPS_EXCEDENTES" ]; then
    echo "$BACKUPS_EXCEDENTES" | while read -r ARQUIVO_ANTIGO; do
        rm -f "$ARQUIVO_ANTIGO"
        registrar_log "REMOVIDO: Backup antigo apagado -> $ARQUIVO_ANTIGO"
    done
else
    registrar_log "Nenhum backup antigo precisou ser removido."
fi

registrar_log "=== Processo de backup concluído com sucesso ==="
exit 0