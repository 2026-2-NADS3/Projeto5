import type { LetraDisc, LetraRiasec, StatusInscricao } from "../../types/dominio";

/** Textos e etiquetas usados nas telas de alunos (9.3 e 9.4). */

export const ROTULO_DISC: Record<LetraDisc, string> = {
  D: "Dominância",
  I: "Influência",
  S: "Estabilidade",
  C: "Conformidade",
};

export const ROTULO_RIASEC: Record<LetraRiasec, string> = {
  R: "Realista",
  I: "Investigativo",
  A: "Artístico",
  S: "Social",
  E: "Empreendedor",
  C: "Convencional",
};

export const ROTULO_INSCRICAO: Record<StatusInscricao, string> = {
  ATIVA: "Confirmada",
  ESPERA: "Lista de espera",
  CONVIDADA: "Convite pendente",
  CANCELADA: "Cancelada",
};
