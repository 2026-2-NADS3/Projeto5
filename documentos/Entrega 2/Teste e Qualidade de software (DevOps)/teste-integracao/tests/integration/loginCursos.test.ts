import request from 'supertest';
import { criarApp } from '../../src/app';
import { pool } from '../../src/db';
import { prepararBancoDeTeste, SENHA_FICTICIA } from '../../db/seed';

// Teste de integração 1 — Login e consulta de cursos do aluno
// Componentes: API (autenticação + cursos) + banco PostgreSQL de teste
describe('Integração 1 — login e consulta de cursos do aluno', () => {
  const app = criarApp();

  beforeAll(async () => {
    await prepararBancoDeTeste(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('POST /auth/login → token → GET /alunos/me/cursos retorna só os cursos do aluno', async () => {
    // 1) Login com o aluno fictício Ana Teste
    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'ana.teste@exemplo.com', senha: SENHA_FICTICIA });
    expect(login.status).toBe(200);
    expect(typeof login.body.token).toBe('string');

    // 2) Consulta de cursos com o token recebido
    const cursos = await request(app)
      .get('/alunos/me/cursos')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(cursos.status).toBe(200);
    // Ana está inscrita apenas nos cursos 1 e 2
    expect(cursos.body.map((c: any) => c.id)).toEqual([1, 2]);
    expect(cursos.body[0]).toMatchObject({ nome: 'Preparatório ENEM', cargaHoraria: 40 });

    // Nenhum dado de outro aluno: o curso 3 (só do Bruno) não aparece
    expect(cursos.body.some((c: any) => c.id === 3)).toBe(false);
    // e a resposta não traz e-mail, senha ou dado pessoal de nenhum aluno
    const corpo = JSON.stringify(cursos.body);
    expect(corpo).not.toContain('bruno');
    expect(corpo).not.toContain('senha');
  });

  it('cenário complementar: senha errada → 401 e consulta sem token → 401', async () => {
    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'ana.teste@exemplo.com', senha: 'errada' });
    expect(login.status).toBe(401);

    const cursos = await request(app).get('/alunos/me/cursos');
    expect(cursos.status).toBe(401);
  });
});
