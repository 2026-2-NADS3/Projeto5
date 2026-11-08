import { alunosParaLiberar, situacaoDoCertificado } from "../regras/certificado";
import { embaralharAleatorio, formarGrupos } from "../regras/gruposDisc";
import { destinatariosDoSegmento, LIMITE_RESPOSTA, podeResponder, statusAposMensagem, validarMensagem } from "../regras/comunicacao";
import { montarRanking, TOP_DO_MES, TOP_GERAL } from "../regras/ranking";
import { deveGerarFalta, entraNaLista, justificarFalta, registrarFalta, situacaoVigente, type EstadoDoAluno } from "../regras/presenca";
import type {
  AlunoDetalhado,
  AlunoListado,
  AlunoResumo,
  Bloqueio,
  CertificadoLiberado,
  ContagemDestinatarios,
  Duvida,
  DuvidaResumo,
  Evento,
  Falta,
  GrupoDisc,
  Indicadores,
  Inscricao,
  LetraDisc,
  LetraRiasec,
  LinhaCertificado,
  LinhaPresenca,
  Mensagem,
  MensagemPayload,
  OrigemPresenca,
  Palestra,
  PalestraResumo,
  PerfilAluno,
  Presenca,
  Ranking,
  ResultadoCheckin,
  ResumoCertificados,
  ResumoEncerramento,
  SituacaoAluno,
} from "../types/dominio";
import { lerTokenDeTeste } from "./qrToken";

/**
 * Operações de negócio do mock — o equivalente à camada de serviço da API.
 * Todas recebem o "banco" como parâmetro e usam as regras de src/regras/presenca.ts.
 */

export interface Banco {
  eventos: Evento[];
  palestras: Palestra[];
  inscricoes: Inscricao[];
  cadastros: (AlunoResumo & PerfilAluno)[]; // contas do app (dados mínimos + testes e badges)
  alunos: Record<string, SituacaoAluno>;
  presencas: Presenca[];
  faltas: Falta[];
  bloqueios: Bloqueio[];
  certificados: CertificadoLiberado[];
  mensagens: Mensagem[];
  duvidas: Duvida[];
  grupos: GrupoDisc[];
}

export class ErroDeNegocio extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function novoId(prefixo: string): string {
  return `${prefixo}-${crypto.randomUUID().slice(0, 8)}`;
}

function buscarPalestra(banco: Banco, palestraId: string): Palestra {
  const palestra = banco.palestras.find((p) => p.id === palestraId);
  if (!palestra) throw new ErroDeNegocio(404, "Palestra não encontrada.");
  return palestra;
}

function situacaoDoAluno(banco: Banco, alunoId: string, agora: Date): SituacaoAluno {
  return situacaoVigente(banco.alunos[alunoId] ?? { pontosFalta: 0, bloqueadoAte: null }, agora);
}

function estadoDoAluno(banco: Banco, alunoId: string, agora: Date): EstadoDoAluno {
  return {
    situacao: situacaoDoAluno(banco, alunoId, agora),
    faltas: banco.faltas.filter((f) => f.alunoId === alunoId),
    bloqueios: banco.bloqueios.filter((b) => b.alunoId === alunoId),
  };
}

function salvarEstadoDoAluno(banco: Banco, alunoId: string, estado: EstadoDoAluno): void {
  banco.alunos[alunoId] = estado.situacao;
  banco.faltas = [...banco.faltas.filter((f) => f.alunoId !== alunoId), ...estado.faltas];
  banco.bloqueios = [...banco.bloqueios.filter((b) => b.alunoId !== alunoId), ...estado.bloqueios];
}

function presencaDe(banco: Banco, alunoId: string, palestraId: string): Presenca | undefined {
  return banco.presencas.find((p) => p.alunoId === alunoId && p.palestraId === palestraId);
}

function gravarPresenca(banco: Banco, alunoId: string, palestraId: string, origem: OrigemPresenca, agora: Date): Presenca {
  // Unicidade (aluno + palestra), como a constraint @@unique do Prisma.
  const existente = presencaDe(banco, alunoId, palestraId);
  if (existente) return existente;
  const presenca: Presenca = { id: novoId("pre"), alunoId, palestraId, origem, registradaEm: agora.toISOString() };
  banco.presencas.push(presenca);
  return presenca;
}

