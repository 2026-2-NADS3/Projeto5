/**
 * Tipos do domínio usados pelo painel.
 * Espelham o modelo de dados (seção 7) e o formato das respostas das rotas
 * /admin/* (seção 8) do documento de implementação. Se a API mudar o
 * formato, este é o único arquivo de tipos a atualizar.
 */

export type TipoEvento = "PADRAO" | "SOFT_SKILLS";

export type StatusInscricao = "ATIVA" | "ESPERA" | "CONVIDADA" | "CANCELADA";

/** Conteúdo fixo de uma palestra (reaproveitado em várias edições). */
export interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  cargaHoraria: number; // em horas
  tipo: TipoEvento;
}

/** Uma edição do evento, com data e vagas. */
export interface Palestra {
  id: string;
  eventoId: string;
  inicio: string; // ISO 8601
  fim: string; // ISO 8601
  sala: string | null;
  vagas: number | null; // null = limite ainda não definido (eventos antigos do banco)
  listaEncerrada: boolean;
}

/**
 * Formato de cada item de GET /admin/palestras e GET /admin/palestras/:id:
 * a palestra já vem com o evento e as contagens, para a lista não precisar
 * de uma chamada extra por linha.
 */
export interface PalestraDetalhada extends Palestra {
  evento: Evento;
  contagem: {
    confirmados: number; // inscrições ATIVA
    espera: number; // inscrições ESPERA + CONVIDADA
    presentes: number; // presenças registradas
  };
}

/** Dados do aluno que o painel pode ver numa inscrição (coleta mínima, LGPD). */
export interface AlunoResumo {
  id: string;
  nome: string;
  email: string;
}

/** Formato de cada item de GET /admin/palestras/:id/inscritos. */
export interface Inscricao {
  id: string;
  palestraId: string;
  aluno: AlunoResumo;
  status: StatusInscricao;
  criadaEm: string;
  posicaoEspera: number | null; // só em ESPERA/CONVIDADA
  conviteExpiraEm: string | null; // só em CONVIDADA
  canceladaEm: string | null;
}

/** Corpo de POST /admin/palestras e PUT /admin/palestras/:id. */
export interface PalestraPayload {
  eventoId: string;
  inicio: string;
  fim: string;
  sala: string | null;
  vagas: number;
}

/** Corpo de POST /admin/eventos. */
export type EventoPayload = Omit<Evento, "id">;

/* ---------- Fase 2: presença, faltas e bloqueio ---------- */

export type OrigemPresenca = "QR" | "MANUAL";

export interface Presenca {
  id: string;
  alunoId: string;
  palestraId: string;
  origem: OrigemPresenca;
  registradaEm: string;
}

export interface Falta {
  id: string;
  alunoId: string;
  palestraId: string;
  justificada: boolean;
  /** Bloqueio que esta falta ajudou a gerar (null se ainda conta como ponto). */
  bloqueioId: string | null;
  criadaEm: string;
}

export interface Bloqueio {
  id: string;
  alunoId: string;
  inicio: string;
  fim: string; // inicio + 30 dias
  cancelado: boolean; // true quando uma falta do bloqueio foi justificada
}

/** Situação de pontos/bloqueio do aluno. */
export interface SituacaoAluno {
  pontosFalta: number;
  bloqueadoAte: string | null;
}

/**
 * Formato de cada item de GET /admin/palestras/:id/presencas:
 * uma linha por aluno que conta para a lista (confirmados e quem cancelou em cima da hora).
 */
export interface LinhaPresenca {
  inscricaoId: string;
  aluno: AlunoResumo & SituacaoAluno;
  presenca: Presenca | null;
  falta: Falta | null;
  /** Cancelou com menos de 72h: conta como falta ao encerrar a lista (seção 4.1). */
  cancelouEmCimaDaHora: boolean;
}

/** Resposta de POST /admin/palestras/:id/checkin (seção 8). */
export type ResultadoCheckin =
  | { resultado: "gravada"; aluno: AlunoResumo }
  | { resultado: "ja_registrado"; aluno: AlunoResumo }
  | { resultado: "nao_inscrito"; aluno: AlunoResumo | null }
  | { resultado: "qr_invalido" }
  | { resultado: "lista_encerrada" };

/** Resposta de POST /admin/palestras/:id/encerrar. */
export interface ResumoEncerramento {
  faltasGeradas: number;
  bloqueiosAplicados: number;
}

/* ---------- Fase 3: certificados ---------- */

/**
 * Registro de que o painel avisou a API: "este aluno foi a esta palestra, gere o certificado".
 * O painel não gera, não guarda e não abre o PDF — isso é da API e do app (seção 4.2).
 */
export interface CertificadoLiberado {
  id: string;
  alunoId: string;
  eventoId: string; // um certificado por evento, mesmo com várias edições
  palestraId: string;
  liberadoEm: string;
}

/** PENDENTE: tem presença e ainda não foi liberado. JA_RECEBEU: liberado em outra edição do mesmo evento. */
export type SituacaoCertificado = "PENDENTE" | "LIBERADO" | "JA_RECEBEU";

