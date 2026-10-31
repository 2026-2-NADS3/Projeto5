import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { autenticar, RequestAutenticada } from '../../src/middlewares/auth';

// Teste 4 — Middleware de autenticação JWT com requisição e resposta simuladas
describe('Teste 4 — middleware autenticar', () => {
  const SEGREDO = 'segredo-de-teste';
  const middleware = autenticar(SEGREDO);

  function respostaSimulada() {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  }

  it('requisição sem token → 401', () => {
    const req = { headers: {} } as RequestAutenticada;
    const res = respostaSimulada();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('token inválido → 401', () => {
    const req = { headers: { authorization: 'Bearer token-falso' } } as RequestAutenticada;
    const res = respostaSimulada();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('token válido → acesso liberado com o aluno identificado', () => {
    const token = jwt.sign({ sub: '1' }, SEGREDO, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } } as RequestAutenticada;
    const res = respostaSimulada();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.aluno).toEqual({ id: 1 });
  });
});