/** GET /admin/palestras/:id/presencas */
export function listarPresencas(banco: Banco, palestraId: string, agora: Date): LinhaPresenca[] {
  const palestra = buscarPalestra(banco, palestraId);
  return banco.inscricoes
    .filter((i) => i.palestraId === palestraId && entraNaLista(i, palestra.inicio))
    .map((i) => ({
      inscricaoId: i.id,
      aluno: { ...i.aluno, ...situacaoDoAluno(banco, i.aluno.id, agora) },
      presenca: presencaDe(banco, i.aluno.id, palestraId) ?? null,
      falta: banco.faltas.find((f) => f.alunoId === i.aluno.id && f.palestraId === palestraId) ?? null,
      cancelouEmCimaDaHora: i.status === "CANCELADA",
    }))
    .sort((a, b) => a.aluno.nome.localeCompare(b.aluno.nome, "pt-BR"));
}

/** POST /admin/palestras/:id/checkin — leitura do QR do convite. */
export function fazerCheckin(banco: Banco, palestraId: string, token: string, agora: Date): ResultadoCheckin {
  const palestra = buscarPalestra(banco, palestraId);
  if (palestra.listaEncerrada) return { resultado: "lista_encerrada" };

  const alunoId = lerTokenDeTeste(token, agora.getTime());
  if (!alunoId) return { resultado: "qr_invalido" };

  const inscricao = banco.inscricoes.find(
    (i) => i.palestraId === palestraId && i.aluno.id === alunoId && i.status === "ATIVA",
  );
  if (!inscricao) {
    const conhecido: AlunoResumo | undefined = banco.inscricoes.find((i) => i.aluno.id === alunoId)?.aluno;
    return { resultado: "nao_inscrito", aluno: conhecido ?? null };
  }

  if (presencaDe(banco, alunoId, palestraId)) return { resultado: "ja_registrado", aluno: inscricao.aluno };
  gravarPresenca(banco, alunoId, palestraId, "QR", agora);
  return { resultado: "gravada", aluno: inscricao.aluno };
}

/** POST /admin/palestras/:id/presencas — presença manual (ex.: celular do aluno sem bateria). */
export function marcarPresencaManual(banco: Banco, palestraId: string, inscricaoId: string, agora: Date): Presenca {
  const palestra = buscarPalestra(banco, palestraId);
  if (palestra.listaEncerrada) throw new ErroDeNegocio(409, "A lista desta palestra já foi encerrada.");
  const inscricao = banco.inscricoes.find((i) => i.id === inscricaoId && i.palestraId === palestraId);
  if (!inscricao || inscricao.status !== "ATIVA") {
    throw new ErroDeNegocio(422, "Só é possível marcar presença de quem tem inscrição confirmada.");
  }
  return gravarPresenca(banco, inscricao.aluno.id, palestraId, "MANUAL", agora);
}

/** POST /admin/palestras/:id/encerrar — gera faltas, pontos e bloqueios. */
export function encerrarLista(banco: Banco, palestraId: string, agora: Date): ResumoEncerramento {
  const palestra = buscarPalestra(banco, palestraId);
  if (palestra.listaEncerrada) throw new ErroDeNegocio(409, "A lista desta palestra já foi encerrada.");
  if (new Date(palestra.inicio) > agora) {
    throw new ErroDeNegocio(409, "Só é possível encerrar a lista depois que a palestra começar.");
  }

  let faltasGeradas = 0;
  let bloqueiosAplicados = 0;

  for (const inscricao of banco.inscricoes.filter((i) => i.palestraId === palestraId)) {
    const alunoId = inscricao.aluno.id;
    if (!deveGerarFalta(inscricao, Boolean(presencaDe(banco, alunoId, palestraId)), palestra.inicio)) continue;

    const { estado, bloqueioAplicado } = registrarFalta(estadoDoAluno(banco, alunoId, agora), {
      faltaId: novoId("fal"),
      alunoId,
      palestraId,
      agora,
      idDoNovoBloqueio: novoId("blo"),
    });
    salvarEstadoDoAluno(banco, alunoId, estado);
    faltasGeradas += 1;
    if (bloqueioAplicado) bloqueiosAplicados += 1;
  }

  palestra.listaEncerrada = true;
  return { faltasGeradas, bloqueiosAplicados };
}

