import { describe, expect, it } from "vitest";
import {
  cancelouEmCimaDaHora,
  deveGerarFalta,
  estaBloqueado,
  justificarFalta,
  registrarFalta,
  type EstadoDoAluno,
} from "./presenca";

const INICIO = "2026-11-10T14:00:00.000Z";
const AGORA = new Date("2026-11-10T18:00:00.000Z");
const vazio: EstadoDoAluno = { situacao: { pontosFalta: 0, bloqueadoAte: null }, faltas: [], bloqueios: [] };

function falta(estado: EstadoDoAluno, n: number, agora = AGORA) {
  return registrarFalta(estado, {
    faltaId: `f${n}`,
    alunoId: "a1",
    palestraId: `p${n}`,
    agora,
    idDoNovoBloqueio: `b${n}`,
  });
}

describe("regra das 72h", () => {
  it("cancelar com 72h ou mais de antecedência não gera falta", () => {
    expect(cancelouEmCimaDaHora("2026-11-07T14:00:00.000Z", INICIO)).toBe(false);
    expect(deveGerarFalta({ status: "CANCELADA", canceladaEm: "2026-11-07T14:00:00.000Z" }, false, INICIO)).toBe(false);
  });

  it("cancelar com menos de 72h gera falta", () => {
    expect(deveGerarFalta({ status: "CANCELADA", canceladaEm: "2026-11-08T10:00:00.000Z" }, false, INICIO)).toBe(true);
  });

  it("confirmado sem presença gera falta; com presença, não", () => {
    expect(deveGerarFalta({ status: "ATIVA", canceladaEm: null }, false, INICIO)).toBe(true);
    expect(deveGerarFalta({ status: "ATIVA", canceladaEm: null }, true, INICIO)).toBe(false);
  });

  it("quem está na lista de espera nunca leva falta", () => {
    expect(deveGerarFalta({ status: "ESPERA", canceladaEm: null }, false, INICIO)).toBe(false);
    expect(deveGerarFalta({ status: "CONVIDADA", canceladaEm: null }, false, INICIO)).toBe(false);
  });
});

describe("pontos e bloqueio", () => {
  it("1ª falta soma 1 ponto e não bloqueia", () => {
    const { estado, bloqueioAplicado } = falta(vazio, 1);
    expect(estado.situacao.pontosFalta).toBe(1);
    expect(bloqueioAplicado).toBeNull();
  });

  it("2ª falta bloqueia por 30 dias e zera os pontos", () => {
    const { estado: e1 } = falta(vazio, 1);
    const { estado: e2, bloqueioAplicado } = falta(e1, 2);
    expect(bloqueioAplicado).not.toBeNull();
    expect(e2.situacao.pontosFalta).toBe(0);
    expect(e2.situacao.bloqueadoAte).toBe("2026-12-10T18:00:00.000Z");
    expect(estaBloqueado(e2.situacao, AGORA)).toBe(true);
    expect(estaBloqueado(e2.situacao, new Date("2026-12-11T00:00:00.000Z"))).toBe(false);
  });
});

describe("justificativa", () => {
  it("justificar uma falta que ainda era ponto tira o ponto", () => {
    const { estado } = falta(vazio, 1);
    const depois = justificarFalta(estado, "f1", AGORA);
    expect(depois.situacao.pontosFalta).toBe(0);
    expect(depois.faltas[0].justificada).toBe(true);
  });

  it("justificar uma falta de bloqueio em vigor cancela o bloqueio e a outra falta volta a valer 1 ponto", () => {
    const { estado: e1 } = falta(vazio, 1);
    const { estado: e2 } = falta(e1, 2);
    const depois = justificarFalta(e2, "f2", AGORA);
    expect(depois.situacao.bloqueadoAte).toBeNull();
    expect(depois.situacao.pontosFalta).toBe(1);
    expect(depois.bloqueios[0].cancelado).toBe(true);
  });

  it("justificar duas vezes não muda nada", () => {
    const { estado } = falta(vazio, 1);
    const uma = justificarFalta(estado, "f1", AGORA);
    expect(justificarFalta(uma, "f1", AGORA)).toEqual(uma);
  });
});
