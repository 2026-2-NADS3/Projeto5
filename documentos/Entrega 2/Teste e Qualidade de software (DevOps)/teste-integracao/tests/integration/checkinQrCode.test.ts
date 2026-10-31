import request from 'supertest';
import jwt from 'jsonwebtoken';
import { criarApp } from '../../src/app';
import { pool } from '../../src/db';
import { prepararBancoDeTeste, SENHA_FICTICIA } from '../../db/seed';
import { gerarTokenQr } from '../../src/utils/qrcode';

// Teste de integração 2 — Check-in por QR Code de ponta a ponta
// Componentes: API (presença + histórico) + banco PostgreSQL de teste
describe('Integração 2 — check-in por QR Code ponta a ponta', () => {
  const app = criarApp();
  const QR_SECRET = process.env.QR_SECRET as string;
  let token: string;

  beforeAll(async () => {
    await prepararBancoDeTeste(pool);
    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'ana.teste@exemplo.com', senha: SENHA_FICTICIA });
    token = login.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('201 → 409 na repetição (1 linha no banco) → 400 com QR expirado → histórico atualizado', async () => {
    const qrValido = gerarTokenQr(1, QR_SECRET); // encontro 1 do curso Preparatório ENEM

    // 1) Primeiro check-in com QR válido → 201
    const primeiro = await request(app)
      .post('/presencas')
      .set('Authorization', `Bearer ${token}`)
      .send({ qrToken: qrValido });
    expect(primeiro.status).toBe(201);
    expect(primeiro.body).toMatchObject({ alunoId: 1, encontroId: 1 });

    // 2) Repetição da mesma requisição → 409 e apenas UMA linha no banco
    const repetido = await request(app)
      .post('/presencas')
      .set('Authorization', `Bearer ${token}`)
      .send({ qrToken: qrValido });
    expect(repetido.status).toBe(409);
    const linhas = await pool.query(
      'SELECT COUNT(*)::int AS total FROM presenca WHERE aluno_id = 1 AND encontro_id = 1',
    );
    expect(linhas.rows[0].total).toBe(1);

    // 3) QR expirado (encontro 2) → 400 e nada gravado
    const qrExpirado = jwt.sign(
      { atividadeId: 2, exp: Math.floor(Date.now() / 1000) - 60 },
      QR_SECRET,
    );
    const expirado = await request(app)
      .post('/presencas')
      .set('Authorization', `Bearer ${token}`)
      .send({ qrToken: qrExpirado });
    expect(expirado.status).toBe(400);

    // 4) Histórico mostra a presença registrada e o percentual atualizado
    const historico = await request(app)
      .get('/presencas/historico')
      .set('Authorization', `Bearer ${token}`);
    expect(historico.status).toBe(200);
    expect(historico.body.presencas).toHaveLength(1);
    expect(historico.body.presencas[0]).toMatchObject({ encontroId: 1, cursoId: 1 });

    const enem = historico.body.cursos.find((c: any) => c.cursoId === 1);
    // 1 presença em 4 encontros = 25%
    expect(enem).toMatchObject({ presencas: 1, totalEncontros: 4, percentual: 25 });
  });
});
