/**
 * Calcula o percentual de participação do aluno (dado numérico exibido no app).
 * Retorna um número inteiro de 0 a 100. Se não houve encontros, retorna 0
 * em vez de dividir por zero.
 */
export function calcularPercentualParticipacao(presencas: number, totalEncontros: number): number {
  if (!Number.isFinite(presencas) || !Number.isFinite(totalEncontros) || presencas < 0 || totalEncontros < 0) {
    throw new Error('valores inválidos');
  }
  if (totalEncontros === 0) return 0;
  return Math.round((Math.min(presencas, totalEncontros) / totalEncontros) * 100);
}
