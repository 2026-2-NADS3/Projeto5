import type { Bloqueio, Falta, Inscricao, SituacaoAluno } from "../types/dominio";

/**
 * Regras de faltas, pontos e bloqueio — seção 4.1 do documento de implementação.
 *
 * Funções puras (sem banco, sem tela), para:
 *  - o mock usar exatamente as mesmas regras que a API vai ter;
 *  - servir de especificação executável para quem implementar a API;
 *  - serem cobertas por testes unitários.
 */

export const HORAS_MINIMAS_CANCELAMENTO = 72;
export const PONTOS_PARA_BLOQUEIO = 2;
export const DIAS_DE_BLOQUEIO = 30;

const HORA_MS = 60 * 60 * 1000;
const DIA_MS = 24 * HORA_MS;

/** Cancelou com menos de 72h do início da palestra. */
export function cancelouEmCimaDaHora(canceladaEm: string | null, inicioPalestra: string): boolean {
  if (!canceladaEm) return false;
  const antecedencia = new Date(inicioPalestra).getTime() - new Date(canceladaEm).getTime();
  return antecedencia < HORAS_MINIMAS_CANCELAMENTO * HORA_MS;
}

/**
 * A inscrição entra na lista de presença?
 * Confirmados entram; quem cancelou em cima da hora também (ainda pode levar falta).
 * Premissa: um cancelamento sempre vem de uma inscrição confirmada — quem está na
 * lista de espera e desiste não ocupava vaga e não é punido.
 */
export function entraNaLista(inscricao: Pick<Inscricao, "status" | "canceladaEm">, inicioPalestra: string): boolean {
  if (inscricao.status === "ATIVA") return true;
  return inscricao.status === "CANCELADA" && cancelouEmCimaDaHora(inscricao.canceladaEm, inicioPalestra);
}

/** Ao encerrar a lista: essa inscrição gera falta? */
export function deveGerarFalta(
  inscricao: Pick<Inscricao, "status" | "canceladaEm">,
  teveSuaPresencaRegistrada: boolean,
  inicioPalestra: string,
): boolean {
  return entraNaLista(inscricao, inicioPalestra) && !teveSuaPresencaRegistrada;
}

/** Situação de pontos e bloqueio de UM aluno, com o histórico necessário para as regras. */
export interface EstadoDoAluno {
  situacao: SituacaoAluno;
  faltas: Falta[];
  bloqueios: Bloqueio[];
}

/** Bloqueio vencido não bloqueia mais. */
export function situacaoVigente(situacao: SituacaoAluno, agora: Date): SituacaoAluno {
  if (situacao.bloqueadoAte && new Date(situacao.bloqueadoAte) <= agora) {
    return { ...situacao, bloqueadoAte: null };
  }
  return situacao;
}

export function estaBloqueado(situacao: SituacaoAluno, agora: Date): boolean {
  return situacaoVigente(situacao, agora).bloqueadoAte !== null;
}

/**
 * Registra uma falta: soma 1 ponto; com 2 pontos o aluno fica bloqueado por 30 dias
 * e os pontos voltam a zero (as faltas que geraram o bloqueio ficam ligadas a ele).
 */
export function registrarFalta(
  estado: EstadoDoAluno,
  dados: { faltaId: string; alunoId: string; palestraId: string; agora: Date; idDoNovoBloqueio: string },
): { estado: EstadoDoAluno; bloqueioAplicado: Bloqueio | null } {
  const novaFalta: Falta = {
    id: dados.faltaId,
    alunoId: dados.alunoId,
    palestraId: dados.palestraId,
    justificada: false,
    bloqueioId: null,
    criadaEm: dados.agora.toISOString(),
  };
  const faltas = [...estado.faltas, novaFalta];
  const pontos = estado.situacao.pontosFalta + 1;

  if (pontos < PONTOS_PARA_BLOQUEIO) {
    return {
      estado: { ...estado, faltas, situacao: { ...estado.situacao, pontosFalta: pontos } },
      bloqueioAplicado: null,
    };
  }

  const bloqueio: Bloqueio = {
    id: dados.idDoNovoBloqueio,
    alunoId: dados.alunoId,
    inicio: dados.agora.toISOString(),
    fim: new Date(dados.agora.getTime() + DIAS_DE_BLOQUEIO * DIA_MS).toISOString(),
    cancelado: false,
  };

  return {
    estado: {
      faltas: faltas.map((f) => (f.bloqueioId === null && !f.justificada ? { ...f, bloqueioId: bloqueio.id } : f)),
      bloqueios: [...estado.bloqueios, bloqueio],
      situacao: { pontosFalta: 0, bloqueadoAte: bloqueio.fim },
    },
    bloqueioAplicado: bloqueio,
  };
}

/**
 * Justifica uma falta (ação do ADMIN): o ponto daquela falta deixa de valer.
 * - Falta que ainda era ponto: tira 1 ponto.
 * - Falta que gerou um bloqueio em vigor: o bloqueio é cancelado e as outras faltas
 *   daquele bloqueio voltam a contar como pontos (sem a justificada, o aluno não
 *   teria chegado a 2 pontos).
 * - Falta de um bloqueio que já venceu: só fica marcada como justificada.
 */
export function justificarFalta(estado: EstadoDoAluno, faltaId: string, agora: Date): EstadoDoAluno {
  const falta = estado.faltas.find((f) => f.id === faltaId);
  if (!falta) throw new Error("Falta não encontrada.");
  if (falta.justificada) return estado;

  const bloqueio = falta.bloqueioId ? estado.bloqueios.find((b) => b.id === falta.bloqueioId) : undefined;
  const bloqueioEmVigor = Boolean(bloqueio && !bloqueio.cancelado && new Date(bloqueio.fim) > agora);

  if (!falta.bloqueioId) {
    return {
      ...estado,
      faltas: estado.faltas.map((f) => (f.id === faltaId ? { ...f, justificada: true } : f)),
      situacao: { ...estado.situacao, pontosFalta: Math.max(0, estado.situacao.pontosFalta - 1) },
    };
  }

  if (!bloqueioEmVigor) {
    return { ...estado, faltas: estado.faltas.map((f) => (f.id === faltaId ? { ...f, justificada: true } : f)) };
  }

  const faltas = estado.faltas.map((f) => {
    if (f.id === faltaId) return { ...f, justificada: true, bloqueioId: null };
    if (f.bloqueioId === falta.bloqueioId) return { ...f, bloqueioId: null };
    return f;
  });
  return {
    faltas,
    bloqueios: estado.bloqueios.map((b) => (b.id === falta.bloqueioId ? { ...b, cancelado: true } : b)),
    situacao: {
      pontosFalta: faltas.filter((f) => f.bloqueioId === null && !f.justificada).length,
      bloqueadoAte: null,
    },
  };
}
