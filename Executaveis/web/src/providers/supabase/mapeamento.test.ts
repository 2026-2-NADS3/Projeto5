import { describe, expect, it } from "vitest";
import type { Bloqueio, Falta } from "../../types/dominio";
import {
  agruparMensagens,
  diaEmSaoPaulo,
  ehPalestra,
  gerarCodigoValidacao,
  lerQrIngresso,
  montarQrIngresso,
  temDireitoACertificado,
  letrasDoAluno,
  mesAnterior,
  normalizarStatus,
  paraEvento,
  paraPalestra,
  situacaoPelasFaltas,
  type LinhaEvento,
  type LinhaNotificacao,
} from "./mapeamento";

const evento: LinhaEvento = {
  id: 7,
  titulo: "Liderança",
  descricao: null,
  instituicao: "FECAP",
  local: "FECAP - Liberdade",
  tipo: "CURSO",
  categoria: "Carreira",
  data_inicio: "2026-11-27T17:00:00+00:00",
  data_fim: "2026-11-27T20:00:00+00:00",
  carga_horaria: 3,
  total_encontros: 1,
  requer_testes: false,
};

describe("eventos do banco → palestra e evento do painel", () => {
  it("usa a mesma linha para palestra e evento", () => {
    const p = paraPalestra(evento);
    expect(p).toMatchObject({ id: "7", eventoId: "7", sala: "FECAP - Liberdade", vagas: null, listaEncerrada: false });
    expect(p.inicio).toBe("2026-11-27T17:00:00.000Z");
    expect(paraEvento(evento)).toEqual({ id: "7", titulo: "Liderança", descricao: "", cargaHoraria: 3, tipo: "PADRAO" });
  });

  it("requer_testes vira soft skills e eventos EXTERNO ficam fora", () => {
    expect(paraEvento({ ...evento, requer_testes: true }).tipo).toBe("SOFT_SKILLS");
    expect(ehPalestra({ tipo: "EXTERNO" })).toBe(false);
    expect(ehPalestra({ tipo: "CURSO" })).toBe(true);
  });

  it("lê vagas e lista encerrada quando as colunas existem", () => {
    expect(paraPalestra({ ...evento, vagas: 40, lista_encerrada: true })).toMatchObject({ vagas: 40, listaEncerrada: true });
  });
});

describe("status e QR", () => {
  it("normaliza o status da inscrição", () => {
    expect(normalizarStatus("ATIVA")).toBe("ATIVA");
    expect(normalizarStatus("cancelada")).toBe("CANCELADA");
    expect(normalizarStatus("CANCELADO")).toBe("CANCELADA");
    expect(normalizarStatus("LISTA_ESPERA")).toBe("ESPERA");
    expect(normalizarStatus("CONFIRMADA")).toBe("ATIVA");
  });

  it("lê o QR do ingresso no formato do app", () => {
    const id = "3f2a9c1e-0000-4000-8000-000000000001";
    expect(lerQrIngresso(` PE:INGRESSO:${id}:PE-AB12CD `)).toEqual({ inscricaoId: id, codigo: "PE-AB12CD" });
    expect(montarQrIngresso(id, "PE-AB12CD")).toBe(`PE:INGRESSO:${id}:PE-AB12CD`);
    expect(lerQrIngresso("PE-AB12CD")).toBeNull();
    expect(lerQrIngresso("PE:OUTRA:coisa:aqui")).toBeNull();
    expect(lerQrIngresso("")).toBeNull();
  });
});

