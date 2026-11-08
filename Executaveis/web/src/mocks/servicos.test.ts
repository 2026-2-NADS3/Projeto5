import { describe, expect, it } from "vitest";
import { db } from "./mockDb";
import { gerarTokenDeTeste } from "./qrToken";
import {
  calcularIndicadores,
  calcularRanking,
  contarDestinatarios,
  definirMembros,
  detalharAluno,
  detalharDuvida,
  enviarMensagem,
  fecharDuvida,
  gerarGrupos,
  encerrarLista,
  fazerCheckin,
  justificar,
  liberarCertificados,
  listarAlunos,
  listarCertificados,
  listarGrupos,
  listarPresencas,
  marcarPresencaManual,
  responderDuvida,
} from "./servicos";

/**
 * Testes do fluxo de presença sobre os dados fictícios do mock.
 * Os mesmos cenários servem de roteiro para os testes de integração da API real.
 */
describe("dados iniciais do mock", () => {
  it("aluno que faltou em duas palestras encerradas está bloqueado", () => {
    expect(db.alunos["alu-4"].bloqueadoAte).not.toBeNull();
    expect(db.alunos["alu-4"].pontosFalta).toBe(0);
  });

  it("aluno que faltou em uma palestra tem 1 ponto", () => {
    expect(db.alunos["alu-9"].pontosFalta).toBe(1);
  });
});

describe("check-in por QR (pal-1, hoje)", () => {
  const agora = new Date();

  it("grava a presença de um inscrito e não duplica no segundo scan", () => {
    const token = gerarTokenDeTeste("alu-4"); // Diego, confirmado na pal-1
    expect(fazerCheckin(db, "pal-1", token, agora).resultado).toBe("gravada");
    expect(fazerCheckin(db, "pal-1", token, agora).resultado).toBe("ja_registrado");
    expect(db.presencas.filter((p) => p.palestraId === "pal-1" && p.alunoId === "alu-4")).toHaveLength(1);
  });

  it("recusa quem não está inscrito e QR inválido ou vencido", () => {
    expect(fazerCheckin(db, "pal-1", gerarTokenDeTeste("alu-20"), agora).resultado).toBe("nao_inscrito");
    expect(fazerCheckin(db, "pal-1", "qualquer-coisa", agora).resultado).toBe("qr_invalido");
    const vencido = gerarTokenDeTeste("alu-5", agora.getTime() - 60 * 60 * 1000);
    expect(fazerCheckin(db, "pal-1", vencido, agora).resultado).toBe("qr_invalido");
  });

  it("encerrar a lista gera falta para ausentes e para quem cancelou em cima da hora", () => {
    marcarPresencaManual(db, "pal-1", db.inscricoes.find((i) => i.palestraId === "pal-1" && i.aluno.id === "alu-5")!.id, agora);
    const antes = listarPresencas(db, "pal-1", agora);
    const ausentes = antes.filter((l) => !l.presenca).length;

    // Encerra no fim da palestra, para o teste não depender da hora em que roda.
    const fim = new Date(db.palestras.find((p) => p.id === "pal-1")!.fim);
    const resumo = encerrarLista(db, "pal-1", fim);
    expect(resumo.faltasGeradas).toBe(ausentes);
    expect(fazerCheckin(db, "pal-1", gerarTokenDeTeste("alu-6"), agora).resultado).toBe("lista_encerrada");

    const canceladoTarde = listarPresencas(db, "pal-1", agora).find((l) => l.cancelouEmCimaDaHora);
    expect(canceladoTarde?.falta).not.toBeNull();
  });

  it("justificar a falta tira o ponto do aluno", () => {
    const linha = listarPresencas(db, "pal-1", agora).find((l) => l.falta && l.aluno.pontosFalta === 1)!;
    justificar(db, linha.falta!.id, agora);
    expect(db.alunos[linha.aluno.id].pontosFalta).toBe(0);
  });
});

describe("certificados", () => {
  const agora = new Date();

  it("dados iniciais: pal-5 já liberada e pal-4 pendente", () => {
    expect(listarCertificados(db, "pal-5").every((l) => l.situacao === "LIBERADO")).toBe(true);
    expect(listarCertificados(db, "pal-4").every((l) => l.situacao === "PENDENTE")).toBe(true);
  });

  it("libera para todos os presentes (QR e manual) uma única vez", () => {
    const presentes = listarCertificados(db, "pal-4");
    expect(presentes.some((l) => l.presenca.origem === "MANUAL")).toBe(true);
    expect(liberarCertificados(db, "pal-4", agora).liberados).toBe(presentes.length);
    expect(listarCertificados(db, "pal-4").every((l) => l.situacao === "LIBERADO")).toBe(true);
    expect(() => liberarCertificados(db, "pal-4", agora)).toThrow("Não há certificados pendentes");
  });

  it("quem já recebeu em outra edição do mesmo evento não recebe de novo", () => {
    // alu-13 recebeu na pal-5 (Currículo) e está inscrito na pal-2 (mesmo evento).
    marcarPresencaManual(db, "pal-2", db.inscricoes.find((i) => i.palestraId === "pal-2" && i.aluno.id === "alu-13")!.id, agora);
    expect(listarCertificados(db, "pal-2").find((l) => l.aluno.id === "alu-13")?.situacao).toBe("JA_RECEBEU");
    expect(() => liberarCertificados(db, "pal-2", agora)).toThrow("Não há certificados pendentes");
  });
});

