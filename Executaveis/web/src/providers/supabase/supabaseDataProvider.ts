import type { CrudFilter, CustomParams, DataProvider, GetListParams, GetOneParams, HttpError } from "@refinedev/core";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import { destinatariosDoSegmento, validarMensagem } from "../../regras/comunicacao";
import { deveGerarFalta, justificarFalta, registrarFalta, type EstadoDoAluno } from "../../regras/presenca";
import { montarRanking, TOP_DO_MES, TOP_GERAL } from "../../regras/ranking";
import type {
  AlunoDetalhado,
  AlunoListado,
  AlunoResumo,
  Bloqueio,
  EventoPayload,
  Falta,
  Indicadores,
  Inscricao,
  LetraDisc,
  LetraRiasec,
  LinhaCertificado,
  LinhaPresenca,
  MensagemPayload,
  PalestraDetalhada,
  PalestraPayload,
  PalestraResumo,
  Ranking,
  ResultadoCheckin,
  ResumoCertificados,
  ResumoEncerramento,
} from "../../types/dominio";
import {
  agruparMensagens,
  contarPorLetra,
  diaEmSaoPaulo,
  ehPalestra,
  gerarCodigoValidacao,
  lerQrIngresso,
  letrasDoAluno,
  linhaDeBloqueio,
  linhaDeFalta,
  mesAnterior,
  mesEmSaoPaulo,
  montarQrIngresso,
  normalizarStatus,
  paraAlunoResumo,
  paraBloqueio,
  paraEvento,
  paraFalta,
  paraInscricao,
  paraPalestra,
  paraPresenca,
  situacaoPelasFaltas,
  temDireitoACertificado,
  type LinhaAluno,
  type LinhaBloqueio,
  type LinhaEvento,
  type LinhaFalta,
  type LinhaInscricao,
  type LinhaNotificacao,
  type LinhaPresencaBanco,
  type LinhaResultado,
} from "./mapeamento";

/**
 * Data provider do painel ligado ao Supabase.
 *
 * Tabelas usadas (as mesmas do app Android): eventos, alunos, inscricoes, presencas,
 * certificados, notificacoes, resultados_teste, user_roles; mais faltas e bloqueios,
 * criadas por supabase/painel_admin.sql. Os dados vêm SÓ do banco: nada de mock aqui.
 *
 * Mantém os mesmos nomes de recurso e as mesmas rotas "custom" do mock
 * (src/mocks/mockDataProvider.ts), então as telas não precisam saber de onde vêm os dados.
 *
 * Dúvidas e grupos DISC ainda não têm tabela no banco: as listas vêm vazias e as ações
 * avisam que ainda não estão disponíveis.
 */

/* ---------- Erros ---------- */

function erro(statusCode: number, message: string): HttpError {
  return { statusCode, message };
}

function erroDoBanco(falha: PostgrestError, status?: number): HttpError {
  if (falha.code === "42501" || status === 403) {
    return erro(403, "O banco recusou o acesso. Confira se o arquivo supabase/painel_admin.sql foi rodado e se a conta é admin.");
  }
  if (falha.code === "PGRST301" || status === 401) return erro(401, "Sua sessão expirou. Entre de novo.");
  if (falha.code === "42703") {
    return erro(500, `Coluna ausente no banco (${falha.message}). Rode o arquivo supabase/painel_admin.sql.`);
  }
  if (falha.code === "42P01" || falha.code === "PGRST205") {
    return erro(500, `Tabela ausente no banco (${falha.message}). Rode o arquivo supabase/painel_admin.sql.`);
  }
  return erro(status && status >= 400 ? status : 500, falha.message);
}

/** Resposta do supabase-js → dado, ou lança o erro no formato que o Refine entende. */
function exigir<T>(resposta: { data: T | null; error: PostgrestError | null; status?: number }): T {
  if (resposta.error) throw erroDoBanco(resposta.error, resposta.status);
  return resposta.data as T;
}

const NAO_DISPONIVEL = (oque: string) =>
  erro(501, `${oque} ainda não existe no banco do Supabase. Essa função fica disponível quando a tabela for criada.`);

/* ---------- Leitura em lote (o Supabase devolve no máximo 1000 linhas por vez) ---------- */

const PAGINA = 1000;

async function todos<T>(tabela: string, colunas: string, filtrar?: (q: any) => any): Promise<T[]> {
  const linhas: T[] = [];
  for (let de = 0; ; de += PAGINA) {
    let consulta = supabase.from(tabela).select(colunas);
    if (filtrar) consulta = filtrar(consulta);
    const resposta = (await consulta.range(de, de + PAGINA - 1)) as { data: T[] | null; error: PostgrestError | null; status: number };
    const pagina = exigir<T[]>(resposta);
    linhas.push(...pagina);
    if (pagina.length < PAGINA) return linhas;
  }
}

const COLS_INSCRICAO = "id, aluno_id, evento_id, data_inscricao, status, codigo_ingresso";
const COLS_PRESENCA = "*"; // inclui registro_manual quando a coluna existir
const COLS_FALTA = "id, aluno_id, evento_id, justificada, bloqueio_id, criada_em";
const COLS_BLOQUEIO = "id, aluno_id, inicio, fim, cancelado";

