import { describe, expect, it } from "vitest";
import { montarRanking } from "./ranking";

const aluno = (id: string, nome: string) => ({ id, nome, email: `${id}@exemplo.test` });

describe("ranking de melhores alunos", () => {
  it("ordena por palestras frequentadas e desempata por badges", () => {
    const ranking = montarRanking(
      [
        { aluno: aluno("a1", "Ana"), palestras: 2, badges: 1 },
        { aluno: aluno("a2", "Bia"), palestras: 3, badges: 0 },
        { aluno: aluno("a3", "Caio"), palestras: 2, badges: 4 },
      ],
      10,
    );
    expect(ranking.map((r) => [r.posicao, r.aluno.id])).toEqual([
      [1, "a2"],
      [2, "a3"],
      [3, "a1"],
    ]);
  });

  it("deixa de fora quem não frequentou e respeita o limite", () => {
    const ranking = montarRanking(
      [
        { aluno: aluno("a1", "Ana"), palestras: 0, badges: 9 },
        { aluno: aluno("a2", "Bia"), palestras: 1, badges: 0 },
        { aluno: aluno("a3", "Caio"), palestras: 1, badges: 1 },
      ],
      1,
    );
    expect(ranking.map((r) => r.aluno.id)).toEqual(["a3"]);
  });
});