describe("alunos e ranking", () => {
  const agora = new Date();

  it("lista os 20 alunos cadastrados com a situação de bloqueio", () => {
    const alunos = listarAlunos(db, agora);
    expect(alunos).toHaveLength(20);
    expect(alunos.find((a) => a.id === "alu-4")?.bloqueadoAte).not.toBeNull();
  });

  it("o detalhe do aluno traz presenças e faltas com o título do evento", () => {
    const diego = detalharAluno(db, "alu-4", agora);
    expect(diego.faltas.length).toBeGreaterThanOrEqual(2);
    expect(diego.faltas.every((f) => f.palestra.eventoTitulo)).toBe(true);
    expect(() => detalharAluno(db, "nao-existe", agora)).toThrow("Aluno não encontrado");
  });

  it("ranking geral e do mês seguem presenças e respeitam os limites", () => {
    const { doMes, geral } = calcularRanking(db, agora);
    expect(geral.length).toBeLessThanOrEqual(5);
    expect(doMes.length).toBeLessThanOrEqual(10);
    expect(geral[0].palestras).toBeGreaterThanOrEqual(geral[geral.length - 1].palestras);
    expect(() => calcularRanking(db, agora, "2026-13")).toThrow("Mês inválido");
  });

  it("indicadores trazem os 6 meses e a distribuição DISC de quem fez o teste", () => {
    const indicadores = calcularIndicadores(db, agora);
    expect(indicadores.palestrasPorMes).toHaveLength(6);
    const totalDisc = Object.values(indicadores.distribuicaoDisc).reduce((a, b) => a + b, 0);
    expect(totalDisc).toBe(18); // 2 alunos ainda não fizeram o teste
  });
});

describe("comunicação", () => {
  const agora = new Date();

  it("envia mensagem para os inscritos de uma palestra e grava no histórico", () => {
    const { total } = contarDestinatarios(db, { segmento: "PALESTRA", palestraId: "pal-3", letraDisc: null });
    const mensagem = enviarMensagem(
      db,
      { titulo: "Aviso", corpo: "Sala nova", segmento: "PALESTRA", palestraId: "pal-3", letraDisc: null },
      agora,
    );
    expect(mensagem.destinatarios).toBe(total);
    expect(db.mensagens.some((m) => m.id === mensagem.id)).toBe(true);
  });

  it("recusa mensagem sem título", () => {
    expect(() =>
      enviarMensagem(db, { titulo: "", corpo: "x", segmento: "TODOS", palestraId: null, letraDisc: null }, agora),
    ).toThrow("Informe o título");
  });

  it("responder marca a dúvida como respondida; fechada não aceita resposta", () => {
    expect(responderDuvida(db, "duv-1", "Pode sim, se ele se cadastrar no app.", agora).status).toBe("RESPONDIDA");
    expect(detalharDuvida(db, "duv-1").mensagens.at(-1)?.autor).toBe("ADMIN");
    fecharDuvida(db, "duv-1");
    expect(() => responderDuvida(db, "duv-1", "Mais uma coisa", agora)).toThrow("fechada");
  });
});

describe("grupos DISC", () => {
  it("dados iniciais: a palestra de hoje tem 2 grupos com uma pessoa de cada letra", () => {
    const grupos = listarGrupos(db, "pal-1");
    expect(grupos).toHaveLength(2);
    for (const grupo of grupos) expect(grupo.membros.map((m) => m.letra).sort()).toEqual(["C", "D", "I", "S"]);
  });

  it("palestra padrão não tem grupos; lista encerrada não regera", () => {
    expect(() => gerarGrupos(db, "pal-2")).toThrow("soft skills");
    expect(() => gerarGrupos(db, "pal-4")).toThrow("encerrada");
  });

  it("mover um aluno de grupo tira ele do grupo antigo", () => {
    // Um teste anterior encerrou a pal-1; reabre só aqui para poder ajustar os grupos.
    db.palestras.find((p) => p.id === "pal-1")!.listaEncerrada = false;
    const [g1, g2] = listarGrupos(db, "pal-1");
    const movido = g1.membros[0].aluno.id;
    definirMembros(db, g2.id, [...g2.membros.map((m) => m.aluno.id), movido]);
    const depois = listarGrupos(db, "pal-1");
    expect(depois[0].membros.some((m) => m.aluno.id === movido)).toBe(false);
    expect(depois[1].membros.some((m) => m.aluno.id === movido)).toBe(true);
    expect(() => definirMembros(db, g2.id, [])).toThrow("pelo menos uma pessoa");
  });
});
