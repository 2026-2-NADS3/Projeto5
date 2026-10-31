import { calcularPercentualParticipacao } from '../src/utils/participacao';

// Teste 2 — Cálculo do percentual de participação
describe('Teste 2 — calcularPercentualParticipacao', () => {
  it('6 presenças em 8 encontros = 75%', () => {
    expect(calcularPercentualParticipacao(6, 8)).toBe(75);
  });

  it('0 encontros = 0%, sem erro de divisão por zero', () => {
    expect(() => calcularPercentualParticipacao(0, 0)).not.toThrow();
    expect(calcularPercentualParticipacao(0, 0)).toBe(0);
  });
});
