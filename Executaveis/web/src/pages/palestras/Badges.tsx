import { Badge } from "../../components/ui/Badge";
import type { Situacao } from "../../lib/datas";
import type { TipoEvento } from "../../types/dominio";
import { ROTULO_TIPO, type StatusConvite } from "./rotulos";

/** Etiquetas usadas nas telas de palestras. */

export function TipoBadge({ tipo }: { tipo: TipoEvento }) {
  return <Badge tone={tipo === "SOFT_SKILLS" ? "purple" : "neutral"}>{ROTULO_TIPO[tipo]}</Badge>;
}

const SITUACAO: Record<Situacao, { texto: string; tom: "success" | "purple" | "neutral" }> = {
  HOJE: { texto: "Hoje", tom: "success" },
  FUTURA: { texto: "Futura", tom: "purple" },
  ENCERRADA: { texto: "Encerrada", tom: "neutral" },
};

export function SituacaoBadge({ situacao }: { situacao: Situacao }) {
  const { texto, tom } = SITUACAO[situacao];
  return <Badge tone={tom}>{texto}</Badge>;
}

export function ConviteBadge({ statusConvite }: { statusConvite: StatusConvite }) {
  if (statusConvite === "PENDENTE") return <Badge tone="purple">Convite pendente</Badge>;
  if (statusConvite === "EXPIRADO") return <Badge tone="danger">Convite expirado</Badge>;
  return <Badge tone="neutral">Aguardando vaga</Badge>;
}