const buscarEventos = () => todos<LinhaEvento>("eventos", "*", (q) => q.order("data_inicio", { ascending: false }));

async function buscarEvento(id: string | number): Promise<LinhaEvento> {
  const linha = exigir<LinhaEvento | null>(await supabase.from("eventos").select("*").eq("id", Number(id)).maybeSingle());
  if (!linha || !ehPalestra(linha)) throw erro(404, "Palestra não encontrada.");
  return linha;
}

/** user_id das contas admin: o admin também tem linha em `alunos` (gatilho do app), mas não é aluno. */
async function idsDeAdmins(): Promise<Set<string>> {
  const linhas = await todos<{ user_id: string }>("user_roles", "user_id", (q) => q.eq("role", "admin"));
  return new Set(linhas.map((l) => l.user_id));
}

async function buscarAlunos(): Promise<LinhaAluno[]> {
  const [alunos, admins] = await Promise.all([
    todos<LinhaAluno>("alunos", "id, user_id, nome, email", (q) => q.order("nome")),
    idsDeAdmins(),
  ]);
  return alunos.filter((a) => !admins.has(a.user_id));
}

async function alunosPorId(ids: number[]): Promise<Map<number, AlunoResumo>> {
  const unicos = [...new Set(ids)];
  if (unicos.length === 0) return new Map();
  const linhas = await todos<LinhaAluno>("alunos", "id, nome, email", (q) => q.in("id", unicos));
  return new Map(linhas.map((l) => [l.id, paraAlunoResumo(l)]));
}

/* ---------- Palestras ---------- */

async function detalharPalestras(eventos: LinhaEvento[]): Promise<PalestraDetalhada[]> {
  const ids = eventos.map((e) => e.id);
  if (ids.length === 0) return [];
  const [inscricoes, presencas] = await Promise.all([
    todos<Pick<LinhaInscricao, "evento_id" | "status">>("inscricoes", "evento_id, status", (q) => q.in("evento_id", ids)),
    todos<Pick<LinhaPresencaBanco, "evento_id" | "aluno_id">>("presencas", "evento_id, aluno_id", (q) => q.in("evento_id", ids)),
  ]);
  return eventos.map((linha) => {
    const status = inscricoes.filter((i) => i.evento_id === linha.id).map((i) => normalizarStatus(i.status));
    return {
      ...paraPalestra(linha),
      evento: paraEvento(linha),
      contagem: {
        confirmados: status.filter((s) => s === "ATIVA").length,
        espera: status.filter((s) => s === "ESPERA" || s === "CONVIDADA").length,
        presentes: new Set(presencas.filter((p) => p.evento_id === linha.id).map((p) => p.aluno_id)).size,
      },
    };
  });
}

async function listarPalestras(): Promise<PalestraDetalhada[]> {
  return detalharPalestras((await buscarEventos()).filter(ehPalestra));
}

async function umaPalestra(id: string): Promise<PalestraDetalhada> {
  const [detalhada] = await detalharPalestras([await buscarEvento(id)]);
  return detalhada;
}

/** "Cadastrar evento novo" no formulário: o conteúdo só vira linha em `eventos` junto com a data (ao salvar a palestra). */
const rascunhosDeEvento = new Map<string, EventoPayload>();

function validarEvento(dados: EventoPayload): void {
  if (!dados.titulo?.trim()) throw erro(422, "Informe o título do evento.");
  if (!Number.isInteger(dados.cargaHoraria) || dados.cargaHoraria <= 0) {
    throw erro(422, "A carga horária precisa ser um número inteiro de horas, maior que zero.");
  }
}

async function conteudoDoEvento(eventoId: string): Promise<Partial<LinhaEvento>> {
  const rascunho = rascunhosDeEvento.get(eventoId);
  if (rascunho) {
    return {
      titulo: rascunho.titulo.trim(),
      descricao: rascunho.descricao.trim() || null,
      carga_horaria: rascunho.cargaHoraria,
      requer_testes: rascunho.tipo === "SOFT_SKILLS",
    };
  }
  const modelo = await buscarEvento(eventoId);
  return {
    titulo: modelo.titulo,
    descricao: modelo.descricao,
    instituicao: modelo.instituicao,
    categoria: modelo.categoria,
    carga_horaria: modelo.carga_horaria,
    requer_testes: modelo.requer_testes,
  };
}

async function validarPalestra(dados: PalestraPayload, palestraId?: string): Promise<void> {
  if (!dados.inicio || !dados.fim) throw erro(422, "Informe data e horários.");
  if (new Date(dados.fim) <= new Date(dados.inicio)) throw erro(422, "O horário de término precisa ser depois do início.");
  if (!Number.isInteger(dados.vagas) || dados.vagas < 1) throw erro(422, "As vagas precisam ser pelo menos 1.");
  if (palestraId) {
    const { count, error } = await supabase
      .from("inscricoes")
      .select("id", { count: "exact", head: true })
      .eq("evento_id", Number(palestraId))
      .eq("status", "ATIVA");
    if (error) throw erroDoBanco(error);
    if ((count ?? 0) > dados.vagas) {
      throw erro(422, `Já há ${count} inscritos confirmados; as vagas não podem ser menos que isso.`);
    }
  }
}

