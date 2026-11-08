import type {
  AlunoResumo,
  Bloqueio,
  Evento,
  Falta,
  Inscricao,
  LetraDisc,
  LetraRiasec,
  Mensagem,
  Palestra,
  Presenca,
  SituacaoAluno,
  StatusInscricao,
} from "../../types/dominio";

/**
 * Conversão entre as tabelas do Supabase e o formato que as telas usam (types/dominio.ts).
 *
 * Diferença principal de modelo: no banco, cada linha de `eventos` já é uma edição com data
 * (não existe tabela separada de "palestra"). Por isso, no painel, Palestra e Evento apontam
 * para a MESMA linha: palestra.id === palestra.eventoId === String(eventos.id).
 *
 * Funções puras, cobertas por testes em mapeamento.test.ts.
 */

/* ---------- Linhas como vêm do banco ---------- */

export interface LinhaEvento {
  id: number;
  titulo: string;
  descricao: string | null;
  instituicao: string | null;
  local: string | null;
  tipo: string; // CURSO | EXTERNO
  categoria: string | null;
  data_inicio: string;
  data_fim: string;
  carga_horaria: number;
  total_encontros: number;
  requer_testes: boolean;
  vagas?: number | null; // coluna criada por supabase/painel_admin.sql
  lista_encerrada?: boolean; // coluna criada por supabase/painel_admin.sql
}

export interface LinhaAluno {
  id: number;
  user_id: string;
  nome: string;
  email: string;
}

export interface LinhaInscricao {
  id: string;
  aluno_id: number;
  evento_id: number;
  data_inscricao: string;
  status: string;
  codigo_ingresso: string;
}

export interface LinhaPresencaBanco {
  id: string;
  aluno_id: number;
  evento_id: number;
  data_encontro: string; // AAAA-MM-DD
  registrado_em: string;
  origem: string; // QR | CODIGO | LEITOR (o banco só aceita esses)
  registro_manual?: boolean; // coluna criada por supabase/painel_admin.sql
}

export interface LinhaFalta {
  id: string;
  aluno_id: number;
  evento_id: number;
  justificada: boolean;
  bloqueio_id: string | null;
  criada_em: string;
}

export interface LinhaBloqueio {
  id: string;
  aluno_id: number;
  inicio: string;
  fim: string;
  cancelado: boolean;
}

export interface LinhaResultado {
  aluno_id: number;
  tipo: string; // DISC | RIASEC
  codigo: string | null;
  data: string;
}

export interface LinhaNotificacao {
  id: number;
  titulo: string;
  mensagem: string | null;
  tipo: string;
  evento_id: number | null;
  aluno_id: number | null;
  data_publicacao: string;
}

/* ---------- Eventos e palestras ---------- */

/** Eventos EXTERNO (prazos de vestibular, Sisu...) não são palestras da ONG: ficam fora do painel. */
export function ehPalestra(linha: Pick<LinhaEvento, "tipo">): boolean {
  return linha.tipo.toUpperCase() !== "EXTERNO";
}

const iso = (valor: string) => new Date(valor).toISOString();

export function paraEvento(linha: LinhaEvento): Evento {
  return {
    id: String(linha.id),
    titulo: linha.titulo,
    descricao: linha.descricao ?? "",
    cargaHoraria: linha.carga_horaria,
    // No banco não existe "soft skills": o que marca é exigir os testes de perfil na inscrição.
    tipo: linha.requer_testes ? "SOFT_SKILLS" : "PADRAO",
  };
}

export function paraPalestra(linha: LinhaEvento): Palestra {
  return {
    id: String(linha.id),
    eventoId: String(linha.id),
    inicio: iso(linha.data_inicio),
    fim: iso(linha.data_fim),
    sala: linha.local,
    vagas: linha.vagas ?? null,
    listaEncerrada: linha.lista_encerrada ?? false,
  };
}

/* ---------- Inscrições e presenças ---------- */

const STATUS_CONHECIDOS: StatusInscricao[] = ["ATIVA", "ESPERA", "CONVIDADA", "CANCELADA"];

