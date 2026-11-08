import { useList, type HttpError } from "@refinedev/core";
import { Shuffle } from "lucide-react";
import { useState } from "react";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useAcaoAdmin } from "../../hooks/useAcaoAdmin";
import type { GrupoDisc, MembroGrupo, PalestraDetalhada } from "../../types/dominio";
import { ROTULO_DISC } from "../alunos/rotulos";
import styles from "./GruposTab.module.css";

/**
 * Aba Grupos DISC (seção 4.3), só em palestras de soft skills.
 * A API gera os grupos sozinha na véspera; aqui o admin pode regerar ou mover alguém de grupo.
 * No dia, o convite do aluno no app mostra só o número do grupo.
 */
export function GruposTab({ palestra }: { palestra: PalestraDetalhada }) {
  const { result, query } = useList<GrupoDisc>({
    resource: "grupos",
    filters: [{ field: "palestraId", operator: "eq", value: palestra.id }],
    pagination: { mode: "off" },
  });
  const { executar, executando } = useAcaoAdmin();
  const [confirmando, setConfirmando] = useState(false);
  const [aviso, setAviso] = useState<{ tom: "success" | "danger"; texto: string } | null>(null);

  const grupos = result.data;
  const editavel = !palestra.listaEncerrada;

  const rodar = async (acao: () => Promise<unknown>, sucesso: string) => {
    setAviso(null);
    try {
      await acao();
      setAviso({ tom: "success", texto: sucesso });
    } catch (falha) {
      setAviso({ tom: "danger", texto: (falha as HttpError).message ?? "Não foi possível concluir a ação." });
    }
  };

  const gerar = async () => {
    await rodar(() => executar("post", `/admin/palestras/${palestra.id}/grupos`), "Grupos gerados com os inscritos confirmados.");
    setConfirmando(false);
  };

  const mover = (membro: MembroGrupo, destino: GrupoDisc) =>
    rodar(
      () =>
        executar("put", `/admin/grupos/${destino.id}/membros`, {
          alunoIds: [...destino.membros.map((m) => m.aluno.id), membro.aluno.id],
        }),
      `${membro.aluno.nome} foi para o grupo ${destino.numero}.`,
    );

  if (query.isError) {
    return (
      <Alert tone="danger" title="Não foi possível carregar os grupos">
        {query.error?.message}
      </Alert>
    );
  }

  return (
    <div className={styles.aba}>
      <div className={styles.topo}>
        <p className={styles.explicacao}>
          Grupos de 4 pessoas, uma de cada letra (D, I, S, C) sempre que possível; quem sobra entra num grupo que fica
          com 5. São gerados automaticamente na véspera com os confirmados, e o convite do aluno mostra só o número do
          grupo.
        </p>
        {editavel && (
          <Button variant={grupos.length ? "ghost" : "primary"} onClick={() => setConfirmando(true)} disabled={executando || query.isLoading}>
            <Shuffle size={16} aria-hidden="true" />
            {grupos.length ? "Regerar grupos" : "Gerar grupos"}
          </Button>
        )}
      </div>

      <div aria-live="polite">{aviso && <Alert tone={aviso.tom}>{aviso.texto}</Alert>}</div>

      {!query.isLoading && grupos.length === 0 && (
        <Alert tone="info">Os grupos ainda não foram gerados. Eles saem na véspera ou quando você clicar em "Gerar grupos".</Alert>
      )}

      <ol className={styles.grupos}>
        {grupos.map((grupo) => {
          const repetidas = grupo.membros.filter((m, i, todos) => m.letra && todos.findIndex((o) => o.letra === m.letra) !== i).length;
          return (
            <li key={grupo.id} className={styles.grupo}>
              <h3 className={styles.grupoTitulo}>
                Grupo {grupo.numero}
                <span>{grupo.membros.length} pessoas</span>
              </h3>
              <ul className={styles.membros}>
                {grupo.membros.map((membro) => (
                  <li key={membro.aluno.id} className={styles.membro}>
                    <span className={styles.letra} title={membro.letra ? ROTULO_DISC[membro.letra] : "Sem teste DISC"}>
                      {membro.letra ?? "?"}
                    </span>
                    <span className={styles.nome}>{membro.aluno.nome}</span>
                    {editavel && grupos.length > 1 && (
                      <select
                        className={styles.mover}
                        aria-label={`Mover ${membro.aluno.nome} para outro grupo`}
                        value=""
                        disabled={executando || grupo.membros.length === 1}
                        onChange={(e) => {
                          const destino = grupos.find((g) => g.id === e.target.value);
                          if (destino) mover(membro, destino);
                        }}
                      >
                        <option value="">Mover</option>
                        {grupos
                          .filter((g) => g.id !== grupo.id)
                          .map((g) => (
                            <option key={g.id} value={g.id}>
                              Grupo {g.numero}
                            </option>
                          ))}
                      </select>
                    )}
                  </li>
                ))}
              </ul>
              {repetidas > 0 && <Badge tone="neutral">Letra repetida no grupo</Badge>}
            </li>
          );
        })}
      </ol>

      <ConfirmDialog
        open={confirmando}
        title={grupos.length ? "Regerar os grupos?" : "Gerar os grupos?"}
        confirmLabel={grupos.length ? "Regerar grupos" : "Gerar grupos"}
        busy={executando}
        onConfirm={gerar}
        onCancel={() => setConfirmando(false)}
      >
        <p>
          Os grupos são montados de novo com os {palestra.contagem.confirmados} inscritos confirmados.
          {grupos.length ? " Os grupos atuais e os ajustes manuais são substituídos, e os convites passam a mostrar o novo número." : ""}
        </p>
      </ConfirmDialog>
    </div>
  );
}
