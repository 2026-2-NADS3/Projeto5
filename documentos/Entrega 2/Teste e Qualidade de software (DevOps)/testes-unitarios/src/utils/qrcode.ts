import jwt from 'jsonwebtoken';

/**
 * Formato proposto para o QR Code de presença: um token JWT assinado pelo servidor
 * contendo o ID da atividade/encontro e prazo de validade (exp).
 * Assim o app não consegue forjar um QR válido sem a chave secreta.
 */

interface PayloadQr {
  atividadeId: number;
}

/** Gera o conteúdo do QR Code (usado pela equipe da ONG no módulo web). */
export function gerarTokenQr(atividadeId: number, segredo: string, validadeSegundos = 900): string {
  return jwt.sign({ atividadeId } as PayloadQr, segredo, { expiresIn: validadeSegundos });
}

/**
 * Valida o QR lido pelo app. Retorna o ID da atividade se o token for válido
 * e estiver dentro do prazo; retorna null se estiver expirado, adulterado ou malformado.
 */
export function validarQrCode(token: string, segredo: string): number | null {
  try {
    const payload = jwt.verify(token, segredo) as PayloadQr;
    return typeof payload.atividadeId === 'number' ? payload.atividadeId : null;
  } catch {
    return null;
  }
}
