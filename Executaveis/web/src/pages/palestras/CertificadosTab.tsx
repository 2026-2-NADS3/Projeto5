import { useList, type HttpError } from "@refinedev/core";
import { Award } from "lucide-react";
import { useState } from "react";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Coluna } from "../../components/ui/DataTable";
import { useAcaoAdmin } from "../../hooks/useAcaoAdmin";
import { formatarData, formatarHora } from "../../lib/datas";
import type { LinhaCertificado, PalestraDetalhada, ResumoCertificados } from "../../types/dominio";
import styles from "./PresencaTab.module.css";

/**
 * Aba Certificados do detalhe da palestra (tela 9.7, seção 4.2).
 * O painel só avisa a API quem esteve presente; a API gera o certificado
 * e o app notifica o aluno. Nada de PDF é guardado ou aberto aqui.
 */
export function CertificadosTab({ palestra }: { palestra: PalestraDetalhada }) {
  const { result, query } = useList<LinhaCertificado>({
    resource: "certificados",
    filters: [{ field: "palestraId", operator: "eq", value: palestra.id }],
    pagination: { mode: "off" },
  });
  const { executar, executando } = useAcaoAdmin();

  const [confirmando, setConfirmando] = useState(false);
  const [aviso, setAviso] = useState<{ tom: "success" | "danger"; texto: string } | null>(null);

  const linhas = result.data;
  const pendentes = linhas.filter((l) => l.situacao === "PENDENTE").length;
  const liberados = linhas.filter((l) => l.situacao === "LIBERADO").length;

  const liberar = async () => {
    setAviso(null);
    try {
      const resumo = (await executar("post", `/admin/palestras/${palestra.id}/certificados`)) as unknown as ResumoCertificados;
      setAviso({
        tom: "success",
        texto: `${resumo.liberados} certificado(s) liberado(s). Os alunos serão avisados no app.`,
      });
    } catch (falha) {
      setAviso({ tom: "danger", texto: (falha as HttpError).message ?? "Não foi possível liberar os certificados." });
    } finally {
      setConfirmando(false);
    }
  };

  if (query.isError) {
    return (
      <Alert tone="danger" title="Não foi possível carregar os certificados">
        {query.error?.message}
      </Alert>
    );
  }

  const colunas: Coluna<LinhaCertificado>[] = [
    {
      key: "aluno",
      header: "Aluno",
      render: (l) => (
        <span className={styles.aluno}>
          <strong>{l.aluno.nome}</strong>
          <span>{l.aluno.email}</span>
        </span>
      ),
    },
    {
      key: "presenca",
      header: "Presença",
      render: (l) => `${formatarHora(l.presenca.registradaEm)} · ${l.presenca.origem === "QR" ? "QR Code" : "Manual"}`,
    },
    { key: "situacao", header: "Certificado", render: (l) => <SituacaoBadge linha={l} /> },
  ];

  return (
    <div className={styles.aba}>
      <div className={styles.resumo}>
        <div className={styles.numero}>
          <span>Presentes</span>
          <strong>{linhas.length}</strong>
        </div>
        <div className={styles.numero}>
          <span>Liberados</span>
          <strong>{liberados}</strong>
        </div>
        <div className={styles.numero}>
          <span>Pendentes</span>
          <strong>{pendentes}</strong>
        </div>

        <div className={styles.acaoEncerrar}>
          <Button
            onClick={() => setConfirmando(true)}
            disabled={pendentes === 0 || executando || query.isLoading}
            title={pendentes === 0 ? "Nenhum certificado pendente" : undefined}
          >
            <Award size={16} aria-hidden="true" />
            Liberar certificados
          </Button>
        </div>
      </div>

      <Alert tone="info">
        Quem tem presença registrada (QR Code ou manual) já pode receber o certificado. Ao liberar, o painel avisa a
        API, que gera o certificado e notifica o aluno no app. Cada aluno recebe um certificado por evento.
      </Alert>
      <div aria-live="polite">{aviso && <Alert tone={aviso.tom}>{aviso.texto}</Alert>}</div>

      <DataTable
        caption="Certificados dos alunos presentes"
        columns={colunas}
        rows={linhas}
        rowKey={(l) => l.presenca.id}
        loading={query.isLoading}
        emptyMessage="Nenhuma presença registrada ainda."
      />

      <ConfirmDialog
        open={confirmando}
        title="Liberar os certificados?"
        confirmLabel="Liberar certificados"
        busy={executando}
        onConfirm={liberar}
        onCancel={() => setConfirmando(false)}
      >
        <p>
          {pendentes} aluno(s) presente(s) vão receber o certificado de "{palestra.evento.titulo}" e uma notificação no
          app.
        </p>
        <p>Não dá para desfazer. Quem chegar depois pode ser liberado depois, com o mesmo botão.</p>
      </ConfirmDialog>
    </div>
  );
}

function SituacaoBadge({ linha }: { linha: LinhaCertificado }) {
  if (linha.situacao === "LIBERADO") return <Badge tone="success">Liberado em {formatarData(linha.liberadoEm!)}</Badge>;
  if (linha.situacao === "JA_RECEBEU") return <Badge tone="purple">Já recebeu deste evento</Badge>;
  return <Badge tone="neutral">Pendente</Badge>;
}
