import { useList, type HttpError } from "@refinedev/core";
import { Lock } from "lucide-react";
import { useState } from "react";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Coluna } from "../../components/ui/DataTable";
import { useAcaoAdmin } from "../../hooks/useAcaoAdmin";
import { formatarData, formatarHora } from "../../lib/datas";
import { DIAS_DE_BLOQUEIO, PONTOS_PARA_BLOQUEIO } from "../../regras/presenca";
import type { LinhaPresenca, PalestraDetalhada, ResumoEncerramento } from "../../types/dominio";
import styles from "./PresencaTab.module.css";

/**
 * Aba Presença do detalhe da palestra (tela 9.7):
 * presentes x ausentes, presença manual, justificar falta e encerrar a lista
 * (que gera faltas, pontos e bloqueios — seção 4.1).
 */
export function PresencaTab({ palestra }: { palestra: PalestraDetalhada }) {
  const { result, query } = useList<LinhaPresenca>({
    resource: "presencas",
    filters: [{ field: "palestraId", operator: "eq", value: palestra.id }],
    pagination: { mode: "off" },
  });
  const { executar, executando } = useAcaoAdmin();

  const [confirmandoEncerramento, setConfirmandoEncerramento] = useState(false);
  const [aviso, setAviso] = useState<{ tom: "success" | "danger"; texto: string } | null>(null);

  const linhas = result.data;
  const presentes = linhas.filter((l) => l.presenca);
  const ausentes = linhas.filter((l) => !l.presenca);
  const encerrada = palestra.listaEncerrada;
  // Hora fixada ao abrir a aba (recarregar a página atualiza).
  const [abertaEm] = useState(() => Date.now());
  const jaComecou = new Date(palestra.inicio).getTime() <= abertaEm;

  const rodar = async (acao: () => Promise<unknown>, sucesso: string) => {
    setAviso(null);
    try {
      await acao();
      setAviso({ tom: "success", texto: sucesso });
    } catch (falha) {
      setAviso({ tom: "danger", texto: (falha as HttpError).message ?? "Não foi possível concluir a ação." });
    }
  };

  const marcarPresenca = (linha: LinhaPresenca) =>
    rodar(
      () => executar("post", `/admin/palestras/${palestra.id}/presencas`, { inscricaoId: linha.inscricaoId }),
      `Presença de ${linha.aluno.nome} registrada manualmente.`,
    );

  const justificarFalta = (linha: LinhaPresenca) =>
    rodar(
      () => executar("patch", `/admin/faltas/${linha.falta!.id}/justificar`),
      `Falta de ${linha.aluno.nome} justificada. O ponto dessa falta foi retirado.`,
    );

  const encerrar = async () => {
    setAviso(null);
    try {
      const resumo = (await executar("post", `/admin/palestras/${palestra.id}/encerrar`)) as unknown as ResumoEncerramento;
      setAviso({
        tom: "success",
        texto: `Lista encerrada: ${resumo.faltasGeradas} falta(s) registrada(s) e ${resumo.bloqueiosAplicados} aluno(s) bloqueado(s).`,
      });
    } catch (falha) {
      setAviso({ tom: "danger", texto: (falha as HttpError).message ?? "Não foi possível encerrar a lista." });
    } finally {
      setConfirmandoEncerramento(false);
    }
  };

  if (query.isError) {
    return (
      <Alert tone="danger" title="Não foi possível carregar a presença">
        {query.error?.message}
      </Alert>
    );
  }

  const colunasAusentes: Coluna<LinhaPresenca>[] = [
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
      key: "situacao",
      header: "Situação",
      render: (l) => (
        <span className={styles.badges}>
          {l.cancelouEmCimaDaHora && <Badge tone="danger">Cancelou com menos de 72h</Badge>}
          {l.falta?.justificada && <Badge tone="success">Falta justificada</Badge>}
          {l.falta && !l.falta.justificada && <Badge tone="danger">Falta</Badge>}
          <SituacaoPontos linha={l} />
        </span>
      ),
    },
    {
      key: "acoes",
      header: "Ações",
      align: "right",
      render: (l) => {
        if (!encerrada && !l.cancelouEmCimaDaHora) {
          return (
            <Button variant="success" size="sm" disabled={executando} onClick={() => marcarPresenca(l)}>
              Marcar presença
            </Button>
          );
        }
        if (l.falta && !l.falta.justificada) {
          return (
            <Button variant="ghost" size="sm" disabled={executando} onClick={() => justificarFalta(l)}>
              Justificar falta
            </Button>
          );
        }
        return null;
      },
    },
  ];

  const colunasPresentes: Coluna<LinhaPresenca>[] = [
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
    { key: "hora", header: "Chegada", render: (l) => formatarHora(l.presenca!.registradaEm) },
    {
      key: "origem",
      header: "Registro",
      render: (l) => <Badge tone={l.presenca!.origem === "QR" ? "purple" : "neutral"}>{l.presenca!.origem === "QR" ? "QR Code" : "Manual"}</Badge>,
    },
  ];

  return (
    <div className={styles.aba}>
      <div className={styles.resumo}>
        <div className={styles.numero}>
          <span>Presentes</span>
          <strong>{presentes.length}</strong>
        </div>
        <div className={styles.numero}>
          <span>{encerrada ? "Faltaram" : "Ainda não chegaram"}</span>
          <strong>{ausentes.length}</strong>
        </div>

        <div className={styles.acaoEncerrar}>
          {encerrada ? (
            <Badge tone="neutral" icon={<Lock size={12} aria-hidden="true" />}>
              Lista encerrada
            </Badge>
          ) : (
            <Button
              variant="danger"
              onClick={() => setConfirmandoEncerramento(true)}
              disabled={!jaComecou || executando || query.isLoading}
              title={jaComecou ? undefined : "Disponível depois que a palestra começar"}
            >
              <Lock size={16} aria-hidden="true" />
              Encerrar lista
            </Button>
          )}
        </div>
      </div>

      {!encerrada && !jaComecou && (
        <Alert tone="info">
          A lista abre no dia da palestra ({formatarData(palestra.inicio)}). O check-in é feito na tela Check-in, pelo celular.
        </Alert>
      )}
      {aviso && <Alert tone={aviso.tom}>{aviso.texto}</Alert>}

      <section className={styles.secao}>
        <h2 className={styles.titulo}>{encerrada ? "Ausentes" : "Aguardando chegada"}</h2>
        <DataTable
          caption="Alunos sem presença registrada"
          columns={colunasAusentes}
          rows={ausentes}
          rowKey={(l) => l.inscricaoId}
          loading={query.isLoading}
          emptyMessage={encerrada ? "Ninguém faltou." : "Todos os confirmados já chegaram."}
        />
      </section>

      <section className={styles.secao}>
        <h2 className={styles.titulo}>Presentes</h2>
        <DataTable
          caption="Alunos presentes"
          columns={colunasPresentes}
          rows={presentes}
          rowKey={(l) => l.inscricaoId}
          loading={query.isLoading}
          emptyMessage="Nenhuma presença registrada ainda."
        />
      </section>

      <ConfirmDialog
        open={confirmandoEncerramento}
        title="Encerrar a lista de presença?"
        confirmLabel="Encerrar lista"
        tone="danger"
        busy={executando}
        onConfirm={encerrar}
        onCancel={() => setConfirmandoEncerramento(false)}
      >
        <p>
          {ausentes.length} aluno(s) sem presença vão receber 1 ponto de falta. Quem chegar a {PONTOS_PARA_BLOQUEIO} pontos
          fica bloqueado por {DIAS_DE_BLOQUEIO} dias para novas inscrições, e o aluno é avisado no app.
        </p>
        <p>Depois de encerrar não dá para registrar presença nem reabrir a lista. Faltas podem ser justificadas a qualquer momento.</p>
      </ConfirmDialog>
    </div>
  );
}

function SituacaoPontos({ linha }: { linha: LinhaPresenca }) {
  if (linha.aluno.bloqueadoAte) return <Badge tone="danger">Bloqueado até {formatarData(linha.aluno.bloqueadoAte)}</Badge>;
  if (linha.aluno.pontosFalta > 0) return <Badge tone="neutral">{linha.aluno.pontosFalta} ponto(s)</Badge>;
  return null;
}
