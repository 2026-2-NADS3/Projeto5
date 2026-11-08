import { describe, expect, it } from "vitest";
import { destinatariosDoSegmento, podeResponder, statusAposMensagem, validarMensagem } from "./comunicacao";

const aluno = (id: string, disc: "D" | "I" | "S" | "C" | null) => ({ id, nome: id, email: `${id}@exemplo.test`, disc });
const alunos = [aluno("a1", "D"), aluno("a2", "I"), aluno("a3", null)];
const inscricoes = [
  { palestraId: "p1", status: "ATIVA" as const, aluno: alunos[0] },
  { palestraId: "p1", status: "ESPERA" as const, aluno: alunos[1] },
  { palestraId: "p1", status: "CANCELADA" as const, aluno: alunos[2] },
  { palestraId: "p2", status: "ATIVA" as const, aluno: alunos[2] },
];

describe("destinatários por segmento", () => {
  it("todos inclui todos os alunos cadastrados", () => {
    expect(destinatariosDoSegmento({ segmento: "TODOS", palestraId: null, letraDisc: null }, alunos, inscricoes)).toEqual(["a1", "a2", "a3"]);
  });

  it("palestra inclui confirmados e lista de espera, mas não cancelados", () => {
    expect(destinatariosDoSegmento({ segmento: "PALESTRA", palestraId: "p1", letraDisc: null }, alunos, inscricoes)).toEqual(["a1", "a2"]);
  });

  it("DISC inclui só quem tem a letra; quem não fez o teste fica de fora", () => {
    expect(destinatariosDoSegmento({ segmento: "DISC", palestraId: null, letraDisc: "D" }, alunos, inscricoes)).toEqual(["a1"]);
  });
});

describe("validação da mensagem", () => {
  it("exige título, texto e o alvo do segmento", () => {
    const erros = validarMensagem({ titulo: " ", corpo: "", segmento: "PALESTRA", palestraId: null, letraDisc: null });
    expect(Object.keys(erros).sort()).toEqual(["corpo", "palestraId", "titulo"]);
  });

  it("mensagem completa passa", () => {
    expect(validarMensagem({ titulo: "Aviso", corpo: "Texto", segmento: "TODOS", palestraId: null, letraDisc: null })).toEqual({});
  });
});

describe("dúvidas", () => {
  it("resposta do admin marca como respondida; nova mensagem do aluno reabre", () => {
    expect(statusAposMensagem("ADMIN")).toBe("RESPONDIDA");
    expect(statusAposMensagem("ALUNO")).toBe("ABERTA");
  });

  it("dúvida fechada não aceita resposta", () => {
    expect(podeResponder("FECHADA")).toBe(false);
    expect(podeResponder("ABERTA")).toBe(true);
  });
});
