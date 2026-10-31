import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

/**
 * Prepara o banco de TESTE: cria as tabelas (migração) e insere SOMENTE dados fictícios.
 * Nenhum dado real de aluno da Próxima Etapa é usado (LGPD, RNF 5.2).
 *
 * Alunos:  1 Ana Teste   — inscrita nos cursos 1 e 2
 *          2 Bruno Teste — inscrito nos cursos 2 e 3
 * Curso 1 (Preparatório ENEM) tem 4 encontros; curso 2 tem 2; curso 3 tem 1.
 */
export const SENHA_FICTICIA = 'senha123';

export async function prepararBancoDeTeste(pool: Pool) {
  const sql = fs.readFileSync(path.join(__dirname, 'migrations', '001_init.sql'), 'utf8');
  await pool.query(sql);
  await pool.query('TRUNCATE presenca, encontro, inscricao, curso, aluno RESTART IDENTITY CASCADE');

  const hash = await bcrypt.hash(SENHA_FICTICIA, 8);
  await pool.query(
    `INSERT INTO aluno (nome, email, senha_hash) VALUES
       ('Ana Teste', 'ana.teste@exemplo.com', $1),
       ('Bruno Teste', 'bruno.teste@exemplo.com', $1)`,
    [hash],
  );
  await pool.query(
    `INSERT INTO curso (nome, carga_horaria, local) VALUES
       ('Preparatório ENEM', 40, 'FECAP - Sala 101'),
       ('Orientação Profissional', 12, 'Online'),
       ('Inglês Básico', 20, 'FECAP - Sala 203')`,
  );
  await pool.query(`INSERT INTO inscricao (aluno_id, curso_id) VALUES (1, 1), (1, 2), (2, 2), (2, 3)`);
  await pool.query(
    `INSERT INTO encontro (curso_id, data_hora) VALUES
       (1, '2026-10-15 19:00-03'), (1, '2026-10-22 19:00-03'),
       (1, '2026-10-29 19:00-03'), (1, '2026-11-05 19:00-03'),
       (2, '2026-10-20 18:00-03'), (2, '2026-10-27 18:00-03'),
       (3, '2026-10-21 10:00-03')`,
  );
}