async function criarPalestra(dados: PalestraPayload): Promise<PalestraDetalhada> {
  await validarPalestra(dados);
  const conteudo = await conteudoDoEvento(dados.eventoId);
  const nova = exigir<LinhaEvento>(
    await supabase
      .from("eventos")
      .insert({
        ...conteudo,
        tipo: "CURSO",
        local: dados.sala,
        data_inicio: dados.inicio,
        data_fim: dados.fim,
        total_encontros: 1,
        vagas: dados.vagas,
      })
      .select("*")
      .single(),
  );
  rascunhosDeEvento.delete(dados.eventoId);
  return umaPalestra(String(nova.id));
}

async function editarPalestra(id: string, dados: PalestraPayload): Promise<PalestraDetalhada> {
  const atual = await buscarEvento(id);
  if (atual.lista_encerrada) throw erro(409, "Palestra encerrada não pode ser editada.");
  await validarPalestra(dados, id);
  const conteudo = dados.eventoId !== id ? await conteudoDoEvento(dados.eventoId) : {};
  exigir(
    await supabase
      .from("eventos")
      .update({ ...conteudo, local: dados.sala, data_inicio: dados.inicio, data_fim: dados.fim, vagas: dados.vagas })
      .eq("id", Number(id)),
  );
  rascunhosDeEvento.delete(dados.eventoId);
  return umaPalestra(id);
}

/** Lista de "eventos já cadastrados" do formulário: um por título (o mais recente serve de modelo). */
async function listarEventosModelo() {
  const vistos = new Set<string>();
  return (await buscarEventos())
    .filter(ehPalestra)
    .filter((e) => {
      const chave = e.titulo.trim().toLowerCase();
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    })
    .map(paraEvento)
    .sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
}

/* ---------- Inscrições ---------- */

async function inscricoesDaPalestra(palestraId: string): Promise<Inscricao[]> {
  const linhas = await todos<LinhaInscricao>("inscricoes", COLS_INSCRICAO, (q) =>
    q.eq("evento_id", Number(palestraId)).order("data_inscricao"),
  );
  const alunos = await alunosPorId(linhas.map((l) => l.aluno_id));
  return linhas.map((l) => paraInscricao(l, alunos.get(l.aluno_id) ?? { id: String(l.aluno_id), nome: "Aluno removido", email: "" }));
}

/* ---------- Faltas e bloqueios ---------- */

async function estadosDosAlunos(alunoIds: number[], agora: Date): Promise<Map<number, EstadoDoAluno>> {
  const ids = [...new Set(alunoIds)];
  const estados = new Map<number, EstadoDoAluno>();
  if (ids.length === 0) return estados;
  const [faltas, bloqueios] = await Promise.all([
    todos<LinhaFalta>("faltas", COLS_FALTA, (q) => q.in("aluno_id", ids)),
    todos<LinhaBloqueio>("bloqueios", COLS_BLOQUEIO, (q) => q.in("aluno_id", ids)),
  ]);
  for (const id of ids) {
    const f = faltas.filter((l) => l.aluno_id === id).map(paraFalta);
    const b = bloqueios.filter((l) => l.aluno_id === id).map(paraBloqueio);
    estados.set(id, { faltas: f, bloqueios: b, situacao: situacaoPelasFaltas(f, b, agora) });
  }
  return estados;
}

/** Grava o que mudou no estado do aluno (bloqueios antes das faltas, por causa da referência). */
async function salvarEstado(antes: EstadoDoAluno, depois: EstadoDoAluno): Promise<void> {
  const mudou = <T>(lista: T[], anterior: T[], id: (x: T) => string) =>
    lista.filter((x) => JSON.stringify(x) !== JSON.stringify(anterior.find((a) => id(a) === id(x))));
  const bloqueios = mudou<Bloqueio>(depois.bloqueios, antes.bloqueios, (b) => b.id);
  const faltas = mudou<Falta>(depois.faltas, antes.faltas, (f) => f.id);
  if (bloqueios.length) exigir(await supabase.from("bloqueios").upsert(bloqueios.map(linhaDeBloqueio)));
  if (faltas.length) exigir(await supabase.from("faltas").upsert(faltas.map(linhaDeFalta)));
}

/* ---------- Presença e check-in ---------- */

/** Evento de vários encontros: presença conta por dia. Evento de um dia: qualquer presença já vale. */
function presencaQueVale(presencas: LinhaPresencaBanco[], evento: LinhaEvento, agora: Date): LinhaPresencaBanco | undefined {
  const ordenadas = [...presencas].sort((a, b) => b.registrado_em.localeCompare(a.registrado_em));
  if (evento.total_encontros > 1) return ordenadas.find((p) => p.data_encontro === diaEmSaoPaulo(agora)) ?? ordenadas[0];
  return ordenadas[0];
}

