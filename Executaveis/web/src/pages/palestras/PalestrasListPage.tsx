import { useList } from "@refinedev/core";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { DataTable, type Coluna } from "../../components/ui/DataTable";
import { DateTile } from "../../components/ui/DateTile";
import { SelectField } from "../../components/ui/form/Field";
import { PageHeader } from "../../components/ui/PageHeader";
import { formatarDiaSemana, formatarHorario, situacaoDaPalestra, type Situacao } from "../../lib/datas";
import type { PalestraDetalhada } from "../../types/dominio";
import { SituacaoBadge, TipoBadge } from "./Badges";
import styles from "./PalestrasListPage.module.css";

/** Tela 9.5 — lista de palestras com filtro por situação. */
type LinhaPalestra = PalestraDetalhada & { situacao: Situacao };

export function PalestrasListPage() {
  const navigate = useNavigate();
  const [filtroSituacao, setFiltroSituacao] = useState<Situacao | "TODAS">("TODAS");

  const { result, query } = useList<PalestraDetalhada>({
    resource: "palestras",
    pagination: { mode: "off" },
  });

  const linhas = useMemo<LinhaPalestra[]>(
    () =>
      result.data
        .map((p) => ({ ...p, situacao: situacaoDaPalestra(p.inicio, p.listaEncerrada) }))
        .filter((p) => filtroSituacao === "TODAS" || p.situacao === filtroSituacao),
    [result.data, filtroSituacao],
  );

  const colunas: Coluna<LinhaPalestra>[] = [
    {
      key: "data",
      header: "Data",
      render: (p) => (
        <span className={styles.data}>
          <DateTile iso={p.inicio} size="sm" destaque={p.situacao === "HOJE"} apagado={p.situacao === "ENCERRADA"} />
          <span className={styles.dataTexto}>
            <strong>{formatarDiaSemana(p.inicio)}</strong>
            <span>{formatarHorario(p.inicio, p.fim)}</span>
          </span>
        </span>
      ),
    },
    {
      key: "evento",
      header: "Evento",
      render: (p) => (
        <span className={styles.evento}>
          <strong>{p.evento.titulo}</strong>
          {p.sala && <span>{p.sala}</span>}
        </span>
      ),
    },
    { key: "tipo", header: "Tipo", render: (p) => <TipoBadge tipo={p.evento.tipo} /> },
    {
      key: "vagas",
      header: "Vagas",
      align: "right",
      render: (p) => (
        <span className={p.vagas !== null && p.contagem.confirmados >= p.vagas ? styles.lotada : undefined}>
          {p.contagem.confirmados} / {p.vagas ?? "—"}
        </span>
      ),
    },
    { key: "espera", header: "Espera", align: "right", render: (p) => p.contagem.espera },
    { key: "situacao", header: "Situação", render: (p) => <SituacaoBadge situacao={p.situacao} /> },
  ];

  return (
    <>
      <PageHeader
        title="Palestras"
        description="Edições cadastradas, com vagas ocupadas e lista de espera."
        actions={
          <Button onClick={() => navigate("/palestras/nova")}>
            <Plus size={18} aria-hidden="true" />
            Nova palestra
          </Button>
        }
      />

      <div className={styles.filtros}>
        <SelectField
          label="Situação"
          value={filtroSituacao}
          onChange={(e) => setFiltroSituacao(e.target.value as Situacao | "TODAS")}
        >
          <option value="TODAS">Todas</option>
          <option value="HOJE">Hoje</option>
          <option value="FUTURA">Futuras</option>
          <option value="ENCERRADA">Encerradas</option>
        </SelectField>
      </div>

      {query.isError ? (
        <Alert tone="danger" title="Não foi possível carregar as palestras">
          {query.error?.message}
        </Alert>
      ) : (
        <DataTable
          caption="Lista de palestras"
          columns={colunas}
          rows={linhas}
          rowKey={(p) => p.id}
          onRowClick={(p) => navigate(`/palestras/${p.id}`)}
          loading={query.isLoading}
          emptyMessage="Nenhuma palestra encontrada com esses filtros."
        />
      )}
    </>
  );
}
