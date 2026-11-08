import { useList } from "@refinedev/core";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Alert } from "../../components/ui/Alert";
import { DataTable, type Coluna } from "../../components/ui/DataTable";
import { InputField, SelectField } from "../../components/ui/form/Field";
import { PageHeader } from "../../components/ui/PageHeader";
import type { AlunoListado, LetraDisc } from "../../types/dominio";
import { DiscBadge, StatusAlunoBadge } from "./Badges";
import { ROTULO_DISC } from "./rotulos";
import styles from "./AlunosListPage.module.css";

/** Tela 9.3 — alunos cadastrados no app. Só consulta: o cadastro é feito pelo próprio aluno no app. */
type FiltroStatus = "TODOS" | "ATIVO" | "BLOQUEADO";

const normalizar = (texto: string) => texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function AlunosListPage() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("TODOS");
  const [filtroDisc, setFiltroDisc] = useState<LetraDisc | "TODOS">("TODOS");

  const { result, query } = useList<AlunoListado>({ resource: "alunos", pagination: { mode: "off" } });

  const linhas = useMemo(() => {
    const termo = normalizar(busca.trim());
    return result.data
      .filter((a) => !termo || normalizar(a.nome).includes(termo) || normalizar(a.email).includes(termo))
      .filter((a) => filtroStatus === "TODOS" || (filtroStatus === "BLOQUEADO") === Boolean(a.bloqueadoAte))
      .filter((a) => filtroDisc === "TODOS" || a.disc === filtroDisc);
  }, [result.data, busca, filtroStatus, filtroDisc]);

  const colunas: Coluna<AlunoListado>[] = [
    {
      key: "aluno",
      header: "Aluno",
      render: (a) => (
        <span className={styles.aluno}>
          <strong>{a.nome}</strong>
          <span>{a.email}</span>
        </span>
      ),
    },
    { key: "disc", header: "Perfil DISC", render: (a) => <DiscBadge letra={a.disc} /> },
    { key: "palestras", header: "Palestras", align: "right", render: (a) => a.palestrasFrequentadas },
    { key: "pontos", header: "Pontos de falta", align: "right", render: (a) => a.pontosFalta },
    { key: "status", header: "Status", render: (a) => <StatusAlunoBadge situacao={a} /> },
  ];

  return (
    <>
      <PageHeader title="Alunos" description="Alunos cadastrados no app, com perfil, frequência e situação de faltas." />

      <div className={styles.filtros}>
        <InputField
          label="Buscar"
          type="search"
          placeholder="Nome ou e-mail"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <SelectField label="Status" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as FiltroStatus)}>
          <option value="TODOS">Todos</option>
          <option value="ATIVO">Ativos</option>
          <option value="BLOQUEADO">Bloqueados</option>
        </SelectField>
        <SelectField label="Perfil DISC" value={filtroDisc} onChange={(e) => setFiltroDisc(e.target.value as LetraDisc | "TODOS")}>
          <option value="TODOS">Todos</option>
          {(Object.keys(ROTULO_DISC) as LetraDisc[]).map((letra) => (
            <option key={letra} value={letra}>
              {letra} · {ROTULO_DISC[letra]}
            </option>
          ))}
        </SelectField>
      </div>

      {query.isError ? (
        <Alert tone="danger" title="Não foi possível carregar os alunos">
          {query.error?.message}
        </Alert>
      ) : (
        <>
          <p className={styles.contagem} aria-live="polite">
            {query.isLoading ? "" : `${linhas.length} de ${result.data.length} aluno(s)`}
          </p>
          <DataTable
            caption="Lista de alunos"
            columns={colunas}
            rows={linhas}
            rowKey={(a) => a.id}
            onRowClick={(a) => navigate(`/alunos/${a.id}`)}
            loading={query.isLoading}
            emptyMessage="Nenhum aluno encontrado com esses filtros."
          />
        </>
      )}
    </>
  );
}