async function listarPresencas(palestraId: string, agora: Date): Promise<LinhaPresenca[]> {
  const evento = await buscarEvento(palestraId);
  const [inscricoes, presencas] = await Promise.all([
    inscricoesDaPalestra(palestraId),
    todos<LinhaPresencaBanco>("presencas", COLS_PRESENCA, (q) => q.eq("evento_id", evento.id)),
  ]);
  const lista = inscricoes.filter((i) => i.status === "ATIVA");
  const estados = await estadosDosAlunos(lista.map((i) => Number(i.aluno.id)), agora);

  return lista.map((i) => {
    const estado = estados.get(Number(i.aluno.id));
    const presenca = presencaQueVale(presencas.filter((p) => String(p.aluno_id) === i.aluno.id), evento, agora);
    return {
      inscricaoId: i.id,
      aluno: { ...i.aluno, ...(estado?.situacao ?? { pontosFalta: 0, bloqueadoAte: null }) },
      presenca: presenca ? paraPresenca(presenca) : null,
      falta: estado?.faltas.find((f) => f.palestraId === palestraId) ?? null,
      cancelouEmCimaDaHora: false, // o banco não guarda a data do cancelamento
    };
  });
}

/** Presença marcada à mão pelo admin: origem LEITOR (valor que o app conhece) + registro_manual. */
async function gravarPresencaManual(evento: LinhaEvento, alunoId: number, agora: Date) {
  const { data: sessao } = await supabase.auth.getUser();
  return supabase
    .from("presencas")
    .insert({
      id: crypto.randomUUID(),
      aluno_id: alunoId,
      evento_id: evento.id,
      data_encontro: diaEmSaoPaulo(agora),
      registrado_em: agora.toISOString(),
      origem: "LEITOR",
      registro_manual: true,
      validado_por: sessao.user?.id ?? null,
    })
    .select(COLS_PRESENCA)
    .single<LinhaPresencaBanco>();
}

async function jaTemPresenca(evento: LinhaEvento, alunoId: number, agora: Date): Promise<boolean> {
  const presencas = await todos<LinhaPresencaBanco>("presencas", COLS_PRESENCA, (q) =>
    q.eq("evento_id", evento.id).eq("aluno_id", alunoId),
  );
  if (evento.total_encontros > 1) return presencas.some((p) => p.data_encontro === diaEmSaoPaulo(agora));
  return presencas.length > 0;
}

interface RespostaValidarIngresso {
  ok: boolean;
  motivo: string;
  mensagem: string;
}

/**
 * Check-in pela câmera. Quem grava é a função validar_ingresso do banco (a mesma regra do app):
 * confere o QR, a janela de horário (1h antes até 1h depois), grava a presença e emite o certificado.
 * Antes, o painel confere se o ingresso é DESTA palestra, o que a função não faz.
 */
async function fazerCheckin(palestraId: string, lido: string): Promise<ResultadoCheckin> {
  const evento = await buscarEvento(palestraId);
  if (evento.lista_encerrada) return { resultado: "lista_encerrada" };

  const qr = lerQrIngresso(lido);
  if (!qr) return { resultado: "qr_invalido" };

  const doQr = exigir<LinhaInscricao | null>(
    await supabase.from("inscricoes").select(COLS_INSCRICAO).eq("id", qr.inscricaoId).eq("codigo_ingresso", qr.codigo).maybeSingle(),
  );
  if (!doQr) return { resultado: "qr_invalido" };
  const aluno = (await alunosPorId([doQr.aluno_id])).get(doQr.aluno_id) ?? null;

  // Ingresso de outra palestra: vale se o aluno também tem inscrição ativa nesta.
  const inscricao =
    doQr.evento_id === evento.id
      ? doQr
      : exigir<LinhaInscricao | null>(
          await supabase.from("inscricoes").select(COLS_INSCRICAO).eq("evento_id", evento.id).eq("aluno_id", doQr.aluno_id).maybeSingle(),
        );
  if (!inscricao || !aluno || normalizarStatus(inscricao.status) !== "ATIVA") return { resultado: "nao_inscrito", aluno };

  const resposta = exigir<RespostaValidarIngresso>(
    await supabase.rpc("validar_ingresso", { p_qr: montarQrIngresso(inscricao.id, inscricao.codigo_ingresso) }),
  );
  switch (resposta.motivo) {
    case "PRESENCA_REGISTRADA":
      return { resultado: "gravada", aluno };
    case "JA_REGISTRADO":
      return { resultado: "ja_registrado", aluno };
    case "INSCRICAO_CANCELADA":
      return { resultado: "nao_inscrito", aluno };
    case "QR_INVALIDO":
    case "INSCRICAO_NAO_ENCONTRADA":
      return { resultado: "qr_invalido" };
    default:
      // FORA_DO_HORARIO, FORA_DO_PERIODO...: a mensagem do banco já explica (ex.: "liberado das 13:00 às 18:00").
      throw erro(409, resposta.mensagem || "Não foi possível registrar a presença agora.");
  }
}

async function marcarPresencaManual(palestraId: string, inscricaoId: string, agora: Date) {
  const evento = await buscarEvento(palestraId);
  if (evento.lista_encerrada) throw erro(409, "A lista desta palestra já foi encerrada.");
  const inscricao = exigir<LinhaInscricao | null>(
    await supabase.from("inscricoes").select(COLS_INSCRICAO).eq("id", inscricaoId).eq("evento_id", evento.id).maybeSingle(),
  );
  if (!inscricao) throw erro(404, "Inscrição não encontrada nesta palestra.");
  if (await jaTemPresenca(evento, inscricao.aluno_id, agora)) return { ok: true };
  const gravada = await gravarPresencaManual(evento, inscricao.aluno_id, agora);
  if (gravada.error?.code === "23505") return { ok: true };
  return paraPresenca(exigir(gravada));
}

