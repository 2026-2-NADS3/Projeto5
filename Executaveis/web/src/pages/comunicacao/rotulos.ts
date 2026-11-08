import { formatarData } from "../../lib/datas";
import type { Mensagem, PalestraDetalhada, StatusDuvida } from "../../types/dominio";
import { ROTULO_DISC } from "../alunos/rotulos";

/** Textos usados nas telas de comunicação (9.10). */

export const ROTULO_STATUS_DUVIDA: Record<StatusDuvida, string> = {
  ABERTA: "Aberta",
  RESPONDIDA: "Respondida",
  FECHADA: "Fechada",
};

export function rotuloDaPalestra(palestra: Pick<PalestraDetalhada, "inicio" | "evento">): string {
  return `${formatarData(palestra.inicio)} · ${palestra.evento.titulo}`;
}

/** "Todos os alunos", "Inscritos de 10/11/2026 · ENEM" ou "Perfil D · Dominância". */
export function rotuloDoSegmento(mensagem: Pick<Mensagem, "segmento" | "palestraId" | "letraDisc">, palestras: PalestraDetalhada[]): string {
  if (mensagem.segmento === "TODOS") return "Todos os alunos";
  if (mensagem.segmento === "DISC") {
    return mensagem.letraDisc ? `Perfil ${mensagem.letraDisc} · ${ROTULO_DISC[mensagem.letraDisc]}` : "Alunos selecionados";
  }
  const palestra = palestras.find((p) => p.id === mensagem.palestraId);
  return palestra ? `Inscritos de ${rotuloDaPalestra(palestra)}` : "Inscritos de uma palestra";
}
