import { Pool } from 'pg';

/**
 * Conexão com o PostgreSQL. A URL vem da variável de ambiente DATABASE_URL
 * (.env em produção, .env.test nos testes) — nenhuma credencial fica no código.
 * Todas as consultas usam parâmetros ($1, $2...) para evitar SQL Injection (RNF 5.2).
 */
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
