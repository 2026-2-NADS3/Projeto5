import { Badge } from "../../components/ui/Badge";
import { formatarData } from "../../lib/datas";
import type { LetraDisc, SituacaoAluno } from "../../types/dominio";
import { ROTULO_DISC } from "./rotulos";

/** Etiquetas usadas nas telas de alunos. */

export function DiscBadge({ letra }: { letra: LetraDisc | null }) {
  if (!letra) return <Badge tone="neutral">Sem teste</Badge>;
  return (
    <Badge tone="purple">
      {letra} · {ROTULO_DISC[letra]}
    </Badge>
  );
}

/** Status do aluno: ativo, ou bloqueado até a data (seção 4.1). */
export function StatusAlunoBadge({ situacao }: { situacao: SituacaoAluno }) {
  if (situacao.bloqueadoAte) return <Badge tone="danger">Bloqueado até {formatarData(situacao.bloqueadoAte)}</Badge>;
  return <Badge tone="success">Ativo</Badge>;
}