async function encerrarLista(palestraId: string, agora: Date): Promise<ResumoEncerramento> {
  const evento = await buscarEvento(palestraId);
  if (evento.lista_encerrada) throw erro(409, "A lista desta palestra já foi encerrada.");
  if (new Date(evento.data_inicio) > agora) throw erro(409, "Só é possível encerrar a lista depois que a palestra começar.");

  const linhas = await listarPresencas(palestraId, agora);
  const ausentes = linhas.filter((l) =>
    deveGerarFalta({ status: "ATIVA", canceladaEm: null }, Boolean(l.presenca), new Date(evento.data_inicio).toISOString()),
  );
  const estados = await estadosDosAlunos(ausentes.map((l) => Number(l.aluno.id)), agora);

  let faltasGeradas = 0;
  let bloqueiosAplicados = 0;
  for (const linha of ausentes) {
    const antes = estados.get(Number(linha.aluno.id))!;
    if (antes.faltas.some((f) => f.palestraId === palestraId)) continue; // já tinha falta nesta palestra
    const { estado, bloqueioAplicado } = registrarFalta(antes, {
      faltaId: crypto.randomUUID(),
      alunoId: linha.aluno.id,
      palestraId,
      agora,
      idDoNovoBloqueio: crypto.randomUUID(),
    });
    await salvarEstado(antes, estado);
    faltasGeradas += 1;
    if (bloqueioAplicado) bloqueiosAplicados += 1;
  }

  exigir(await supabase.from("eventos").update({ lista_encerrada: true }).eq("id", evento.id));
  return { faltasGeradas, bloqueiosAplicados };
}

async function justificar(faltaId: string, agora: Date): Promise<Falta> {
  const linha = exigir<LinhaFalta | null>(await supabase.from("faltas").select(COLS_FALTA).eq("id", faltaId).maybeSingle());
  if (!linha) throw erro(404, "Falta não encontrada.");
  const antes = (await estadosDosAlunos([linha.aluno_id], agora)).get(linha.aluno_id)!;
  const depois = justificarFalta(antes, faltaId, agora);
  await salvarEstado(antes, depois);
  return depois.faltas.find((f) => f.id === faltaId)!;
}

/* ---------- Certificados ---------- */

/**
 * Uma linha por aluno com presença. No banco, o certificado é emitido sozinho no check-in pela câmera
 * (validar_ingresso), quando o aluno tem presença em 75% dos encontros. "Liberar" cobre quem teve presença
 * marcada à mão ou registrada antes dessa regra.
 */
async function listarCertificados(palestraId: string): Promise<LinhaCertificado[]> {
  const evento = await buscarEvento(palestraId);
  const [presencas, certificados] = await Promise.all([
    todos<LinhaPresencaBanco>("presencas", COLS_PRESENCA, (q) => q.eq("evento_id", evento.id).order("registrado_em")),
    todos<{ aluno_id: number; data_emissao: string }>("certificados", "aluno_id, data_emissao", (q) => q.eq("evento_id", evento.id)),
  ]);
  const primeiraPorAluno = new Map<number, LinhaPresencaBanco>();
  for (const p of presencas) if (!primeiraPorAluno.has(p.aluno_id)) primeiraPorAluno.set(p.aluno_id, p);
  const alunos = await alunosPorId([...primeiraPorAluno.keys()]);

  return [...primeiraPorAluno.values()].map((p) => {
    const certificado = certificados.find((c) => c.aluno_id === p.aluno_id);
    return {
      aluno: alunos.get(p.aluno_id) ?? { id: String(p.aluno_id), nome: "Aluno removido", email: "" },
      presenca: paraPresenca(p),
      situacao: certificado ? "LIBERADO" : "PENDENTE",
      liberadoEm: certificado ? new Date(certificado.data_emissao).toISOString() : null,
    };
  });
}

/** Emite, como o banco faz, o certificado e a notificação "Seu certificado está disponível!". */
async function liberarCertificados(palestraId: string): Promise<ResumoCertificados> {
  const evento = await buscarEvento(palestraId);
  const presencas = await todos<LinhaPresencaBanco>("presencas", COLS_PRESENCA, (q) => q.eq("evento_id", evento.id));
  const encontros = (alunoId: number) => new Set(presencas.filter((p) => p.aluno_id === alunoId).map((p) => p.data_encontro)).size;
  const pendentes = (await listarCertificados(palestraId))
    .filter((l) => l.situacao === "PENDENTE")
    .filter((l) => temDireitoACertificado(encontros(Number(l.aluno.id)), evento.total_encontros));
  if (pendentes.length === 0) return { liberados: 0 };

  const emitidos = exigir<{ aluno_id: number }[]>(
    await supabase
      .from("certificados")
      .upsert(
        pendentes.map((l) => ({
          aluno_id: Number(l.aluno.id),
          evento_id: evento.id,
          titulo: evento.titulo,
          instituicao: evento.instituicao,
          carga_horaria: evento.carga_horaria,
          codigo_validacao: gerarCodigoValidacao(),
        })),
        { onConflict: "aluno_id,evento_id", ignoreDuplicates: true },
      )
      .select("aluno_id"),
  );
  if (emitidos.length > 0) {
    exigir(
      await supabase.from("notificacoes").insert(
        emitidos.map((c) => ({
          tipo: "CERTIFICADO",
          titulo: "Seu certificado está disponível!",
          mensagem: `Parabéns! O certificado de "${evento.titulo}" já pode ser baixado em Meus certificados.`,
          evento_id: evento.id,
          aluno_id: c.aluno_id,
        })),
      ),
    );
  }
  return { liberados: emitidos.length };
}

