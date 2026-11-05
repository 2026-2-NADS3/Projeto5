// =============================================================================
//  server.js - Ponto de entrada da API do Proxima Etapa
// -----------------------------------------------------------------------------
//  Projeto: Proxima Etapa - UC Cloud Native - Entrega 2
//  Camada:  backend (container "api")
// =============================================================================

const express = require('express');
const { pool, aguardarBanco } = require('./db');
const rotasApi = require('./routes/api');

const app = express();
const PORTA = Number(process.env.PORTA_API) || 3000;

app.use(express.json());

// Log simples de cada requisicao, util para acompanhar "docker compose logs".
app.use((req, res, next) => {
  const inicio = Date.now();
  res.on('finish', () => {
    console.log(
      `[api] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - inicio}ms)`
    );
  });
  next();
});

// -----------------------------------------------------------------------------
//  /health - usado pelo HEALTHCHECK do Docker
// -----------------------------------------------------------------------------
//  Responde 200 somente se o banco tambem estiver respondendo. Assim o Docker
//  marca o container como "unhealthy" quando o banco cai.
// -----------------------------------------------------------------------------
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', banco: 'conectado', momento: new Date().toISOString() });
  } catch (erro) {
    res.status(503).json({ status: 'degradado', banco: 'indisponivel', detalhe: erro.message });
  }
});

app.use('/api', rotasApi);

// Rota nao encontrada
app.use((req, res) => {
  res.status(404).json({ erro: `Rota nao encontrada: ${req.method} ${req.originalUrl}` });
});

// -----------------------------------------------------------------------------
//  INICIALIZACAO
// -----------------------------------------------------------------------------
async function iniciar() {
  try {
    await aguardarBanco();
  } catch (erro) {
    console.error('[api] Nao foi possivel conectar ao banco:', erro.message);
    process.exit(1);
  }

  const servidor = app.listen(PORTA, '0.0.0.0', () => {
    console.log(`[api] Servidor ouvindo na porta ${PORTA}`);
  });

  // Encerramento limpo: o Docker envia SIGTERM no "docker compose down".
  // Sem isso o container leva 10 segundos para morrer (timeout forcado).
  const encerrar = (sinal) => {
    console.log(`[api] Recebido ${sinal}. Encerrando...`);
    servidor.close(() => {
      pool.end(() => {
        console.log('[api] Conexoes fechadas. Ate logo.');
        process.exit(0);
      });
    });
  };

  process.on('SIGTERM', () => encerrar('SIGTERM'));
  process.on('SIGINT', () => encerrar('SIGINT'));
}

iniciar();
