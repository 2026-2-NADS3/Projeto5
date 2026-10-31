import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db';
import { autenticar, RequestAutenticada } from './middlewares/auth';
import { validarQrCode } from './utils/qrcode';
import { calcularPercentualParticipacao } from './utils/participacao';

/**
 * API REST do App do Aluno — rotas usadas nos testes de integração.
 * O app é exportado sem chamar listen(), para o Supertest conseguir testá-lo.
 */
export function criarApp() {
  const app = express();
  app.use(express.json());

  const JWT_SECRET = process.env.JWT_SECRET as string;
  const QR_SECRET = process.env.QR_SECRET as string;
  const auth = autenticar(JWT_SECRET);

  // RFM01 — Login do aluno: devolve um token JWT com o id do aluno em "sub"
  app.post('/auth/login', async (req, res) => {
    const { email, senha } = req.body ?? {};
    if (!email || !senha) return res.status(400).json({ erro: 'email e senha são obrigatórios' });

    const { rows } = await pool.query('SELECT id, senha_hash FROM aluno WHERE email = $1', [email]);
    const aluno = rows[0];
    if (!aluno || !(await bcrypt.compare(senha, aluno.senha_hash))) {
      return res.status(401).json({ erro: 'credenciais inválidas' });
    }
    const token = jwt.sign({ sub: String(aluno.id) }, JWT_SECRET, { expiresIn: '1h' });
    return res.status(200).json({ token });
  });

  // RFM03 — Cursos do aluno autenticado (somente os cursos em que ele está inscrito)
  app.get('/alunos/me/cursos', auth, async (req: RequestAutenticada, res: Response) => {
    const { rows } = await pool.query(
      `SELECT c.id, c.nome, c.carga_horaria AS "cargaHoraria", c.local
         FROM curso c
         JOIN inscricao i ON i.curso_id = c.id
        WHERE i.aluno_id = $1
        ORDER BY c.id`,
      [req.aluno!.id],
    );
    return res.status(200).json(rows);
  });

  // RFM06 — Check-in por QR Code
  app.post('/presencas', auth, async (req: RequestAutenticada, res: Response) => {
    // O QR carrega um token assinado; o campo "atividadeId" identifica o encontro agendado
    const encontroId = validarQrCode(req.body?.qrToken ?? '', QR_SECRET);
    if (encontroId === null) return res.status(400).json({ erro: 'QR Code inválido ou expirado' });

    // O aluno só pode registrar presença em encontro de curso em que está inscrito
    const inscrito = await pool.query(
      `SELECT 1 FROM encontro e JOIN inscricao i ON i.curso_id = e.curso_id
        WHERE e.id = $1 AND i.aluno_id = $2`,
      [encontroId, req.aluno!.id],
    );
    if (inscrito.rowCount === 0) return res.status(403).json({ erro: 'aluno não inscrito neste curso' });

    try {
      const { rows } = await pool.query(
        `INSERT INTO presenca (aluno_id, encontro_id) VALUES ($1, $2)
         RETURNING id, aluno_id AS "alunoId", encontro_id AS "encontroId", registrada_em AS "registradaEm"`,
        [req.aluno!.id, encontroId],
      );
      return res.status(201).json(rows[0]);
    } catch (e: any) {
      // 23505 = violação da restrição UNIQUE (aluno_id, encontro_id): presença duplicada
      if (e.code === '23505') return res.status(409).json({ erro: 'presença já registrada' });
      throw e;
    }
  });

  // RFM07 — Histórico de presença com percentual de participação por curso
  app.get('/presencas/historico', auth, async (req: RequestAutenticada, res: Response) => {
    const alunoId = req.aluno!.id;
    const presencas = await pool.query(
      `SELECT p.encontro_id AS "encontroId", e.curso_id AS "cursoId", e.data_hora AS "dataHora"
         FROM presenca p JOIN encontro e ON e.id = p.encontro_id
        WHERE p.aluno_id = $1
        ORDER BY e.data_hora`,
      [alunoId],
    );
    const resumo = await pool.query(
      `SELECT c.id AS "cursoId", c.nome,
              COUNT(DISTINCT e.id)::int AS "totalEncontros",
              COUNT(DISTINCT p.id)::int AS presencas
         FROM inscricao i
         JOIN curso c ON c.id = i.curso_id
         LEFT JOIN encontro e ON e.curso_id = c.id
         LEFT JOIN presenca p ON p.encontro_id = e.id AND p.aluno_id = i.aluno_id
        WHERE i.aluno_id = $1
        GROUP BY c.id, c.nome
        ORDER BY c.id`,
      [alunoId],
    );
    const cursos = resumo.rows.map((c) => ({
      ...c,
      percentual: calcularPercentualParticipacao(c.presencas, c.totalEncontros),
    }));
    return res.status(200).json({ presencas: presencas.rows, cursos });
  });

  return app;
}