/* ---------- Alunos, dashboard e ranking ---------- */

interface Retrato {
  alunos: LinhaAluno[];
  eventos: LinhaEvento[];
  inscricoes: LinhaInscricao[];
  presencas: LinhaPresencaBanco[];
  resultados: LinhaResultado[];
  faltas: LinhaFalta[];
  bloqueios: LinhaBloqueio[];
}

/** Tudo o que as telas de alunos/dashboard precisam, numa leitura só. */
async function retrato(): Promise<Retrato> {
  const [alunos, eventos, inscricoes, presencas, resultados, faltas, bloqueios] = await Promise.all([
    buscarAlunos(),
    buscarEventos(),
    todos<LinhaInscricao>("inscricoes", COLS_INSCRICAO),
    todos<LinhaPresencaBanco>("presencas", COLS_PRESENCA),
    todos<LinhaResultado>("resultados_teste", "aluno_id, tipo, codigo, data"),
    todos<LinhaFalta>("faltas", COLS_FALTA),
    todos<LinhaBloqueio>("bloqueios", COLS_BLOQUEIO),
  ]);
  return { alunos, eventos: eventos.filter(ehPalestra), inscricoes, presencas, resultados, faltas, bloqueios };
}

/** Palestras frequentadas: uma por evento com presença (vários encontros do mesmo evento contam uma vez). */
function eventosFrequentados(r: Retrato, alunoId: number, filtro: (e: LinhaEvento) => boolean = () => true): number {
  const ids = new Set(r.eventos.filter(filtro).map((e) => e.id));
  return new Set(r.presencas.filter((p) => p.aluno_id === alunoId && ids.has(p.evento_id)).map((p) => p.evento_id)).size;
}

function alunoListado(r: Retrato, aluno: LinhaAluno, agora: Date): AlunoListado {
  const situacao = situacaoPelasFaltas(
    r.faltas.filter((f) => f.aluno_id === aluno.id).map(paraFalta),
    r.bloqueios.filter((b) => b.aluno_id === aluno.id).map(paraBloqueio),
    agora,
  );
  return {
    ...paraAlunoResumo(aluno),
    ...situacao,
    ...letrasDoAluno(r.resultados.filter((x) => x.aluno_id === aluno.id)),
    badges: 0, // badges ainda não existem nas tabelas do app
    palestrasFrequentadas: eventosFrequentados(r, aluno.id),
  };
}

async function listarAlunos(agora: Date): Promise<AlunoListado[]> {
  const r = await retrato();
  return r.alunos.map((a) => alunoListado(r, a, agora));
}

async function detalharAluno(id: string, agora: Date): Promise<AlunoDetalhado> {
  const r = await retrato();
  const aluno = r.alunos.find((a) => String(a.id) === id);
  if (!aluno) throw erro(404, "Aluno não encontrado.");
  const eventos = new Map(r.eventos.map((e) => [e.id, e]));
  const resumo = (eventoId: number): PalestraResumo => {
    const e = eventos.get(eventoId);
    return { id: String(eventoId), inicio: e ? new Date(e.data_inicio).toISOString() : new Date(0).toISOString(), eventoTitulo: e?.titulo ?? "Evento removido" };
  };
  const certificados = await todos<{ id: number; evento_id: number; data_emissao: string }>(
    "certificados",
    "id, evento_id, data_emissao",
    (q) => q.eq("aluno_id", aluno.id),
  );
  const doAluno = <T extends { aluno_id: number }>(lista: T[]) => lista.filter((x) => x.aluno_id === aluno.id);

  return {
    ...alunoListado(r, aluno, agora),
    inscricoes: doAluno(r.inscricoes).map((i) => {
      const m = paraInscricao(i, paraAlunoResumo(aluno));
      return { id: m.id, palestra: resumo(i.evento_id), status: m.status, criadaEm: m.criadaEm, canceladaEm: null };
    }),
    presencas: doAluno(r.presencas).map((p) => {
      const m = paraPresenca(p);
      return { id: m.id, palestra: resumo(p.evento_id), origem: m.origem, registradaEm: m.registradaEm };
    }),
    faltas: doAluno(r.faltas).map((f) => ({ id: f.id, palestra: resumo(f.evento_id), justificada: f.justificada, criadaEm: new Date(f.criada_em).toISOString() })),
    certificados: certificados.map((c) => ({ id: String(c.id), palestra: resumo(c.evento_id), liberadoEm: new Date(c.data_emissao).toISOString() })),
  };
}

function validarMes(mes: string): void {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw erro(400, "Mês inválido. Use o formato AAAA-MM.");
}