/** Formato de cada item de GET /admin/palestras/:id/certificados: uma linha por aluno presente. */
export interface LinhaCertificado {
  aluno: AlunoResumo;
  presenca: Presenca;
  situacao: SituacaoCertificado;
  liberadoEm: string | null; // data da liberação (desta ou da outra edição)
}

/** Resposta de POST /admin/palestras/:id/certificados. */
export interface ResumoCertificados {
  liberados: number;
}

/* ---------- Fase 4: alunos, dashboard e ranking ---------- */

export type LetraDisc = "D" | "I" | "S" | "C";
export type LetraRiasec = "R" | "I" | "A" | "S" | "E" | "C";

/** Resultados dos testes de perfil (feitos no app) e badges conquistados no app. */
export interface PerfilAluno {
  disc: LetraDisc | null; // letra predominante; null = ainda não fez o teste
  riasec: LetraRiasec | null;
  badges: number;
}

/** Formato de cada item de GET /admin/alunos (tela 9.3). Sem CPF: coleta mínima. */
export interface AlunoListado extends AlunoResumo, SituacaoAluno, PerfilAluno {
  palestrasFrequentadas: number;
}

/** Palestra resumida para as abas do detalhe do aluno. */
export interface PalestraResumo {
  id: string;
  inicio: string;
  eventoTitulo: string;
}

/** Resposta de GET /admin/alunos/:id (tela 9.4). */
export interface AlunoDetalhado extends AlunoListado {
  inscricoes: { id: string; palestra: PalestraResumo; status: StatusInscricao; criadaEm: string; canceladaEm: string | null }[];
  presencas: { id: string; palestra: PalestraResumo; origem: OrigemPresenca; registradaEm: string }[];
  faltas: { id: string; palestra: PalestraResumo; justificada: boolean; criadaEm: string }[];
  certificados: { id: string; palestra: PalestraResumo; liberadoEm: string }[];
}

/** Resposta de GET /admin/dashboard?mes=AAAA-MM (tela 9.2). Valores null = ainda não dá para medir. */
export interface Indicadores {
  mes: string; // AAAA-MM de referência
  alunosRegistrados: number;
  ativosNaSemana: number | null; // depende do registro de acesso do app
  palestrasNoMes: number;
  taxaComparecimentoMes: number | null; // 0 a 1, palestras encerradas no mês
  faltasNoMes: number; // faltas não justificadas
  bloqueadosAgora: number;
  palestrasPorMes: { mes: string; total: number }[]; // os 6 meses até o mês de referência
  distribuicaoDisc: Record<LetraDisc, number>;
  distribuicaoRiasec: Record<LetraRiasec, number>;
}

/** Item do ranking (seção 4.4). */
export interface ItemRanking {
  posicao: number;
  aluno: AlunoResumo;
  palestras: number;
  badges: number;
}

/** Resposta de GET /admin/ranking?mes=AAAA-MM. */
export interface Ranking {
  doMes: ItemRanking[]; // top 10
  geral: ItemRanking[]; // top 5
}

/* ---------- Fase 5: comunicação ---------- */

/** Para quem vai a mensagem (seção 9.10). */
export type Segmento = "TODOS" | "PALESTRA" | "DISC";

/** Corpo de POST /admin/mensagens. */
export interface MensagemPayload {
  titulo: string;
  corpo: string;
  segmento: Segmento;
  palestraId: string | null; // quando segmento = PALESTRA
  letraDisc: LetraDisc | null; // quando segmento = DISC
}

/** Item de GET /admin/mensagens (histórico das enviadas). */
export interface Mensagem extends MensagemPayload {
  id: string;
  enviadaEm: string;
  destinatarios: number; // quantos alunos receberam a notificação
}

/** Resposta de GET /admin/mensagens/destinatarios: quantos alunos o segmento alcança. */
export interface ContagemDestinatarios {
  total: number;
}

export type StatusDuvida = "ABERTA" | "RESPONDIDA" | "FECHADA";
export type AutorMensagem = "ALUNO" | "ADMIN";

export interface MensagemDuvida {
  id: string;
  autor: AutorMensagem;
  texto: string;
  criadaEm: string;
}

/** Item de GET /admin/duvidas. */
export interface DuvidaResumo {
  id: string;
  aluno: AlunoResumo;
  assunto: string;
  status: StatusDuvida;
  criadaEm: string;
  ultimaMensagem: MensagemDuvida;
}

/** Resposta de GET /admin/duvidas/:id: a conversa inteira, da mais antiga para a mais nova. */
export interface Duvida extends Omit<DuvidaResumo, "ultimaMensagem"> {
  mensagens: MensagemDuvida[];
}

/* ---------- Fase 6: grupos DISC ---------- */

export interface MembroGrupo {
  aluno: AlunoResumo;
  letra: LetraDisc | null; // null só se o aluno ainda não tiver resultado (não deveria em soft skills)
}

/** Item de GET /admin/palestras/:id/grupos (seção 4.3). */
export interface GrupoDisc {
  id: string;
  palestraId: string;
  numero: number;
  membros: MembroGrupo[];
}

/** Corpo de PUT /admin/grupos/:id/membros: a lista completa de alunos do grupo. */
export interface MembrosPayload {
  alunoIds: string[];
}
