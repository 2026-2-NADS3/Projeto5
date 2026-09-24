# Automação de Backup - Próxima Etapa (Cloud Native - Entrega 1)

## Sobre o Projeto

Este projeto foi desenvolvido para a disciplina de Cloud Native (Entrega 1 do projeto Próxima Etapa) e consiste em um script em Shell/Bash (backup.sh) focado na automação de rotinas de administração de sistemas.

A ideia principal é resolver o problema de backup da base de dados de desenvolvimento da aplicação de forma totalmente automatizada. O script é autosuficiente: quando você roda ele em um ambiente Linux do zero, ele próprio cria a estrutura de pastas necessária, gera um banco de dados fictício para testes (SQLite), compacta os arquivos, registra logs detalhados e cuida da limpeza das cópias mais antigas.

---

## Comandos Linux Utilizados

Para resolver o problema proposto, o script faz uso prático de vários comandos nativos do ecossistema Linux/Unix:

* tar: Responsável por compactar a pasta de dados no formato .tar.gz.


* du & awk: Utilizados em conjunto para calcular e formatar o tamanho final do arquivo gerado.


* ls & tail: Mapeam e ordenam os backups por data para aplicar a regra de retenção de arquivos.


* mkdir & rm: Garantem a criação das pastas necessárias e a remoção dos backups antigos excedentes.


* tee & date: Formatam as mensagens com data/hora e gravam tudo no arquivo de log ao mesmo tempo em que exibem na tela.


* sqlite3: Cria automaticamente a estrutura e os dados do banco fictício de testes (dev_database.db).

---

## Pré-requisitos

* Sistema Operacional: Linux (testado e homologado no Ubuntu).


* Interpretador: Bash (#!/bin/bash).

---

## Como Executar e Usar

Antes de rodar pela primeira vez, dê a permissão de execução para o arquivo com o comando:
chmod +x backup.sh

Você pode rodar o script de duas formas simples:

1. Modo padrão (recomendado): Basta executar ./backup.sh. O script usará os caminhos padrão, criando as pastas ./banco_dev e ./backups, mantendo apenas as 3 cópias mais recentes.


2. Modo personalizado (parâmetros via CLI): Você pode definir a origem, o destino e a quantidade de retenção diretamente pelo terminal no formato ./backup.sh    (exemplo: ./backup.sh ./meu_banco ./meus_backups 5).



---

## Estrutura de Pastas Gerada

Assim que o script roda pela primeira vez, ele organiza o projeto com a seguinte estrutura de arquivos:

proxima_etapa_backups/
├── backup.sh                # Script principal de automação
├── banco_dev/               # Pasta com a base de dados de teste
│   └── dev_database.db     # Banco de dados SQLite criado no provisionamento
├── backups/                 # Pasta onde ficam salvas as cópias compactadas (.tar.gz)
│   └── backup_dev_YYYYMMDD_HHMMSS.tar.gz
└── logs/                    # Histórico de execuções do sistema
└── backup.log           # Arquivo de log auditável

---

## Exemplo de Registro nos Logs (logs/backup.log)

Cada execução registra exatamente o que foi feito com carimbo de data e hora no arquivo logs/backup.log:

[2026-09-23 22:30:00] Criando banco de dados fictício para testes em ./banco_dev...
[2026-09-23 22:30:00] === Iniciando processo de backup ===
[2026-09-23 22:30:00] SUCESSO: Backup criado em ./backups/backup_dev_20260923_223000.tar.gz (Tamanho: 12K)
[2026-09-23 22:30:00] Aplicando retenção (Mantendo apenas os 3 backups mais recentes)...
[2026-09-23 22:30:00] Nenhum backup antigo precisou ser removido.
>>>>>>> c52d41cbabe810ed086f4bb3d3c74244465c1111
[2026-09-23 22:30:00] === Processo de backup concluído com sucesso ===