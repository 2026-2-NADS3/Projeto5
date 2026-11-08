import type {
  CreateParams,
  CrudFilter,
  CustomParams,
  DataProvider,
  GetListParams,
  GetOneParams,
  HttpError,
  UpdateParams,
} from "@refinedev/core";
import type {
  Evento,
  EventoPayload,
  Inscricao,
  MembrosPayload,
  MensagemPayload,
  Palestra,
  PalestraDetalhada,
  PalestraPayload,
} from "../types/dominio";
import { db, persistir } from "./mockDb";
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
  ErroDeNegocio,
  encerrarLista,
  fazerCheckin,
  justificar,
  liberarCertificados,
  listarAlunos,
  listarCertificados,
  listarDuvidas,
  listarGrupos,
  listarMensagens,
  listarPresencas,
  marcarPresencaManual,
  novoId,
  responderDuvida,
} from "./servicos";

/**
 * Data provider de MOCK: simula as rotas /admin/* da seção 8 do documento.
 *
 * Mapeamento recurso do Refine → rota da API real:
 *   alunos                          → GET /admin/alunos[/:id]
 *   mensagens                       → GET /admin/mensagens
 *   duvidas                         → GET /admin/duvidas[/:id]
 *   grupos (filtro palestraId)      → GET /admin/palestras/:id/grupos
 *   eventos                         → GET/POST /admin/eventos
 *   palestras                       → GET/POST/PUT /admin/palestras[/:id]
 *   inscricoes (filtro palestraId)  → GET /admin/palestras/:id/inscritos
 *   presencas (filtro palestraId)   → GET /admin/palestras/:id/presencas
 *   certificados (filtro palestraId)→ GET /admin/palestras/:id/certificados
 *   custom (url + método)           → GET  /admin/dashboard?mes=AAAA-MM
 *                                     GET  /admin/ranking?mes=AAAA-MM
 *                                     GET  /admin/mensagens/destinatarios?segmento=...
 *                                     POST /admin/mensagens
 *                                     POST /admin/duvidas/:id/respostas
 *                                     PATCH /admin/duvidas/:id/fechar
 *                                     POST /admin/palestras/:id/grupos
 *                                     PUT  /admin/grupos/:id/membros
 *                                     POST /admin/palestras/:id/checkin
 *                                     POST /admin/palestras/:id/presencas
 *                                     POST /admin/palestras/:id/encerrar
 *                                     POST /admin/palestras/:id/certificados
 *                                     PATCH /admin/faltas/:id/justificar
 *
 * No check-in, a API real responde com status HTTP (201, 200, 404, 401); o
 * provider real deve converter isso em `ResultadoCheckin`, que é o que a tela usa.
 *
 * As validações abaixo imitam o que a API deve recusar, para o painel já
 * tratar os erros do jeito certo.
 */

const ATRASO_MS = 250;
const esperar = () => new Promise((resolve) => setTimeout(resolve, ATRASO_MS));

function erro(statusCode: number, message: string): HttpError {
  return { statusCode, message };
}

/** Converte erro de regra de negócio em erro HTTP, como a API faria. */
function comErroHttp<T>(operacao: () => T): T {
  try {
    return operacao();
  } catch (falha) {
    if (falha instanceof ErroDeNegocio) throw erro(falha.statusCode, falha.message);
    throw falha;
  }
}

function filtroIgual(filtros: CrudFilter[] | undefined, campo: string): string | undefined {
  const filtro = filtros?.find((f) => "field" in f && f.field === campo && f.operator === "eq");
  return filtro && "value" in filtro ? String(filtro.value) : undefined;
}

function detalhar(palestra: Palestra): PalestraDetalhada {
  const evento = db.eventos.find((e) => e.id === palestra.eventoId);
  if (!evento) throw erro(500, `Evento ${palestra.eventoId} não encontrado.`);

  const daPalestra = db.inscricoes.filter((i) => i.palestraId === palestra.id);
  return {
    ...palestra,
    evento,
    contagem: {
      confirmados: daPalestra.filter((i) => i.status === "ATIVA").length,
      espera: daPalestra.filter((i) => i.status === "ESPERA" || i.status === "CONVIDADA").length,
      presentes: db.presencas.filter((p) => p.palestraId === palestra.id).length,
    },
  };
}

