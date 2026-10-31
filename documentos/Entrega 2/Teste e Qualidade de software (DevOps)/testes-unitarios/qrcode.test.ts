import jwt from 'jsonwebtoken';
import { gerarTokenQr, validarQrCode } from '../src/utils/qrcode';

// Teste 3 — Validação do QR Code
describe('Teste 3 — validarQrCode', () => {
  const SEGREDO = 'segredo-de-teste';

  it('token válido retorna o ID da atividade', () => {
    const token = gerarTokenQr(10, SEGREDO);
    expect(validarQrCode(token, SEGREDO)).toBe(10);
  });

  it('token expirado é rejeitado', () => {
    // exp no passado (1 minuto atrás)
    const expirado = jwt.sign({ atividadeId: 10, exp: Math.floor(Date.now() / 1000) - 60 }, SEGREDO);
    expect(validarQrCode(expirado, SEGREDO)).toBeNull();
  });

  it('token com assinatura alterada é rejeitado', () => {
    const token = gerarTokenQr(10, SEGREDO);
    const partes = token.split('.');
    // troca um caractere do meio da assinatura (o último pode conter só bits de preenchimento)
    const assinatura = partes[2].split('');
    const meio = Math.floor(assinatura.length / 2);
    assinatura[meio] = assinatura[meio] === 'A' ? 'B' : 'A';
    const adulterado = `${partes[0]}.${partes[1]}.${assinatura.join('')}`;
    expect(validarQrCode(adulterado, SEGREDO)).toBeNull();
  });
});
