import type { HttpError } from "@refinedev/core";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type {
  LinhaCertificado,
  LinhaPresenca,
  PalestraDetalhada,
  ResultadoCheckin,
  ResumoCertificados,
  ResumoEncerramento,
} from "../types/dominio";
import { db } from "./mockDb";
import { mockDataProvider as api } from "./mockDataProvider";
import { gerarTokenDeTeste } from "./qrToken";

/**
 * Testes de INTEGRAÇÃO: passam pela mesma camada que as telas usam (o data provider,
 * com as rotas /admin/*), que chama os serviços, que aplicam as regras de src/regras.
 * São o roteiro dos testes de integração da API real (seção 10, Fechamento):
 * check-in por QR e encerramento de lista.
 */

// A palestra de hoje (pal-1) começa às 14h. Fixa o relógio 1h depois do fim dela,
// para o teste não depender da hora em que roda. Só a data é simulada; os timers seguem reais.
beforeAll(() => {
  const pal1 = db.palestras.find((p) => p.id === "pal-1")!;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(new Date(pal1.fim).getTime() + 60 * 60 * 1000));
});
afterAll(() => vi.useRealTimers());

const post = async <T>(url: string, payload: object = {}) =>
  (await api.custom!({ url, method: "post", payload })).data as unknown as T;
const presencas = async (palestraId: string) =>
  (await api.getList({ resource: "presencas", filters: [{ field: "palestraId", operator: "eq", value: palestraId }] }))
    .data as unknown as LinhaPresenca[];

async function falhaHttp(promessa: Promise<unknown>): Promise<HttpError> {
  try {
    await promessa;
  } catch (erro) {
    return erro as HttpError;
  }
  throw new Error("A chamada deveria ter falhado.");
}

describe("integração: check-in por QR", () => {
  it("grava a presença, avisa no segundo scan e recusa QR inválido ou de quem não se inscreveu", async () => {
    const token = gerarTokenDeTeste("alu-5"); // Eduarda, confirmada na pal-1

    expect((await post<ResultadoCheckin>("/admin/palestras/pal-1/checkin", { token })).resultado).toBe("gravada");
    expect((await post<ResultadoCheckin>("/admin/palestras/pal-1/checkin", { token })).resultado).toBe("ja_registrado");
    expect((await post<ResultadoCheckin>("/admin/palestras/pal-1/checkin", { token: "qr-falso" })).resultado).toBe("qr_invalido");
    expect(
      (await post<ResultadoCheckin>("/admin/palestras/pal-1/checkin", { token: gerarTokenDeTeste("alu-20") })).resultado,
    ).toBe("nao_inscrito");

    const linha = (await presencas("pal-1")).find((l) => l.aluno.id === "alu-5");
    expect(linha?.presenca?.origem).toBe("QR");
  });
});

describe("integração: encerramento de lista", () => {
  it("palestra que ainda não começou não pode ser encerrada (409)", async () => {
    const erro = await falhaHttp(post("/admin/palestras/pal-2/encerrar"));
    expect(erro.statusCode).toBe(409);
  });

  it("encerrar gera faltas para os ausentes, fecha o check-in e libera certificados só dos presentes", async () => {
    const antes = await presencas("pal-1");
    const ausentes = antes.filter((l) => !l.presenca).length;
    const presentes = antes.filter((l) => l.presenca).length;

    const resumo = await post<ResumoEncerramento>("/admin/palestras/pal-1/encerrar");
    expect(resumo.faltasGeradas).toBe(ausentes);

    const palestra = (await api.getOne({ resource: "palestras", id: "pal-1" })).data as unknown as PalestraDetalhada;
    expect(palestra.listaEncerrada).toBe(true);
    expect((await post<ResultadoCheckin>("/admin/palestras/pal-1/checkin", { token: gerarTokenDeTeste("alu-6") })).resultado).toBe(
      "lista_encerrada",
    );
    expect((await falhaHttp(post("/admin/palestras/pal-1/encerrar"))).statusCode).toBe(409);

    // Justificar uma falta pela rota tira o ponto.
    const comFalta = (await presencas("pal-1")).find((l) => l.falta && !l.cancelouEmCimaDaHora)!;
    const justificada = (await api.custom!({ url: `/admin/faltas/${comFalta.falta!.id}/justificar`, method: "patch" })).data;
    expect(justificada.justificada).toBe(true);

    // Certificados: só presentes; quem já recebeu deste evento em outra edição fica de fora.
    const certificados = (
      await api.getList({ resource: "certificados", filters: [{ field: "palestraId", operator: "eq", value: "pal-1" }] })
    ).data as unknown as LinhaCertificado[];
    expect(certificados).toHaveLength(presentes);
    const pendentes = certificados.filter((c) => c.situacao === "PENDENTE").length;
    expect((await post<ResumoCertificados>("/admin/palestras/pal-1/certificados")).liberados).toBe(pendentes);
  });
});