async function calcularIndicadores(agora: Date, mes: string): Promise<Indicadores> {
  validarMes(mes);
  const r = await retrato();
  const doMes = (valor: string) => mesEmSaoPaulo(new Date(valor)) === mes;

  let esperados = 0;
  let presentes = 0;
  for (const e of r.eventos.filter((x) => x.lista_encerrada && doMes(x.data_inicio))) {
    const lista = r.inscricoes.filter((i) => i.evento_id === e.id && normalizarStatus(i.status) === "ATIVA");
    esperados += lista.length;
    presentes += lista.filter((i) => r.presencas.some((p) => p.evento_id === e.id && p.aluno_id === i.aluno_id)).length;
  }

  const listados = r.alunos.map((a) => alunoListado(r, a, agora));
  return {
    mes,
    alunosRegistrados: r.alunos.length,
    ativosNaSemana: null, // o app ainda não registra acessos
    palestrasNoMes: r.eventos.filter((e) => doMes(e.data_inicio)).length,
    taxaComparecimentoMes: esperados > 0 ? presentes / esperados : null,
    faltasNoMes: r.faltas.filter((f) => !f.justificada && doMes(f.criada_em)).length,
    bloqueadosAgora: listados.filter((a) => a.bloqueadoAte).length,
    palestrasPorMes: Array.from({ length: 6 }, (_, k) => mesAnterior(mes, 5 - k)).map((m) => ({
      mes: m,
      total: r.eventos.filter((e) => mesEmSaoPaulo(new Date(e.data_inicio)) === m).length,
    })),
    distribuicaoDisc: contarPorLetra<LetraDisc>(["D", "I", "S", "C"], listados.map((a) => a.disc)),
    distribuicaoRiasec: contarPorLetra<LetraRiasec>(["R", "I", "A", "S", "E", "C"], listados.map((a) => a.riasec)),
  };
}

async function calcularRanking(mes: string): Promise<Ranking> {
  validarMes(mes);
  const r = await retrato();
  const candidatos = (filtro?: (e: LinhaEvento) => boolean) =>
    r.alunos.map((a) => ({ aluno: paraAlunoResumo(a), palestras: eventosFrequentados(r, a.id, filtro), badges: 0 }));
  return {
    doMes: montarRanking(candidatos((e) => mesEmSaoPaulo(new Date(e.data_inicio)) === mes), TOP_DO_MES),
    geral: montarRanking(candidatos(), TOP_GERAL),
  };
}

/* ---------- Comunicação ---------- */

async function destinatarios(segmento: Pick<MensagemPayload, "segmento" | "palestraId" | "letraDisc">): Promise<string[]> {
  const r = await retrato();
  const alunos = r.alunos.map((a) => ({ ...paraAlunoResumo(a), disc: letrasDoAluno(r.resultados.filter((x) => x.aluno_id === a.id)).disc }));
  const ativos = new Set(alunos.map((a) => a.id));
  const inscricoes = r.inscricoes
    .map((i) => paraInscricao(i, { id: String(i.aluno_id), nome: "", email: "" }))
    .filter((i) => ativos.has(i.aluno.id));
  return destinatariosDoSegmento(segmento, alunos, inscricoes);
}

async function listarMensagens() {
  const [linhas, alunos] = await Promise.all([
    todos<LinhaNotificacao>("notificacoes", "id, titulo, mensagem, tipo, evento_id, aluno_id, data_publicacao", (q) =>
      q.order("data_publicacao", { ascending: false }),
    ),
    buscarAlunos(),
  ]);
  return agruparMensagens(linhas, alunos.length);
}

async function enviarMensagem(dados: MensagemPayload, agora: Date) {
  const erros = validarMensagem(dados);
  const primeiro = Object.values(erros)[0];
  if (primeiro) throw erro(422, primeiro);

  const ids = await destinatarios(dados);
  if (ids.length === 0) throw erro(422, "Nenhum aluno recebe esta mensagem. Escolha outro segmento.");

  const base = {
    titulo: dados.titulo.trim(),
    mensagem: dados.corpo.trim(),
    tipo: "AVISO",
    data_publicacao: agora.toISOString(),
  };
  const linhas: Omit<LinhaNotificacao, "id">[] =
    dados.segmento === "TODOS"
      ? [{ ...base, aluno_id: null, evento_id: null }]
      : ids.map((alunoId) => ({
          ...base,
          aluno_id: Number(alunoId),
          evento_id: dados.segmento === "PALESTRA" ? Number(dados.palestraId) : null,
        }));
  const gravadas = exigir<{ id: number }[]>(await supabase.from("notificacoes").insert(linhas).select("id"));
  return {
    ...dados,
    letraDisc: dados.segmento === "DISC" ? dados.letraDisc : null,
    id: String(gravadas[0]?.id ?? ""),
    enviadaEm: base.data_publicacao,
    destinatarios: ids.length,
  };
}

/* ---------- Provider do Refine ---------- */

function filtroIgual(filtros: CrudFilter[] | undefined, campo: string): string | undefined {
  const filtro = filtros?.find((f) => "field" in f && f.field === campo && f.operator === "eq");
  return filtro && "value" in filtro ? String(filtro.value) : undefined;
}

