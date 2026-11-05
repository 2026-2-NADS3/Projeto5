// =============================================================================
//  db.js - Conexao com o PostgreSQL
// -----------------------------------------------------------------------------
//  Toda a configuracao vem de variaveis de ambiente (arquivo .env), nunca
//  escrita no codigo. O host e' o NOME DO SERVICO do docker-compose ("db"),
//  resolvido pelo DNS interno da rede Docker.
// =============================================================================

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: Number(process.env.DB_PORTA) || 5432,
  database: process.env.DB_NOME,
  user: process.env.DB_USUARIO,
  password: process.env.DB_SENHA,
  max: 10,                       // maximo de conexoes simultaneas no pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Evita que um erro em conexao ociosa derrube o processo inteiro.
pool.on('error', (erro) => {
  console.error('[db] Erro em conexao ociosa do pool:', erro.message);
});

// -----------------------------------------------------------------------------
//  aguardarBanco - espera o Postgres aceitar conexoes
// -----------------------------------------------------------------------------
//  O healthcheck do docker-compose ja' faz o backend esperar, mas esta funcao
//  garante que a API nao morra se o banco demorar mais que o esperado para
//  terminar de carregar os scripts de inicializacao.
async function aguardarBanco(tentativas = 15, intervaloMs = 2000) {
  for (let i = 1; i <= tentativas; i++) {
    try {
      await pool.query('SELECT 1');
      console.log(`[db] Conectado ao banco "${process.env.DB_NOME}" em "${process.env.DB_HOST}".`);
      return true;
    } catch (erro) {
      console.log(`[db] Tentativa ${i}/${tentativas} falhou (${erro.message}). Aguardando...`);
      if (i === tentativas) throw erro;
      await new Promise((r) => setTimeout(r, intervaloMs));
    }
  }
  return false;
}

module.exports = { pool, aguardarBanco };
