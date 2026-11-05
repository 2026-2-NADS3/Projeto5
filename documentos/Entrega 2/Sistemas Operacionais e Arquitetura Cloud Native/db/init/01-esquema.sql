-- =============================================================================
--  01-esquema.sql - Estrutura do banco "Proxima Etapa"
-- -----------------------------------------------------------------------------
--  COMO ESTE ARQUIVO E' EXECUTADO
--
--  A imagem oficial do PostgreSQL roda automaticamente todo arquivo .sql e .sh
--  encontrado em /docker-entrypoint-initdb.d, em ordem alfabetica, MAS somente
--  quando o diretorio de dados esta vazio - isto e', na PRIMEIRA vez que o
--  volume e' criado.
--
--  Consequencia pratica: alterar este arquivo nao muda um banco que ja' existe.
--  Para recarregar do zero e' preciso apagar o volume:
--
--      docker compose down -v && docker compose up -d
--
--  (o -v apaga os volumes; sem ele os dados persistem, que e' justamente o
--  comportamento que a entrega precisa demonstrar)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ALUNOS
-- -----------------------------------------------------------------------------
CREATE TABLE alunos (
    id         SERIAL PRIMARY KEY,
    nome       VARCHAR(120) NOT NULL,
    email      VARCHAR(120) NOT NULL UNIQUE,
    data_nasc  DATE         NOT NULL,
    bairro     VARCHAR(80),
    cidade     VARCHAR(80)  DEFAULT 'Sao Paulo',
    criado_em  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. CURSOS
-- -----------------------------------------------------------------------------
CREATE TABLE cursos (
    id              SERIAL PRIMARY KEY,
    titulo          VARCHAR(120) NOT NULL,
    descricao       TEXT,
    carga_horaria   INTEGER      NOT NULL CHECK (carga_horaria > 0),
    total_encontros INTEGER      NOT NULL CHECK (total_encontros > 0),
    trilha          VARCHAR(60),
    ativo           BOOLEAN      DEFAULT TRUE
);

-- -----------------------------------------------------------------------------
-- 3. MATRICULAS
-- -----------------------------------------------------------------------------
CREATE TABLE matriculas (
    id             SERIAL PRIMARY KEY,
    aluno_id       INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    curso_id       INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    data_matricula DATE    NOT NULL DEFAULT CURRENT_DATE,
    status         VARCHAR(20) NOT NULL DEFAULT 'ativa'
                   CHECK (status IN ('ativa', 'concluida', 'trancada')),
    UNIQUE (aluno_id, curso_id)
);

-- -----------------------------------------------------------------------------
-- 4. ENCONTROS
-- -----------------------------------------------------------------------------
CREATE TABLE encontros (
    id        SERIAL PRIMARY KEY,
    curso_id  INTEGER      NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    titulo    VARCHAR(120) NOT NULL,
    data_hora TIMESTAMP    NOT NULL,
    local     VARCHAR(120) DEFAULT 'Unidade Santo Amaro - Sala 3',
    online    BOOLEAN      DEFAULT FALSE
);

-- -----------------------------------------------------------------------------
-- 5. PRESENCAS
-- -----------------------------------------------------------------------------
CREATE TABLE presencas (
    id            SERIAL PRIMARY KEY,
    aluno_id      INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    encontro_id   INTEGER NOT NULL REFERENCES encontros(id) ON DELETE CASCADE,
    presente      BOOLEAN NOT NULL DEFAULT TRUE,
    registrado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metodo        VARCHAR(20) DEFAULT 'manual'
                  CHECK (metodo IN ('manual', 'qrcode')),
    UNIQUE (aluno_id, encontro_id)
);

-- -----------------------------------------------------------------------------
-- 6. CERTIFICADOS
-- -----------------------------------------------------------------------------
CREATE TABLE certificados (
    id         SERIAL PRIMARY KEY,
    aluno_id   INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    curso_id   INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    codigo     VARCHAR(40) NOT NULL UNIQUE,
    emitido_em DATE NOT NULL DEFAULT CURRENT_DATE
);

-- -----------------------------------------------------------------------------
-- 7. INDICES
-- -----------------------------------------------------------------------------
-- As consultas do painel filtram e agrupam por estas colunas.
CREATE INDEX idx_matriculas_aluno    ON matriculas (aluno_id);
CREATE INDEX idx_matriculas_curso    ON matriculas (curso_id);
CREATE INDEX idx_presencas_encontro  ON presencas  (encontro_id);
CREATE INDEX idx_encontros_data      ON encontros  (data_hora);

-- -----------------------------------------------------------------------------
-- 8. VIEW DE PARTICIPACAO
-- -----------------------------------------------------------------------------
-- Calcula o percentual de presenca de cada aluno por curso. E' o dado numerico
-- exibido no painel administrativo (GET /api/participacao).
CREATE VIEW vw_participacao_aluno AS
SELECT
    a.id                                  AS aluno_id,
    a.nome                                AS aluno,
    c.id                                  AS curso_id,
    c.titulo                              AS curso,
    c.carga_horaria,
    c.total_encontros,
    COUNT(p.id) FILTER (WHERE p.presente) AS encontros_presentes,
    ROUND(
        COUNT(p.id) FILTER (WHERE p.presente) * 100.0 / c.total_encontros,
        1
    )                                     AS percentual_participacao
FROM matriculas m
JOIN alunos a ON a.id = m.aluno_id
JOIN cursos c ON c.id = m.curso_id
LEFT JOIN encontros e ON e.curso_id = c.id
LEFT JOIN presencas p ON p.encontro_id = e.id AND p.aluno_id = a.id
GROUP BY a.id, a.nome, c.id, c.titulo, c.carga_horaria, c.total_encontros;
