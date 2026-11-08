import { useNavigate } from "react-router";
import { Alert } from "../../components/ui/Alert";
import { DataTable, type Coluna } from "../../components/ui/DataTable";
import { formatarDataHora } from "../../lib/datas";
import type { DuvidaResumo, StatusDuvida } from "../../types/dominio";
import styles from "./Comunicacao.module.css";

/** Uma das caixas de dúvidas (abertas, respondidas ou fechadas). Clicar abre a conversa. */
export function DuvidasTab({
  status,
  duvidas,
  carregando,
  erro,
}: {
  status: StatusDuvida;
  duvidas: DuvidaResumo[];
  carregando: boolean;
  erro?: string;
}) {
  const navigate = useNavigate();
  const linhas = duvidas.filter((d) => d.status === status);

  if (erro) {
    return (
      <Alert tone="danger" title="Não foi possível carregar as dúvidas">
        {erro}
      </Alert>
    );
  }

  const colunas: Coluna<DuvidaResumo>[] = [
    {
      key: "assunto",
      header: "Dúvida",
      render: (d) => (
        <span className={styles.mensagem}>
          <strong>{d.assunto}</strong>
          <span>
            {d.ultimaMensagem.autor === "ADMIN" ? "Equipe: " : ""}
            {d.ultimaMensagem.texto}
          </span>
        </span>
      ),
    },
    {
      key: "aluno",
      header: "Aluno",
      render: (d) => (
        <span className={styles.mensagem}>
          <strong>{d.aluno.nome}</strong>
          <span>{d.aluno.email}</span>
        </span>
      ),
    },
    { key: "ultima", header: "Última mensagem", render: (d) => formatarDataHora(d.ultimaMensagem.criadaEm) },
  ];

  const vazio: Record<StatusDuvida, string> = {
    ABERTA: "Nenhuma dúvida esperando resposta.",
    RESPONDIDA: "Nenhuma dúvida respondida.",
    FECHADA: "Nenhuma dúvida fechada.",
  };

  return (
    <DataTable
      caption="Dúvidas dos alunos"
      columns={colunas}
      rows={linhas}
      rowKey={(d) => d.id}
      onRowClick={(d) => navigate(`/comunicacao/duvidas/${d.id}`)}
      loading={carregando}
      emptyMessage={vazio[status]}
    />
  );
}
