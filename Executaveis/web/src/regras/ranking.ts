import type { AlunoResumo, ItemRanking } from "../types/dominio";

/**
 * Ranking de melhores alunos — seção 4.4 do documento de implementação.
 *
 * - Critério: número de palestras frequentadas (presenças). Reedição conta de novo.
 * - Desempate: número de badges conquistados no app.
 * - Faltas não descontam (já pesam nos pontos e no bloqueio).
 * - Quem não frequentou nenhuma palestra no período não entra.
 *
 * Função pura, coberta por testes em ranking.test.ts.
 */

export const TOP_DO_MES = 10;
export const TOP_GERAL = 5;

export function montarRanking(
  candidatos: { aluno: AlunoResumo; palestras: number; badges: number }[],
  limite: number,
): ItemRanking[] {
  return candidatos
    .filter((c) => c.palestras > 0)
    .sort(
      (a, b) =>
        b.palestras - a.palestras || b.badges - a.badges || a.aluno.nome.localeCompare(b.aluno.nome, "pt-BR"),
    )
    .slice(0, limite)
    .map((c, indice) => ({ posicao: indice + 1, ...c }));
}
