import { useList } from "@refinedev/core";
import { useMemo, useState } from "react";
import { Alert } from "../../components/ui/Alert";
import { DataTable, type Coluna } from "../../components/ui/DataTable";
import { InputField } from "../../components/ui/form/Field";
import { formatarDataHora } from "../../lib/datas";
import type { Inscricao } from "../../types/dominio";
import { ConviteBadge } from "./Badges";
import { statusDoConvite } from "./rotulos";
import styles from "./InscritosTab.module.css";

/**
 * Aba Inscritos do detalhe da palestra (tela 9.7):
 * confirmados e, abaixo, a lista de espera em ordem com o status do convite.
 * O painel só consulta — quem se inscreve, cancela e aceita convite é o aluno, pelo app.
 */
export function InscritosTab({ palestraId }: { palestraId: string }) {
  const [busca, setBusca] = useState("");

  const { result, query } = useList<Inscricao>({
    resource: "inscricoes",
    filters: [{ field: "palestraId", operator: "eq", value: palestraId }],
    pagination: { mode: "off" },
  });

  const { confirmados, espera, cancelados } = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtradas = result.data.filter(
      (i) => !termo || i.aluno.nome.toLowerCase().includes(termo) || i.aluno.email.toLowerCase().includes(termo),
    );
    return {
      confirmados: filtradas
        .filter((i) => i.status === "ATIVA")
        .sort((a, b) => a.aluno.nome.localeCompare(b.aluno.nome, "pt-BR")),
      espera: filtradas
        .filter((i) => i.status === "ESPERA" || i.status === "CONVIDADA")
        .sort((a, b) => (a.posicaoEspera ?? 0) - (b.posicaoEspera ?? 0)),
      cancelados: filtradas.filter((i) => i.status === "CANCELADA"),
    };
  }, [result.data, busca]);

  if (query.isError) {
    return (
      <Alert tone="danger" title="Não foi possível carregar os inscritos">
        {query.error?.message}
      </Alert>
    );
  }

  const colunasConfirmados: Coluna<Inscricao>[] = [
    { key: "nome", header: "Aluno", render: (i) => <strong>{i.aluno.nome}</strong> },
    { key: "email", header: "E-mail", render: (i) => i.aluno.email },
    { key: "data", header: "Inscrito em", render: (i) => formatarDataHora(i.criadaEm) },
  ];

  const colunasEspera: Coluna<Inscricao>[] = [
    { key: "posicao", header: "Posição", align: "center", render: (i) => <span className={styles.posicao}>{i.posicaoEspera}º</span> },
    { key: "nome", header: "Aluno", render: (i) => <strong>{i.aluno.nome}</strong> },
    { key: "email", header: "E-mail", render: (i) => i.aluno.email },
    {
      key: "convite",
      header: "Convite",
      render: (i) => {
        const status = statusDoConvite(i.status, i.conviteExpiraEm);
        return (
          <span className={styles.convite}>
            <ConviteBadge statusConvite={status} />
            {i.conviteExpiraEm && status === "PENDENTE" && (
              <span className={styles.expira}>expira {formatarDataHora(i.conviteExpiraEm)}</span>
            )}
          </span>
        );
      },
    },
  ];

  const colunasCancelados: Coluna<Inscricao>[] = [
    { key: "nome", header: "Aluno", render: (i) => i.aluno.nome },
    { key: "email", header: "E-mail", render: (i) => i.aluno.email },
    { key: "cancelada", header: "Cancelou em", render: (i) => (i.canceladaEm ? formatarDataHora(i.canceladaEm) : "—") },
  ];

  return (
    <div className={styles.aba}>
      <div className={styles.busca}>
        <InputField
          label="Buscar aluno"
          type="search"
          placeholder="Nome ou e-mail"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <section className={styles.secao}>
        <h2 className={styles.titulo}>
          Confirmados <span className={styles.contador}>{confirmados.length}</span>
        </h2>
        <DataTable
          caption="Inscritos confirmados"
          columns={colunasConfirmados}
          rows={confirmados}
          rowKey={(i) => i.id}
          loading={query.isLoading}
          emptyMessage={busca ? "Ninguém encontrado com essa busca." : "Nenhum inscrito confirmado ainda."}
        />
      </section>

      <section className={styles.secao}>
        <h2 className={styles.titulo}>
          Lista de espera <span className={styles.contador}>{espera.length}</span>
        </h2>
        <p className={styles.explicacao}>
          Quando um confirmado cancela, o 1º da fila recebe convite e tem 24h para aceitar pelo app. Se recusar ou
          deixar expirar, o convite passa para o próximo.
        </p>
        <DataTable
          caption="Lista de espera"
          columns={colunasEspera}
          rows={espera}
          rowKey={(i) => i.id}
          loading={query.isLoading}
          emptyMessage="Ninguém na lista de espera."
        />
      </section>

      {cancelados.length > 0 && (
        <details className={styles.cancelados}>
          <summary>Cancelamentos ({cancelados.length})</summary>
          <DataTable
            caption="Inscrições canceladas"
            columns={colunasCancelados}
            rows={cancelados}
            rowKey={(i) => i.id}
            emptyMessage="Nenhum cancelamento."
          />
        </details>
      )}
    </div>
  );
}
