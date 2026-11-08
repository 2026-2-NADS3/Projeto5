/**
 * Token do QR Code — versão de TESTE.
 *
 * Na API real, o app pede GET /app/me/qr-token e recebe um JWT curto, assinado
 * pelo servidor, com o id do aluno (seção 5 do documento). O painel só lê o QR e
 * repassa o texto para POST /admin/palestras/:id/checkin; quem valida é a API.
 *
 * Aqui o token é só um texto com prefixo e validade, para o mock conseguir
 * simular leituras válidas, expiradas e inválidas.
 */
const PREFIXO = "PE-TESTE.";
const VALIDADE_MS = 10 * 60 * 1000;

interface ConteudoToken {
  alunoId: string;
  expiraEm: number;
}

export function gerarTokenDeTeste(alunoId: string, agora = Date.now()): string {
  const conteudo: ConteudoToken = { alunoId, expiraEm: agora + VALIDADE_MS };
  return PREFIXO + btoa(JSON.stringify(conteudo));
}

/** Devolve o id do aluno se o token for válido e estiver no prazo; senão, null. */
export function lerTokenDeTeste(token: string, agora = Date.now()): string | null {
  if (!token.startsWith(PREFIXO)) return null;
  try {
    const conteudo = JSON.parse(atob(token.slice(PREFIXO.length))) as ConteudoToken;
    if (typeof conteudo.alunoId !== "string" || conteudo.expiraEm < agora) return null;
    return conteudo.alunoId;
  } catch {
    return null;
  }
}
