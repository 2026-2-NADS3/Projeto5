import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface RequestAutenticada extends Request {
  aluno?: { id: number };
}

/**
 * Middleware de autenticação JWT da API (RFM01 / RNF de segurança).
 * Espera o cabeçalho "Authorization: Bearer <token>".
 * Sem token ou com token inválido → 401. Válido → anexa o aluno em req.aluno e segue.
 */
export function autenticar(segredo: string) {
  return (req: RequestAutenticada, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ erro: 'token não informado' });
    }
    try {
      const payload = jwt.verify(header.slice(7), segredo) as { sub: string };
      req.aluno = { id: Number(payload.sub) };
      return next();
    } catch {
      return res.status(401).json({ erro: 'token inválido' });
    }
  };
}