describe("pontos e bloqueio a partir das faltas gravadas", () => {
  const agora = new Date("2026-11-08T12:00:00Z");
  const falta = (id: string, extra: Partial<Falta> = {}): Falta => ({
    id,
    alunoId: "1",
    palestraId: "7",
    justificada: false,
    bloqueioId: null,
    criadaEm: "2026-11-01T00:00:00Z",
    ...extra,
  });
  const bloqueio = (fim: string, cancelado = false): Bloqueio => ({ id: "b1", alunoId: "1", inicio: "2026-11-01T00:00:00Z", fim, cancelado });

  it("conta só faltas não justificadas e sem bloqueio", () => {
    expect(situacaoPelasFaltas([falta("a"), falta("b", { justificada: true })], [], agora)).toEqual({ pontosFalta: 1, bloqueadoAte: null });
  });

  it("bloqueio vigente bloqueia; vencido ou cancelado não", () => {
    const ligadas = [falta("a", { bloqueioId: "b1" }), falta("b", { bloqueioId: "b1" })];
    expect(situacaoPelasFaltas(ligadas, [bloqueio("2026-12-01T00:00:00Z")], agora)).toEqual({
      pontosFalta: 0,
      bloqueadoAte: "2026-12-01T00:00:00Z",
    });
    expect(situacaoPelasFaltas(ligadas, [bloqueio("2026-11-02T00:00:00Z")], agora).bloqueadoAte).toBeNull();
    expect(situacaoPelasFaltas(ligadas, [bloqueio("2026-12-01T00:00:00Z", true)], agora).bloqueadoAte).toBeNull();
  });
});

describe("testes de perfil", () => {
  it("usa o resultado mais recente e a primeira letra do código", () => {
    expect(
      letrasDoAluno([
        { aluno_id: 1, tipo: "DISC", codigo: "S", data: "2026-01-01" },
        { aluno_id: 1, tipo: "DISC", codigo: "I", data: "2026-05-01" },
        { aluno_id: 1, tipo: "RIASEC", codigo: "CE", data: "2026-05-01" },
      ]),
    ).toEqual({ disc: "I", riasec: "C" });
    expect(letrasDoAluno([])).toEqual({ disc: null, riasec: null });
  });
});

describe("histórico de mensagens", () => {
  const n = (id: number, extra: Partial<LinhaNotificacao>): LinhaNotificacao => ({
    id,
    titulo: "Aviso",
    mensagem: "Texto",
    tipo: "AVISO",
    evento_id: null,
    aluno_id: null,
    data_publicacao: "2026-11-08T10:00:00Z",
    ...extra,
  });

  it("junta as notificações por aluno de um mesmo envio", () => {
    const mensagens = agruparMensagens(
      [
        n(1, {}),
        n(2, { aluno_id: 10, evento_id: 7, data_publicacao: "2026-11-08T11:00:00Z" }),
        n(3, { aluno_id: 11, evento_id: 7, data_publicacao: "2026-11-08T11:00:00Z" }),
        n(4, { aluno_id: 12, data_publicacao: "2026-11-08T09:00:00Z" }),
      ],
      30,
    );
    expect(mensagens.map((m) => [m.segmento, m.destinatarios, m.palestraId])).toEqual([
      ["PALESTRA", 2, "7"],
      ["TODOS", 30, null],
      ["DISC", 1, null],
    ]);
  });
});

describe("datas e códigos", () => {
  it("usa o dia de São Paulo, não o de Greenwich", () => {
    expect(diaEmSaoPaulo(new Date("2026-11-09T01:30:00Z"))).toBe("2026-11-08");
  });

  it("volta meses atravessando o ano", () => {
    expect(mesAnterior("2026-02", 3)).toBe("2025-11");
  });

  it("gera código de validação no formato do banco", () => {
    expect(gerarCodigoValidacao(() => 0)).toBe("PE-AAAAAAAA");
    expect(gerarCodigoValidacao()).toMatch(/^PE-[A-F0-9]{8}$/);
  });

  it("certificado exige 75% dos encontros", () => {
    expect(temDireitoACertificado(1, 1)).toBe(true);
    expect(temDireitoACertificado(1, 2)).toBe(false);
    expect(temDireitoACertificado(3, 4)).toBe(true);
    expect(temDireitoACertificado(0, 0)).toBe(false);
  });
});