/** PATCH /admin/faltas/:id/justificar */
export function justificar(banco: Banco, faltaId: string, agora: Date): Falta {
  const falta = banco.faltas.find((f) => f.id === faltaId);
  if (!falta) throw new ErroDeNegocio(404, "Falta não encontrada.");
  const estado = justificarFalta(estadoDoAluno(banco, falta.alunoId, agora), faltaId, agora);
  salvarEstadoDoAluno(banco, falta.alunoId, estado);
  return estado.faltas.find((f) => f.id === faltaId)!;
}

/** GET /admin/palestras/:id/certificados — uma linha por aluno presente. */
export function listarCertificados(banco: Banco, palestraId: string): LinhaCertificado[] {
  const palestra = buscarPalestra(banco, palestraId);
  return banco.presencas
    .filter((p) => p.palestraId === palestraId)
    .map((presenca) => {
      const aluno = banco.inscricoes.find((i) => i.palestraId === palestraId && i.aluno.id === presenca.alunoId)!.aluno;
      const doEvento = banco.certificados.filter((c) => c.alunoId === presenca.alunoId && c.eventoId === palestra.eventoId);
      const situacao = situacaoDoCertificado(doEvento, palestra);
      const certificado = doEvento.find((c) => c.palestraId === palestraId) ?? doEvento[0];
      return { aluno, presenca, situacao, liberadoEm: certificado?.liberadoEm ?? null };
    })
    .sort((a, b) => a.aluno.nome.localeCompare(b.aluno.nome, "pt-BR"));
}

/**
 * POST /admin/palestras/:id/certificados — avisa a API que os presentes foram à palestra.
 * A API gera o certificado (PDF na hora, sem guardar arquivo) e o app notifica o aluno.
 */
export function liberarCertificados(banco: Banco, palestraId: string, agora: Date): ResumoCertificados {
  const palestra = buscarPalestra(banco, palestraId);
  const presentes = banco.presencas.filter((p) => p.palestraId === palestraId).map((p) => p.alunoId);
  const alunos = alunosParaLiberar(presentes, banco.certificados, palestra);
  if (alunos.length === 0) throw new ErroDeNegocio(422, "Não há certificados pendentes nesta palestra.");

  for (const alunoId of alunos) {
    banco.certificados.push({
      id: novoId("cer"),
      alunoId,
      eventoId: palestra.eventoId,
      palestraId,
      liberadoEm: agora.toISOString(),
    });
  }
  return { liberados: alunos.length };
}

