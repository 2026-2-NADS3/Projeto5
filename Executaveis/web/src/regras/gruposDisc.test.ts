import { describe, expect, it } from "vitest";
import { formarGrupos, type Participante } from "./gruposDisc";

const pessoas = (letras: string): Participante[] =>
  [...letras].map((l, i) => ({ alunoId: `a${i + 1}`, letra: l === "-" ? null : (l as Participante["letra"]) }));
const letrasDe = (grupo: Participante[]) => grupo.map((p) => p.letra ?? "-").sort().join("");

describe("grupos DISC", () => {
  it("8 pessoas, duas de cada letra: 2 grupos com D, I, S e C", () => {
    expect(formarGrupos(pessoas("DDIISSCC")).map(letrasDe)).toEqual(["CDIS", "CDIS"]);
  });

  it("sem uma letra, completa repetindo só o que não tem como evitar", () => {
    const grupos = formarGrupos(pessoas("DDDDIISS"));
    expect(grupos.every((g) => g.length === 4)).toBe(true);
    expect(grupos.map(letrasDe)).toEqual(["DDIS", "DDIS"]);
  });

  it("quem sobra vai para grupos já formados, que ficam com 5", () => {
    expect(formarGrupos(pessoas("DISCDISCDI")).map((g) => g.length)).toEqual([5, 5]);
  });

  it("menos de 4 pessoas formam um grupo só; ninguém fica de fora", () => {
    const grupos = formarGrupos(pessoas("DI-"));
    expect(grupos).toHaveLength(1);
    expect(grupos[0]).toHaveLength(3);
    expect(formarGrupos([])).toEqual([]);
  });
});
