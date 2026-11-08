import type { CertificadoLiberado, SituacaoCertificado } from "../types/dominio";

/**
 * Regras de certificado — seção 4.2 do documento de implementação.
 *
 * - Presença registrada (QR ou manual) = direito a certificado, sem esperar o encerramento da lista.
 * - Um certificado por EVENTO: quem já recebeu numa edição anterior não recebe outro.
 * - O painel só libera (avisa a API); a API gera o PDF e o app notifica o aluno.
 *
 * Funções puras, cobertas por testes em certificado.test.ts.
 */

/** Situação do certificado de um aluno presente nesta palestra. */
export function situacaoDoCertificado(
  liberadosDoAluno: Pick<CertificadoLiberado, "eventoId" | "palestraId">[],
  palestra: { id: string; eventoId: string },
): SituacaoCertificado {
  const doEvento = liberadosDoAluno.filter((c) => c.eventoId === palestra.eventoId);
  if (doEvento.some((c) => c.palestraId === palestra.id)) return "LIBERADO";
  return doEvento.length > 0 ? "JA_RECEBEU" : "PENDENTE";
}

/** Dos alunos presentes, quais devem ter o certificado liberado agora (sem repetir evento). */
export function alunosParaLiberar(
  alunosPresentes: string[],
  liberados: Pick<CertificadoLiberado, "alunoId" | "eventoId" | "palestraId">[],
  palestra: { id: string; eventoId: string },
): string[] {
  const unicos = [...new Set(alunosPresentes)];
  return unicos.filter(
    (alunoId) => situacaoDoCertificado(liberados.filter((c) => c.alunoId === alunoId), palestra) === "PENDENTE",
  );
}
