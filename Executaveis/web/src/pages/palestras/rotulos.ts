import type { StatusInscricao, TipoEvento } from "../../types/dominio";

/** Textos e regras de exibição usados nas telas de palestras. */

export const ROTULO_TIPO: Record<TipoEvento, string> = {
  PADRAO: "Padrão",
  SOFT_SKILLS: "Soft skills",
};

/** Status do convite da lista de espera, como pede a tela 9.7. */
export type StatusConvite = "AGUARDANDO" | "PENDENTE" | "EXPIRADO";

export function statusDoConvite(status: StatusInscricao, conviteExpiraEm: string | null, agora = new Date()): StatusConvite {
  if (status !== "CONVIDADA" || !conviteExpiraEm) return "AGUARDANDO";
  return new Date(conviteExpiraEm) < agora ? "EXPIRADO" : "PENDENTE";
}