/** O app grava o status em texto livre; o que não for conhecido vira ATIVA (ou CANCELADA, se for cancelamento). */
export function normalizarStatus(status: string): StatusInscricao {
  const s = status.trim().toUpperCase();
  if ((STATUS_CONHECIDOS as string[]).includes(s)) return s as StatusInscricao;
  if (s.startsWith("CANCEL")) return "CANCELADA";
  if (s.includes("ESPERA")) return "ESPERA";
  return "ATIVA";
}

export function paraAlunoResumo(linha: Pick<LinhaAluno, "id" | "nome" | "email">): AlunoResumo {
  return { id: String(linha.id), nome: linha.nome, email: linha.email };
}

export function paraInscricao(linha: LinhaInscricao, aluno: AlunoResumo): Inscricao {
  return {
    id: linha.id,
    palestraId: String(linha.evento_id),
    aluno,
    status: normalizarStatus(linha.status),
    criadaEm: iso(linha.data_inscricao),
    posicaoEspera: null, // o banco ainda não tem lista de espera
    conviteExpiraEm: null,
    canceladaEm: null, // o banco não guarda quando a inscrição foi cancelada
  };
}

export function paraPresenca(linha: LinhaPresencaBanco): Presenca {
  return {
    id: linha.id,
    alunoId: String(linha.aluno_id),
    palestraId: String(linha.evento_id),
    // Presença marcada à mão pelo admin fica com origem LEITOR + registro_manual.
    origem: linha.registro_manual ? "MANUAL" : "QR",
    registradaEm: iso(linha.registrado_em),
  };
}

/**
 * O QR do ingresso no app tem o formato "PE:INGRESSO:<id da inscrição>:<codigo_ingresso>"
 * (o mesmo que a função validar_ingresso do banco espera).
 */
export function lerQrIngresso(lido: string): { inscricaoId: string; codigo: string } | null {
  const partes = lido.trim().split(":");
  if (partes.length !== 4 || partes[0] !== "PE" || partes[1] !== "INGRESSO" || !partes[2] || !partes[3]) return null;
  return { inscricaoId: partes[2], codigo: partes[3] };
}

export function montarQrIngresso(inscricaoId: string, codigo: string): string {
  return `PE:INGRESSO:${inscricaoId}:${codigo}`;
}

/* ---------- Faltas e bloqueios ---------- */

export function paraFalta(linha: LinhaFalta): Falta {
  return {
    id: linha.id,
    alunoId: String(linha.aluno_id),
    palestraId: String(linha.evento_id),
    justificada: linha.justificada,
    bloqueioId: linha.bloqueio_id,
    criadaEm: iso(linha.criada_em),
  };
}

export function paraBloqueio(linha: LinhaBloqueio): Bloqueio {
  return { id: linha.id, alunoId: String(linha.aluno_id), inicio: iso(linha.inicio), fim: iso(linha.fim), cancelado: linha.cancelado };
}

export function linhaDeFalta(f: Falta): LinhaFalta {
  return {
    id: f.id,
    aluno_id: Number(f.alunoId),
    evento_id: Number(f.palestraId),
    justificada: f.justificada,
    bloqueio_id: f.bloqueioId,
    criada_em: f.criadaEm,
  };
}

export function linhaDeBloqueio(b: Bloqueio): LinhaBloqueio {
  return { id: b.id, aluno_id: Number(b.alunoId), inicio: b.inicio, fim: b.fim, cancelado: b.cancelado };
}

/**
 * Pontos e bloqueio do aluno, calculados a partir das faltas e bloqueios gravados
 * (o banco não guarda o saldo, para nunca ficar fora de sincronia):
 * - ponto = falta não justificada que ainda não gerou bloqueio;
 * - bloqueado até = fim do bloqueio não cancelado que ainda está valendo.
 */
export function situacaoPelasFaltas(faltas: Falta[], bloqueios: Bloqueio[], agora: Date): SituacaoAluno {
  const pontosFalta = faltas.filter((f) => !f.justificada && f.bloqueioId === null).length;
  const vigentes = bloqueios
    .filter((b) => !b.cancelado && new Date(b.fim) > agora)
    .map((b) => b.fim)
    .sort();
  return { pontosFalta, bloqueadoAte: vigentes.at(-1) ?? null };
}

/* ---------- Testes de perfil ---------- */

const DISC: LetraDisc[] = ["D", "I", "S", "C"];
const RIASEC: LetraRiasec[] = ["R", "I", "A", "S", "E", "C"];

