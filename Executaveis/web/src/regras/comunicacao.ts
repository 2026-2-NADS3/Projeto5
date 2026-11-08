import type { AlunoResumo, Inscricao, LetraDisc, MensagemPayload, PerfilAluno, StatusDuvida } from "../types/dominio";

/**
 * Regras de comunicação — seção 9.10 do documento de implementação.
 * Funções puras, cobertas por testes em comunicacao.test.ts.
 */

export const LIMITE_TITULO = 80;
export const LIMITE_CORPO = 1000;
export const LIMITE_RESPOSTA = 2000;

/** Problemas do formulário de mensagem; objeto vazio = pode enviar. */
export function validarMensagem(dados: MensagemPayload): Partial<Record<keyof MensagemPayload, string>> {
  const erros: Partial<Record<keyof MensagemPayload, string>> = {};
  const titulo = dados.titulo.trim();
  const corpo = dados.corpo.trim();
  if (!titulo) erros.titulo = "Informe o título.";
  else if (titulo.length > LIMITE_TITULO) erros.titulo = `Use no máximo ${LIMITE_TITULO} caracteres.`;
  if (!corpo) erros.corpo = "Escreva a mensagem.";
  else if (corpo.length > LIMITE_CORPO) erros.corpo = `Use no máximo ${LIMITE_CORPO} caracteres.`;
  if (dados.segmento === "PALESTRA" && !dados.palestraId) erros.palestraId = "Escolha a palestra.";
  if (dados.segmento === "DISC" && !dados.letraDisc) erros.letraDisc = "Escolha a letra DISC.";
  return erros;
}

/**
 * Quem recebe a mensagem:
 * - TODOS: todos os alunos cadastrados (bloqueados também; o bloqueio só impede inscrição);
 * - PALESTRA: inscritos da palestra — confirmados, lista de espera e convidados (cancelados não);
 * - DISC: alunos cuja letra predominante é a escolhida (quem não fez o teste fica de fora).
 */
export function destinatariosDoSegmento(
  segmento: Pick<MensagemPayload, "segmento" | "palestraId" | "letraDisc">,
  alunos: (AlunoResumo & Pick<PerfilAluno, "disc">)[],
  inscricoes: Pick<Inscricao, "palestraId" | "status" | "aluno">[],
): string[] {
  if (segmento.segmento === "TODOS") return alunos.map((a) => a.id);
  if (segmento.segmento === "DISC") {
    return alunos.filter((a) => a.disc !== null && a.disc === (segmento.letraDisc as LetraDisc | null)).map((a) => a.id);
  }
  const ids = inscricoes
    .filter((i) => i.palestraId === segmento.palestraId && i.status !== "CANCELADA")
    .map((i) => i.aluno.id);
  return [...new Set(ids)];
}

/** Dúvida fechada não recebe mais resposta; o aluno abre outra pelo app. */
export function podeResponder(status: StatusDuvida): boolean {
  return status !== "FECHADA";
}

/** Status depois de uma nova mensagem: resposta do admin → RESPONDIDA; nova mensagem do aluno → ABERTA. */
export function statusAposMensagem(autor: "ALUNO" | "ADMIN"): StatusDuvida {
  return autor === "ADMIN" ? "RESPONDIDA" : "ABERTA";
}
