import { describe, expect, it } from "vitest";
import { alunosParaLiberar, situacaoDoCertificado } from "./certificado";

const PALESTRA = { id: "p2", eventoId: "e1" };

describe("situação do certificado", () => {
  it("presente sem certificado liberado fica pendente", () => {
    expect(situacaoDoCertificado([], PALESTRA)).toBe("PENDENTE");
  });

  it("liberado nesta palestra aparece como liberado", () => {
    expect(situacaoDoCertificado([{ eventoId: "e1", palestraId: "p2" }], PALESTRA)).toBe("LIBERADO");
  });

  it("quem já recebeu em outra edição do mesmo evento não recebe outro", () => {
    expect(situacaoDoCertificado([{ eventoId: "e1", palestraId: "p1" }], PALESTRA)).toBe("JA_RECEBEU");
  });

  it("certificado de outro evento não conta", () => {
    expect(situacaoDoCertificado([{ eventoId: "e9", palestraId: "p9" }], PALESTRA)).toBe("PENDENTE");
  });
});

describe("liberação em lote", () => {
  it("libera só os presentes pendentes, sem repetir aluno", () => {
    const liberados = [
      { alunoId: "a1", eventoId: "e1", palestraId: "p2" }, // já liberado aqui
      { alunoId: "a2", eventoId: "e1", palestraId: "p1" }, // já recebeu noutra edição
      { alunoId: "a3", eventoId: "e9", palestraId: "p9" }, // outro evento
    ];
    expect(alunosParaLiberar(["a1", "a2", "a3", "a4", "a4"], liberados, PALESTRA)).toEqual(["a3", "a4"]);
  });
});