/** Resultado mais recente de cada teste do aluno; a letra predominante é a 1ª do código (ex.: "CE" → C). */
export function letrasDoAluno(resultados: LinhaResultado[]): { disc: LetraDisc | null; riasec: LetraRiasec | null } {
  const maisRecente = (tipo: string) =>
    resultados
      .filter((r) => r.tipo.toUpperCase() === tipo && r.codigo)
      .sort((a, b) => b.data.localeCompare(a.data))[0];
  const primeira = (codigo: string | null | undefined) => codigo?.trim().charAt(0).toUpperCase() ?? "";
  const d = primeira(maisRecente("DISC")?.codigo);
  const r = primeira(maisRecente("RIASEC")?.codigo);
  return {
    disc: (DISC as string[]).includes(d) ? (d as LetraDisc) : null,
    riasec: (RIASEC as string[]).includes(r) ? (r as LetraRiasec) : null,
  };
}

/* ---------- Comunicação ---------- */

/**
 * Histórico de mensagens a partir de `notificacoes`.
 * - "Todos os alunos" é UMA notificação sem aluno_id.
 * - Mensagem segmentada (palestra ou DISC) é gravada como uma notificação por aluno, com o mesmo
 *   título, texto e horário; aqui elas voltam a ser uma mensagem só, com o nº de destinatários.
 */
export function agruparMensagens(linhas: LinhaNotificacao[], totalAlunos: number): Mensagem[] {
  const grupos = new Map<string, LinhaNotificacao[]>();
  for (const linha of linhas) {
    const chave =
      linha.aluno_id === null
        ? `geral:${linha.id}`
        : `seg:${linha.titulo}\u0000${linha.mensagem ?? ""}\u0000${linha.data_publicacao}\u0000${linha.evento_id ?? ""}`;
    grupos.set(chave, [...(grupos.get(chave) ?? []), linha]);
  }

  return [...grupos.values()]
    .map((grupo): Mensagem => {
      const [primeira] = grupo;
      const individual = primeira.aluno_id !== null;
      return {
        id: String(primeira.id),
        titulo: primeira.titulo,
        corpo: primeira.mensagem ?? "",
        segmento: !individual ? "TODOS" : primeira.evento_id !== null ? "PALESTRA" : "DISC",
        palestraId: individual && primeira.evento_id !== null ? String(primeira.evento_id) : null,
        letraDisc: null, // o banco não guarda qual letra foi escolhida
        enviadaEm: iso(primeira.data_publicacao),
        destinatarios: individual ? new Set(grupo.map((l) => l.aluno_id)).size : totalAlunos,
      };
    })
    .sort((a, b) => b.enviadaEm.localeCompare(a.enviadaEm));
}

/* ---------- Datas (fuso de São Paulo) ---------- */

const FUSO = "America/Sao_Paulo";
const formatoDia = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" });

/** AAAA-MM-DD no fuso de São Paulo. */
export function diaEmSaoPaulo(data: Date): string {
  return formatoDia.format(data);
}

/** AAAA-MM no fuso de São Paulo. */
export function mesEmSaoPaulo(data: Date): string {
  return diaEmSaoPaulo(data).slice(0, 7);
}

export function mesAnterior(mes: string, quantos: number): string {
  const [ano, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(ano, m - 1 - quantos, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function contarPorLetra<L extends string>(letras: readonly L[], valores: (L | null)[]): Record<L, number> {
  const contagem = Object.fromEntries(letras.map((l) => [l, 0])) as Record<L, number>;
  for (const v of valores) if (v) contagem[v] += 1;
  return contagem;
}

/** Código de validação do certificado no mesmo formato que o banco gera (ex.: "PE-7K2M9QXA"). */
export function gerarCodigoValidacao(aleatorio: () => number = Math.random): string {
  const alfabeto = "ABCDEF0123456789";
  const parte = Array.from({ length: 8 }, () => alfabeto[Math.floor(aleatorio() * alfabeto.length)]).join("");
  return `PE-${parte}`;
}

/** Regra do banco (emitir_certificados): certificado com presença em pelo menos 75% dos encontros. */
export function temDireitoACertificado(encontrosComPresenca: number, totalEncontros: number): boolean {
  return encontrosComPresenca > 0 && encontrosComPresenca * 100 >= 75 * Math.max(1, totalEncontros);
}
