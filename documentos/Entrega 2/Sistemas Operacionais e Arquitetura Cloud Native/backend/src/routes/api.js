// =============================================================================
//  api.js - Rotas da API do Proxima Etapa
// -----------------------------------------------------------------------------
//  Todas as consultas usam parametros ($1, $2...) em vez de concatenar strings,
//  o que evita SQL injection.
// =============================================================================

const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// -----------------------------------------------------------------------------
//  GET /api/cursos - lista os cursos com o total de matriculas ativas
// -----------------------------------------------------------------------------
router.get('/cursos', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        c.id,
        c.titulo,
        c.descricao,
        c.carga_horaria,
        c.total_encontros,
        c.trilha,
        COUNT(m.id) FILTER (WHERE m.status = 'ativa') AS matriculas_ativas
      FROM cursos c
      LEFT JOIN matriculas m ON m.curso_id = c.id
      WHERE c.ativo = TRUE
      GROUP BY c.id
      ORDER BY c.trilha, c.titulo
    `);
    res.json({ total: rows.length, dados: rows });
  } catch (erro) {
    console.error('[api] GET /cursos:', erro.message);
    res.status(500).json({ erro: 'Falha ao consultar os cursos.' });
  }
});

// -----------------------------------------------------------------------------
//  GET /api/alunos - lista os alunos e quantos cursos cada um faz
// -----------------------------------------------------------------------------
router.get('/alunos', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        a.id,
        a.nome,
        a.email,
        a.bairro,
        COUNT(m.id) FILTER (WHERE m.status = 'ativa') AS cursos_ativos
      FROM alunos a
      LEFT JOIN matriculas m ON m.aluno_id = a.id
      GROUP BY a.id
      ORDER BY a.nome
    `);
    res.json({ total: rows.length, dados: rows });
  } catch (erro) {
    console.error('[api] GET /alunos:', erro.message);
    res.status(500).json({ erro: 'Falha ao consultar os alunos.' });
  }
});

// -----------------------------------------------------------------------------
//  GET /api/participacao - percentual de presenca por aluno/curso
// -----------------------------------------------------------------------------
//  Le a view vw_participacao_aluno criada no script de inicializacao do banco.
//  Este e' o "dado numerico" integrado que aparece no painel administrativo.
// -----------------------------------------------------------------------------
router.get('/participacao', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT aluno, curso, encontros_presentes, total_encontros, percentual_participacao
      FROM vw_participacao_aluno
      ORDER BY percentual_participacao DESC, aluno
    `);
    res.json({ total: rows.length, dados: rows });
  } catch (erro) {
    console.error('[api] GET /participacao:', erro.message);
    res.status(500).json({ erro: 'Falha ao consultar a participacao.' });
  }
});

// -----------------------------------------------------------------------------
//  GET /api/encontros - proximos encontros da agenda
// -----------------------------------------------------------------------------
router.get('/encontros', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        e.id,
        e.titulo,
        e.data_hora,
        e.local,
        e.online,
        c.titulo AS curso
      FROM encontros e
      JOIN cursos c ON c.id = e.curso_id
      ORDER BY e.data_hora
      LIMIT 20
    `);
    res.json({ total: rows.length, dados: rows });
  } catch (erro) {
    console.error('[api] GET /encontros:', erro.message);
    res.status(500).json({ erro: 'Falha ao consultar os encontros.' });
  }
});

// -----------------------------------------------------------------------------
//  POST /api/presencas - registra um check-in
// -----------------------------------------------------------------------------
//  Corpo esperado: { "aluno_id": 1, "encontro_id": 3, "metodo": "qrcode" }
// -----------------------------------------------------------------------------
router.post('/presencas', async (req, res) => {
  const { aluno_id, encontro_id, metodo } = req.body || {};

  // Validacao de entrada
  if (!Number.isInteger(aluno_id) || !Number.isInteger(encontro_id)) {
    return res.status(400).json({
      erro: 'Campos "aluno_id" e "encontro_id" sao obrigatorios e devem ser numeros inteiros.',
    });
  }

  const metodoFinal = metodo === 'qrcode' ? 'qrcode' : 'manual';

  try {
    const { rows } = await pool.query(
      `INSERT INTO presencas (aluno_id, encontro_id, presente, metodo)
       VALUES ($1, $2, TRUE, $3)
       ON CONFLICT (aluno_id, encontro_id)
         DO UPDATE SET presente = TRUE, registrado_em = CURRENT_TIMESTAMP
       RETURNING id, aluno_id, encontro_id, metodo, registrado_em`,
      [aluno_id, encontro_id, metodoFinal]
    );
    res.status(201).json({ mensagem: 'Presenca registrada.', dados: rows[0] });
  } catch (erro) {
    // 23503 = violacao de chave estrangeira (aluno ou encontro inexistente)
    if (erro.code === '23503') {
      return res.status(404).json({ erro: 'Aluno ou encontro nao encontrado.' });
    }
    console.error('[api] POST /presencas:', erro.message);
    res.status(500).json({ erro: 'Falha ao registrar a presenca.' });
  }
});

// -----------------------------------------------------------------------------
//  GET /api/resumo - numeros gerais para os cartoes do painel
// -----------------------------------------------------------------------------
router.get('/resumo', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM alunos)                                  AS total_alunos,
        (SELECT COUNT(*) FROM cursos WHERE ativo = TRUE)               AS total_cursos,
        (SELECT COUNT(*) FROM matriculas WHERE status = 'ativa')       AS matriculas_ativas,
        (SELECT COUNT(*) FROM presencas WHERE presente = TRUE)         AS presencas_registradas,
        (SELECT COUNT(*) FROM encontros WHERE data_hora > NOW())       AS encontros_futuros
    `);
    res.json(rows[0]);
  } catch (erro) {
    console.error('[api] GET /resumo:', erro.message);
    res.status(500).json({ erro: 'Falha ao montar o resumo.' });
  }
});

module.exports = router;
