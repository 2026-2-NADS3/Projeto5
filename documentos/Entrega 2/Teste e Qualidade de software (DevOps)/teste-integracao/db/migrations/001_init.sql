-- Migração equivalente a prisma/schema.prisma (mesmos nomes de tabela e coluna)
CREATE TABLE IF NOT EXISTS aluno (
  id          SERIAL PRIMARY KEY,
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  senha_hash  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS curso (
  id             SERIAL PRIMARY KEY,
  nome           TEXT NOT NULL,
  carga_horaria  INTEGER NOT NULL,
  local          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inscricao (
  aluno_id  INTEGER NOT NULL REFERENCES aluno(id),
  curso_id  INTEGER NOT NULL REFERENCES curso(id),
  PRIMARY KEY (aluno_id, curso_id)
);

CREATE TABLE IF NOT EXISTS encontro (
  id         SERIAL PRIMARY KEY,
  curso_id   INTEGER NOT NULL REFERENCES curso(id),
  data_hora  TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS presenca (
  id             SERIAL PRIMARY KEY,
  aluno_id       INTEGER NOT NULL REFERENCES aluno(id),
  encontro_id    INTEGER NOT NULL REFERENCES encontro(id),
  registrada_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Regra de negócio do briefing: uma única presença por aluno por encontro
  CONSTRAINT presenca_aluno_encontro_unique UNIQUE (aluno_id, encontro_id)
);