/** Mês AAAA-MM de uma data, no fuso de quem usa o painel. */
export function mesDe(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function mesAnterior(mes: string, quantos: number): string {
  const [ano, m] = mes.split("-").map(Number);
  return mesDe(new Date(ano, m - 1 - quantos, 1));
}

function validarMes(mes: string): void {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw new ErroDeNegocio(400, "Mês inválido. Use o formato AAAA-MM.");
}

function contarPorLetra<L extends string>(letras: readonly L[], valores: (L | null)[]): Record<L, number> {
  const contagem = Object.fromEntries(letras.map((l) => [l, 0])) as Record<L, number>;
  for (const v of valores) if (v) contagem[v] += 1;
  return contagem;
}

/** GET /admin/dashboard?mes=AAAA-MM — indicadores do mês (padrão: mês corrente). */
export function calcularIndicadores(banco: Banco, agora: Date, mes = mesDe(agora)): Indicadores {
  validarMes(mes);
  const doMes = (iso: string) => mesDe(new Date(iso)) === mes;

  const encerradasNoMes = banco.palestras.filter((p) => p.listaEncerrada && doMes(p.inicio));
  let esperados = 0;
  let presentes = 0;
  for (const palestra of encerradasNoMes) {
    const lista = banco.inscricoes.filter((i) => i.palestraId === palestra.id && entraNaLista(i, palestra.inicio));
    esperados += lista.length;
    presentes += lista.filter((i) => presencaDe(banco, i.aluno.id, palestra.id)).length;
  }

  const ultimosMeses = Array.from({ length: 6 }, (_, k) => mesAnterior(mes, 5 - k));

  return {
    mes,
    alunosRegistrados: banco.cadastros.length,
    ativosNaSemana: null,
    palestrasNoMes: banco.palestras.filter((p) => doMes(p.inicio)).length,
    taxaComparecimentoMes: esperados > 0 ? presentes / esperados : null,
    faltasNoMes: banco.faltas.filter((f) => !f.justificada && doMes(f.criadaEm)).length,
    bloqueadosAgora: Object.keys(banco.alunos).filter((id) => situacaoDoAluno(banco, id, agora).bloqueadoAte).length,
    palestrasPorMes: ultimosMeses.map((m) => ({
      mes: m,
      total: banco.palestras.filter((p) => mesDe(new Date(p.inicio)) === m).length,
    })),
    distribuicaoDisc: contarPorLetra<LetraDisc>(["D", "I", "S", "C"], banco.cadastros.map((a) => a.disc)),
    distribuicaoRiasec: contarPorLetra<LetraRiasec>(["R", "I", "A", "S", "E", "C"], banco.cadastros.map((a) => a.riasec)),
  };
}

/** GET /admin/ranking?mes=AAAA-MM — do mês (top 10) e geral (top 5), seção 4.4. */
export function calcularRanking(banco: Banco, agora: Date, mes = mesDe(agora)): Ranking {
  validarMes(mes);
  const candidatos = (filtro: (p: Presenca) => boolean) =>
    banco.cadastros.map(({ id, nome, email, badges }) => ({
      aluno: { id, nome, email },
      palestras: banco.presencas.filter((p) => p.alunoId === id && filtro(p)).length,
      badges,
    }));
  const inicioDa = (p: Presenca) => banco.palestras.find((pal) => pal.id === p.palestraId)!.inicio;

  return {
    doMes: montarRanking(candidatos((p) => mesDe(new Date(inicioDa(p))) === mes), TOP_DO_MES),
    geral: montarRanking(candidatos(() => true), TOP_GERAL),
  };
}

function buscarCadastro(banco: Banco, alunoId: string): AlunoResumo & PerfilAluno {
  const cadastro = banco.cadastros.find((a) => a.id === alunoId);
  if (!cadastro) throw new ErroDeNegocio(404, "Aluno não encontrado.");
  return cadastro;
}

function listarAluno(banco: Banco, cadastro: AlunoResumo & PerfilAluno, agora: Date): AlunoListado {
  return {
    ...cadastro,
    ...situacaoDoAluno(banco, cadastro.id, agora),
    palestrasFrequentadas: banco.presencas.filter((p) => p.alunoId === cadastro.id).length,
  };
}

/** GET /admin/alunos — a busca e os filtros (status, DISC) são aplicados na tela. */
export function listarAlunos(banco: Banco, agora: Date): AlunoListado[] {
  return banco.cadastros
    .map((c) => listarAluno(banco, c, agora))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** GET /admin/alunos/:id — inscrições, presenças, faltas, certificados e testes. */
export function detalharAluno(banco: Banco, alunoId: string, agora: Date): AlunoDetalhado {
  const cadastro = buscarCadastro(banco, alunoId);
  const resumo = (palestraId: string): PalestraResumo => {
    const palestra = buscarPalestra(banco, palestraId);
    const evento = banco.eventos.find((e) => e.id === palestra.eventoId);
    return { id: palestra.id, inicio: palestra.inicio, eventoTitulo: evento?.titulo ?? "" };
  };
  const recentesPrimeiro = <T extends { palestra: PalestraResumo }>(itens: T[]) =>
    itens.sort((a, b) => b.palestra.inicio.localeCompare(a.palestra.inicio));

  return {
    ...listarAluno(banco, cadastro, agora),
    inscricoes: recentesPrimeiro(
      banco.inscricoes
        .filter((i) => i.aluno.id === alunoId)
        .map((i) => ({ id: i.id, palestra: resumo(i.palestraId), status: i.status, criadaEm: i.criadaEm, canceladaEm: i.canceladaEm })),
    ),
    presencas: recentesPrimeiro(
      banco.presencas
        .filter((p) => p.alunoId === alunoId)
        .map((p) => ({ id: p.id, palestra: resumo(p.palestraId), origem: p.origem, registradaEm: p.registradaEm })),
    ),
    faltas: recentesPrimeiro(
      banco.faltas
        .filter((f) => f.alunoId === alunoId)
        .map((f) => ({ id: f.id, palestra: resumo(f.palestraId), justificada: f.justificada, criadaEm: f.criadaEm })),
    ),
    certificados: recentesPrimeiro(
      banco.certificados
        .filter((c) => c.alunoId === alunoId)
        .map((c) => ({ id: c.id, palestra: resumo(c.palestraId), liberadoEm: c.liberadoEm })),
    ),
  };
}

/** GET /admin/mensagens — histórico, da mais recente para a mais antiga. */
export function listarMensagens(banco: Banco): Mensagem[] {
  return [...banco.mensagens].sort((a, b) => b.enviadaEm.localeCompare(a.enviadaEm));
}

/** GET /admin/mensagens/destinatarios — quantos alunos o segmento alcança (para a confirmação). */
export function contarDestinatarios(
  banco: Banco,
  segmento: Pick<MensagemPayload, "segmento" | "palestraId" | "letraDisc">,
): ContagemDestinatarios {
  return { total: destinatariosDoSegmento(segmento, banco.cadastros, banco.inscricoes).length };
}

/** POST /admin/mensagens — grava no histórico; a API real dispara o push (FCM) para cada destinatário. */
export function enviarMensagem(banco: Banco, dados: MensagemPayload, agora: Date): Mensagem {
  const erros = Object.values(validarMensagem(dados));
  if (erros.length > 0) throw new ErroDeNegocio(422, erros[0]!);
  if (dados.segmento === "PALESTRA") buscarPalestra(banco, dados.palestraId!);

  const { total } = contarDestinatarios(banco, dados);
  if (total === 0) throw new ErroDeNegocio(422, "Nenhum aluno neste segmento. A mensagem não foi enviada.");

  const mensagem: Mensagem = {
    id: novoId("msg"),
    titulo: dados.titulo.trim(),
    corpo: dados.corpo.trim(),
    segmento: dados.segmento,
    palestraId: dados.segmento === "PALESTRA" ? dados.palestraId : null,
    letraDisc: dados.segmento === "DISC" ? dados.letraDisc : null,
    enviadaEm: agora.toISOString(),
    destinatarios: total,
  };
  banco.mensagens.push(mensagem);
  return mensagem;
}

function buscarDuvida(banco: Banco, duvidaId: string): Duvida {
  const duvida = banco.duvidas.find((d) => d.id === duvidaId);
  if (!duvida) throw new ErroDeNegocio(404, "Dúvida não encontrada.");
  return duvida;
}

/** GET /admin/duvidas — com a última mensagem; conversas mais recentes primeiro. */
export function listarDuvidas(banco: Banco): DuvidaResumo[] {
  return banco.duvidas
    .map(({ mensagens, ...duvida }) => ({ ...duvida, ultimaMensagem: mensagens[mensagens.length - 1] }))
    .sort((a, b) => b.ultimaMensagem.criadaEm.localeCompare(a.ultimaMensagem.criadaEm));
}

/** GET /admin/duvidas/:id */
export function detalharDuvida(banco: Banco, duvidaId: string): Duvida {
  return buscarDuvida(banco, duvidaId);
}

/** POST /admin/duvidas/:id/respostas — o aluno é avisado no app. */
export function responderDuvida(banco: Banco, duvidaId: string, texto: string, agora: Date): Duvida {
  const duvida = buscarDuvida(banco, duvidaId);
  if (!podeResponder(duvida.status)) throw new ErroDeNegocio(409, "Esta dúvida foi fechada e não aceita respostas.");
  const limpo = texto.trim();
  if (!limpo) throw new ErroDeNegocio(422, "Escreva a resposta.");
  if (limpo.length > LIMITE_RESPOSTA) throw new ErroDeNegocio(422, `Use no máximo ${LIMITE_RESPOSTA} caracteres.`);

  duvida.mensagens.push({ id: novoId("mdu"), autor: "ADMIN", texto: limpo, criadaEm: agora.toISOString() });
  duvida.status = statusAposMensagem("ADMIN");
  return duvida;
}

/** PATCH /admin/duvidas/:id/fechar */
export function fecharDuvida(banco: Banco, duvidaId: string): Duvida {
  const duvida = buscarDuvida(banco, duvidaId);
  if (duvida.status === "FECHADA") throw new ErroDeNegocio(409, "Esta dúvida já está fechada.");
  duvida.status = "FECHADA";
  return duvida;
}

/* ---------- Grupos DISC (seção 4.3) ---------- */

function exigirSoftSkills(banco: Banco, palestra: Palestra): void {
  const evento = banco.eventos.find((e) => e.id === palestra.eventoId);
  if (evento?.tipo !== "SOFT_SKILLS") throw new ErroDeNegocio(422, "Grupos DISC só existem em palestras de soft skills.");
  if (palestra.listaEncerrada) throw new ErroDeNegocio(409, "A lista desta palestra já foi encerrada; os grupos não mudam mais.");
}

/** GET /admin/palestras/:id/grupos */
export function listarGrupos(banco: Banco, palestraId: string): GrupoDisc[] {
  buscarPalestra(banco, palestraId);
  return banco.grupos.filter((g) => g.palestraId === palestraId).sort((a, b) => a.numero - b.numero);
}

/**
 * POST /admin/palestras/:id/grupos — gera ou regera com os confirmados.
 * A API real também roda isto sozinha na véspera (tarefa agendada).
 */
export function gerarGrupos(
  banco: Banco,
  palestraId: string,
  embaralhar: <U>(lista: U[]) => U[] = embaralharAleatorio,
): GrupoDisc[] {
  const palestra = buscarPalestra(banco, palestraId);
  exigirSoftSkills(banco, palestra);

  const participantes = banco.inscricoes
    .filter((i) => i.palestraId === palestraId && i.status === "ATIVA")
    .map((i) => ({
      alunoId: i.aluno.id,
      aluno: i.aluno,
      letra: banco.cadastros.find((c) => c.id === i.aluno.id)?.disc ?? null,
    }));
  if (participantes.length === 0) throw new ErroDeNegocio(422, "Não há inscritos confirmados para formar grupos.");

  const novos: GrupoDisc[] = formarGrupos(participantes, embaralhar).map((membros, i) => ({
    id: novoId("gru"),
    palestraId,
    numero: i + 1,
    membros: membros.map(({ aluno, letra }) => ({ aluno, letra })),
  }));
  banco.grupos = [...banco.grupos.filter((g) => g.palestraId !== palestraId), ...novos];
  return novos;
}

/** PUT /admin/grupos/:id/membros — ajuste manual: o grupo passa a ter exatamente estes alunos. */
export function definirMembros(banco: Banco, grupoId: string, alunoIds: string[]): GrupoDisc {
  const grupo = banco.grupos.find((g) => g.id === grupoId);
  if (!grupo) throw new ErroDeNegocio(404, "Grupo não encontrado.");
  exigirSoftSkills(banco, buscarPalestra(banco, grupo.palestraId));
  if (alunoIds.length === 0) throw new ErroDeNegocio(422, "O grupo precisa de pelo menos uma pessoa.");

  const daPalestra = banco.grupos.filter((g) => g.palestraId === grupo.palestraId);
  const membroDe = (alunoId: string) => daPalestra.flatMap((g) => g.membros).find((m) => m.aluno.id === alunoId);
  const novos = alunoIds.map((alunoId) => {
    const membro = membroDe(alunoId);
    if (!membro) throw new ErroDeNegocio(422, "Só é possível mover alunos que já estão nos grupos desta palestra.");
    return membro;
  });

  // Quem saísse deste grupo sem ir para outro ficaria sem grupo: não é permitido.
  if (grupo.membros.some((m) => !alunoIds.includes(m.aluno.id))) {
    throw new ErroDeNegocio(422, "Para tirar alguém deste grupo, mova a pessoa para outro grupo.");
  }
  // Valida tudo antes de mudar qualquer grupo.
  const outros = daPalestra
    .filter((g) => g.id !== grupo.id)
    .map((g) => ({ grupo: g, restantes: g.membros.filter((m) => !alunoIds.includes(m.aluno.id)) }));
  const esvaziado = outros.find((o) => o.restantes.length === 0);
  if (esvaziado) throw new ErroDeNegocio(422, `O grupo ${esvaziado.grupo.numero} ficaria vazio.`);

  for (const { grupo: outro, restantes } of outros) outro.membros = restantes;
  grupo.membros = novos;
  return grupo;
}

/** Usado só para montar os dados fictícios iniciais. */
export function registrarPresencaInicial(banco: Banco, palestraId: string, alunoId: string, origem: OrigemPresenca) {
  const palestra = buscarPalestra(banco, palestraId);
  gravarPresenca(banco, alunoId, palestraId, origem, new Date(palestra.inicio));
}