function validarPalestra(dados: PalestraPayload, palestraId?: string): void {
  if (!db.eventos.some((e) => e.id === dados.eventoId)) throw erro(422, "Escolha um evento válido.");
  if (!dados.inicio || !dados.fim) throw erro(422, "Informe data e horários.");
  if (new Date(dados.fim) <= new Date(dados.inicio)) {
    throw erro(422, "O horário de término precisa ser depois do início.");
  }
  if (!Number.isInteger(dados.vagas) || dados.vagas < 1) throw erro(422, "As vagas precisam ser pelo menos 1.");

  if (palestraId) {
    const confirmados = db.inscricoes.filter((i) => i.palestraId === palestraId && i.status === "ATIVA").length;
    if (dados.vagas < confirmados) {
      throw erro(422, `Já há ${confirmados} inscritos confirmados; as vagas não podem ser menos que isso.`);
    }
  }
}

function validarEvento(dados: EventoPayload): void {
  if (!dados.titulo?.trim()) throw erro(422, "Informe o título do evento.");
  if (!Number.isFinite(dados.cargaHoraria) || dados.cargaHoraria <= 0) {
    throw erro(422, "A carga horária precisa ser maior que zero.");
  }
}

const provider = {
  getApiUrl: () => "mock://admin",

  getList: async ({ resource, filters }: GetListParams) => {
    await esperar();

    if (resource === "alunos") {
      const data = listarAlunos(db, new Date());
      return { data, total: data.length };
    }

    if (resource === "mensagens") {
      const data = listarMensagens(db);
      return { data, total: data.length };
    }

    if (resource === "grupos") {
      const palestraId = filtroIgual(filters, "palestraId");
      if (!palestraId) throw erro(400, "Informe a palestra para listar os grupos.");
      const data = comErroHttp(() => listarGrupos(db, palestraId));
      return { data, total: data.length };
    }

    if (resource === "duvidas") {
      const data = listarDuvidas(db);
      return { data, total: data.length };
    }

    if (resource === "eventos") {
      const data = [...db.eventos].sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
      return { data: data, total: data.length };
    }

    if (resource === "palestras") {
      const data = db.palestras.map(detalhar).sort((a, b) => b.inicio.localeCompare(a.inicio));
      return { data: data, total: data.length };
    }

    if (resource === "inscricoes") {
      const palestraId = filtroIgual(filters, "palestraId");
      if (!palestraId) throw erro(400, "Informe a palestra para listar inscritos.");
      const data: Inscricao[] = db.inscricoes.filter((i) => i.palestraId === palestraId);
      return { data: data, total: data.length };
    }

    if (resource === "presencas") {
      const palestraId = filtroIgual(filters, "palestraId");
      if (!palestraId) throw erro(400, "Informe a palestra para listar a presença.");
      const data = comErroHttp(() => listarPresencas(db, palestraId, new Date()));
      return { data, total: data.length };
    }

    if (resource === "certificados") {
      const palestraId = filtroIgual(filters, "palestraId");
      if (!palestraId) throw erro(400, "Informe a palestra para listar os certificados.");
      const data = comErroHttp(() => listarCertificados(db, palestraId));
      return { data, total: data.length };
    }

    throw erro(404, `Recurso "${resource}" ainda não existe no mock.`);
  },

  getOne: async ({ resource, id }: GetOneParams) => {
    await esperar();

    if (resource === "palestras") {
      const palestra = db.palestras.find((p) => p.id === String(id));
      if (!palestra) throw erro(404, "Palestra não encontrada.");
      return { data: detalhar(palestra) };
    }

    if (resource === "alunos") {
      return { data: comErroHttp(() => detalharAluno(db, String(id), new Date())) };
    }

    if (resource === "duvidas") {
      return { data: comErroHttp(() => detalharDuvida(db, String(id))) };
    }


    if (resource === "eventos") {
      const evento = db.eventos.find((e) => e.id === String(id));
      if (!evento) throw erro(404, "Evento não encontrado.");
      return { data: evento };
    }

    throw erro(404, `Recurso "${resource}" ainda não existe no mock.`);
  },

  create: async ({ resource, variables }: CreateParams) => {
    await esperar();

    if (resource === "eventos") {
      const dados = variables as unknown as EventoPayload;
      validarEvento(dados);
      const evento: Evento = { id: novoId("evt"), ...dados, titulo: dados.titulo.trim() };
      db.eventos.push(evento);
      persistir();
      return { data: evento };
    }

    if (resource === "palestras") {
      const dados = variables as unknown as PalestraPayload;
      validarPalestra(dados);
      const palestra: Palestra = { id: novoId("pal"), ...dados, listaEncerrada: false };
      db.palestras.push(palestra);
      persistir();
      return { data: detalhar(palestra) };
    }

    throw erro(404, `Não é possível criar "${resource}" no mock.`);
  },

  update: async ({ resource, id, variables }: UpdateParams) => {
    await esperar();

    if (resource === "palestras") {
      const indice = db.palestras.findIndex((p) => p.id === String(id));
      if (indice < 0) throw erro(404, "Palestra não encontrada.");
      if (db.palestras[indice].listaEncerrada) throw erro(409, "Palestra encerrada não pode ser editada.");

      const dados = variables as unknown as PalestraPayload;
      validarPalestra(dados, String(id));
      db.palestras[indice] = { ...db.palestras[indice], ...dados };
      persistir();
      return { data: detalhar(db.palestras[indice]) };
    }

    throw erro(404, `Não é possível editar "${resource}" no mock.`);
  },

  custom: async ({ url, method, payload, query }: CustomParams) => {
    await esperar();
    const agora = new Date();
    const corpo = (payload ?? {}) as Record<string, string>;
    const rota = url.replace(/^.*?\/admin\//, "/admin/");
    const parametros = (query ?? {}) as Record<string, string | undefined>;
    const mes = parametros.mes || undefined;

    const resultado = comErroHttp(() => {
      let m: RegExpMatchArray | null;
      if (method === "get" && rota === "/admin/dashboard") return calcularIndicadores(db, agora, mes);
      if (method === "get" && rota === "/admin/ranking") return calcularRanking(db, agora, mes);
      if (method === "get" && rota === "/admin/mensagens/destinatarios") {
        return contarDestinatarios(db, {
          segmento: (parametros.segmento ?? "TODOS") as MensagemPayload["segmento"],
          palestraId: parametros.palestraId || null,
          letraDisc: (parametros.letraDisc || null) as MensagemPayload["letraDisc"],
        });
      }
      if (method === "post" && rota === "/admin/mensagens") {
        return enviarMensagem(db, payload as MensagemPayload, agora);
      }
      if (method === "post" && (m = rota.match(/^\/admin\/duvidas\/([^/]+)\/respostas$/))) {
        return responderDuvida(db, m[1], String(corpo.texto ?? ""), agora);
      }
      if (method === "patch" && (m = rota.match(/^\/admin\/duvidas\/([^/]+)\/fechar$/))) {
        return fecharDuvida(db, m[1]);
      }
      if (method === "post" && (m = rota.match(/^\/admin\/palestras\/([^/]+)\/grupos$/))) {
        return gerarGrupos(db, m[1]);
      }
      if (method === "put" && (m = rota.match(/^\/admin\/grupos\/([^/]+)\/membros$/))) {
        return definirMembros(db, m[1], (payload as MembrosPayload).alunoIds ?? []);
      }
      if (method === "post" && (m = rota.match(/^\/admin\/palestras\/([^/]+)\/checkin$/))) {
        return fazerCheckin(db, m[1], String(corpo.token ?? ""), agora);
      }
      if (method === "post" && (m = rota.match(/^\/admin\/palestras\/([^/]+)\/presencas$/))) {
        return marcarPresencaManual(db, m[1], String(corpo.inscricaoId ?? ""), agora);
      }
      if (method === "post" && (m = rota.match(/^\/admin\/palestras\/([^/]+)\/encerrar$/))) {
        return encerrarLista(db, m[1], agora);
      }
      if (method === "post" && (m = rota.match(/^\/admin\/palestras\/([^/]+)\/certificados$/))) {
        return liberarCertificados(db, m[1], agora);
      }
      if (method === "patch" && (m = rota.match(/^\/admin\/faltas\/([^/]+)\/justificar$/))) {
        return justificar(db, m[1], agora);
      }
      throw erro(404, `Rota ${method.toUpperCase()} ${rota} não existe no mock.`);
    });

    persistir();
    return { data: resultado };
  },

  deleteOne: async () => {
    throw erro(405, "Exclusão não faz parte do escopo do painel.");
  },
};

/**
 * O DataProvider do Refine é genérico (cada chamada escolhe o tipo do dado);
 * o mock devolve tipos concretos do domínio, por isso a conversão aqui.
 * As telas tipam o retorno com os tipos de src/types/dominio.ts.
 */
export const mockDataProvider = provider as unknown as DataProvider;