function exigirFiltro(filtros: CrudFilter[] | undefined, campo: string, mensagem: string): string {
  const valor = filtroIgual(filtros, campo);
  if (!valor) throw erro(400, mensagem);
  return valor;
}

const lista = <T>(data: T[]) => ({ data, total: data.length });

const provider = {
  getApiUrl: () => import.meta.env.VITE_SUPABASE_URL ?? "",

  getList: async ({ resource, filters }: GetListParams) => {
    const agora = new Date();
    switch (resource) {
      case "palestras":
        return lista(await listarPalestras());
      case "eventos":
        return lista(await listarEventosModelo());
      case "alunos":
        return lista(await listarAlunos(agora));
      case "mensagens":
        return lista(await listarMensagens());
      case "inscricoes":
        return lista(await inscricoesDaPalestra(exigirFiltro(filters, "palestraId", "Informe a palestra para listar inscritos.")));
      case "presencas":
        return lista(await listarPresencas(exigirFiltro(filters, "palestraId", "Informe a palestra para listar a presença."), agora));
      case "certificados":
        return lista(await listarCertificados(exigirFiltro(filters, "palestraId", "Informe a palestra para listar os certificados.")));
      case "duvidas":
      case "grupos":
        return lista([]); // ainda sem tabela no banco
      default:
        throw erro(404, `Recurso "${resource}" não existe no painel.`);
    }
  },

  getOne: async ({ resource, id }: GetOneParams) => {
    switch (resource) {
      case "palestras":
        return { data: await umaPalestra(String(id)) };
      case "eventos":
        return { data: paraEvento(await buscarEvento(String(id))) };
      case "alunos":
        return { data: await detalharAluno(String(id), new Date()) };
      case "duvidas":
        throw NAO_DISPONIVEL("A caixa de dúvidas");
      default:
        throw erro(404, `Recurso "${resource}" não existe no painel.`);
    }
  },

  create: async ({ resource, variables }: { resource: string; variables: unknown }) => {
    if (resource === "eventos") {
      const dados = variables as EventoPayload;
      validarEvento(dados);
      const id = `novo-${crypto.randomUUID()}`;
      rascunhosDeEvento.set(id, dados);
      return { data: { id, ...dados } };
    }
    if (resource === "palestras") return { data: await criarPalestra(variables as PalestraPayload) };
    throw erro(404, `Não é possível criar "${resource}".`);
  },

  update: async ({ resource, id, variables }: { resource: string; id: string | number; variables: unknown }) => {
    if (resource === "palestras") return { data: await editarPalestra(String(id), variables as PalestraPayload) };
    throw erro(404, `Não é possível editar "${resource}".`);
  },

  custom: async ({ url, method, payload, query }: CustomParams) => {
    const agora = new Date();
    const corpo = (payload ?? {}) as Record<string, string>;
    const rota = url.replace(/^.*?\/admin\//, "/admin/");
    const parametros = (query ?? {}) as Record<string, string | undefined>;
    const mes = parametros.mes || mesEmSaoPaulo(agora);
    let m: RegExpMatchArray | null;

    const resultado = await (async () => {
      if (method === "get" && rota === "/admin/dashboard") return calcularIndicadores(agora, mes);
      if (method === "get" && rota === "/admin/ranking") return calcularRanking(mes);
      if (method === "get" && rota === "/admin/mensagens/destinatarios") {
        const ids = await destinatarios({
          segmento: (parametros.segmento ?? "TODOS") as MensagemPayload["segmento"],
          palestraId: parametros.palestraId || null,
          letraDisc: (parametros.letraDisc || null) as MensagemPayload["letraDisc"],
        });
        return { total: ids.length };
      }
      if (method === "post" && rota === "/admin/mensagens") return enviarMensagem(payload as MensagemPayload, agora);
      if ((m = rota.match(/^\/admin\/palestras\/([^/]+)\/checkin$/)) && method === "post") {
        return fazerCheckin(m[1], String(corpo.token ?? ""));
      }
      if ((m = rota.match(/^\/admin\/palestras\/([^/]+)\/presencas$/)) && method === "post") {
        return marcarPresencaManual(m[1], String(corpo.inscricaoId ?? ""), agora);
      }
      if ((m = rota.match(/^\/admin\/palestras\/([^/]+)\/encerrar$/)) && method === "post") return encerrarLista(m[1], agora);
      if ((m = rota.match(/^\/admin\/palestras\/([^/]+)\/certificados$/)) && method === "post") return liberarCertificados(m[1]);
      if ((m = rota.match(/^\/admin\/faltas\/([^/]+)\/justificar$/)) && method === "patch") return justificar(m[1], agora);
      if (/^\/admin\/duvidas\//.test(rota)) throw NAO_DISPONIVEL("A caixa de dúvidas");
      if (/^\/admin\/(palestras\/[^/]+\/grupos|grupos\/)/.test(rota)) throw NAO_DISPONIVEL("A tabela de grupos DISC");
      throw erro(404, `Rota ${method.toUpperCase()} ${rota} não existe no painel.`);
    })();

    return { data: resultado };
  },

  deleteOne: async () => {
    throw erro(405, "Exclusão não faz parte do escopo do painel.");
  },
};

export const supabaseDataProvider = provider as unknown as DataProvider;
