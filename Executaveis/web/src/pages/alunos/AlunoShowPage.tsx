import { useOne, type HttpError } from "@refinedev/core";
import { ArrowLeft, Medal } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable, type Coluna } from "../../components/ui/DataTable";
import { Tabs, type Aba } from "../../components/ui/Tabs";
import { useAcaoAdmin } from "../../hooks/useAcaoAdmin";
import { formatarData, formatarDataHora } from "../../lib/datas";
import { PONTOS_PARA_BLOQUEIO } from "../../regras/presenca";
import type { AlunoDetalhado, PalestraResumo } from "../../types/dominio";
import { DiscBadge, StatusAlunoBadge } from "./Badges";
import { ROTULO_DISC, ROTULO_INSCRICAO, ROTULO_RIASEC } from "./rotulos";
import styles from "./AlunoShowPage.module.css";

/** Tela 9.4 — detalhe do aluno: inscrições, presenças, faltas, certificados e testes. */
export function AlunoShowPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState("inscricoes");
  const [aviso, setAviso] = useState<{ tom: "success" | "danger"; texto: string } | null>(null);
  const { executar, executando } = useAcaoAdmin();

  const { result: aluno, query } = useOne<AlunoDetalhado>({ resource: "alunos", id });

  if (query.isLoading) return <p>Carregando aluno...</p>;
  if (query.isError || !aluno) {
    return (
      <Alert tone="danger" title="Aluno não encontrado">
        {query.error?.message ?? "Confira o endereço e tente de novo."}
      </Alert>
    );
  }

  const justificar = async (faltaId: string) => {
    setAviso(null);
    try {
      await executar("patch", `/admin/faltas/${faltaId}/justificar`);
      setAviso({ tom: "success", texto: "Falta justificada. O ponto dessa falta foi retirado." });
    } catch (falha) {
      setAviso({ tom: "danger", texto: (falha as HttpError).message ?? "Não foi possível justificar a falta." });
    }
  };

  const colunaPalestra = <T extends { palestra: PalestraResumo }>(): Coluna<T> => ({
    key: "palestra",
    header: "Palestra",
    render: (linha) => (
      <span className={styles.palestra}>
        <Link to={`/palestras/${linha.palestra.id}`}>{linha.palestra.eventoTitulo}</Link>
        <span>{formatarData(linha.palestra.inicio)}</span>
      </span>
    ),
  });

  type Inscricao = AlunoDetalhado["inscricoes"][number];
  type Presenca = AlunoDetalhado["presencas"][number];
  type Falta = AlunoDetalhado["faltas"][number];
  type Certificado = AlunoDetalhado["certificados"][number];

  const abas: Aba[] = [
    {
      id: "inscricoes",
      label: `Inscrições (${aluno.inscricoes.length})`,
      content: (
        <DataTable<Inscricao>
          caption="Inscrições do aluno"
          columns={[
            colunaPalestra<Inscricao>(),
            {
              key: "status",
              header: "Situação",
              render: (i) => <Badge tone={i.status === "CANCELADA" ? "neutral" : i.status === "ATIVA" ? "success" : "purple"}>{ROTULO_INSCRICAO[i.status]}</Badge>,
            },
            { key: "data", header: "Feita em", render: (i) => formatarData(i.criadaEm) },
          ]}
          rows={aluno.inscricoes}
          rowKey={(i) => i.id}
          emptyMessage="Nenhuma inscrição."
        />
      ),
    },
    {
      id: "presencas",
      label: `Presenças (${aluno.presencas.length})`,
      content: (
        <DataTable<Presenca>
          caption="Presenças do aluno"
          columns={[
            colunaPalestra<Presenca>(),
            { key: "hora", header: "Registrada em", render: (p) => formatarDataHora(p.registradaEm) },
            {
              key: "origem",
              header: "Registro",
              render: (p) => <Badge tone={p.origem === "QR" ? "purple" : "neutral"}>{p.origem === "QR" ? "QR Code" : "Manual"}</Badge>,
            },
          ]}
          rows={aluno.presencas}
          rowKey={(p) => p.id}
          emptyMessage="Nenhuma presença registrada."
        />
      ),
    },
    {
      id: "faltas",
      label: `Faltas (${aluno.faltas.length})`,
      content: (
        <div className={styles.aba}>
          <div aria-live="polite">{aviso && <Alert tone={aviso.tom}>{aviso.texto}</Alert>}</div>
          <DataTable<Falta>
            caption="Faltas do aluno"
            columns={[
              colunaPalestra<Falta>(),
              {
                key: "situacao",
                header: "Situação",
                render: (f) => (f.justificada ? <Badge tone="success">Justificada</Badge> : <Badge tone="danger">Falta</Badge>),
              },
              {
                key: "acoes",
                header: "Ações",
                align: "right",
                render: (f) =>
                  f.justificada ? null : (
                    <Button variant="ghost" size="sm" disabled={executando} onClick={() => justificar(f.id)}>
                      Justificar
                    </Button>
                  ),
              },
            ]}
            rows={aluno.faltas}
            rowKey={(f) => f.id}
            emptyMessage="Nenhuma falta."
          />
        </div>
      ),
    },
    {
      id: "certificados",
      label: `Certificados (${aluno.certificados.length})`,
      content: (
        <div className={styles.aba}>
          <Alert tone="info">Um certificado por evento. O PDF é gerado pela API e o aluno abre pelo app.</Alert>
          <DataTable<Certificado>
            caption="Certificados do aluno"
            columns={[
              colunaPalestra<Certificado>(),
              { key: "liberado", header: "Liberado em", render: (c) => formatarData(c.liberadoEm) },
            ]}
            rows={aluno.certificados}
            rowKey={(c) => c.id}
            emptyMessage="Nenhum certificado liberado."
          />
        </div>
      ),
    },
    {
      id: "testes",
      label: "Testes",
      content: (
        <div className={styles.testes}>
          <Card>
            <h3 className={styles.testeTitulo}>DISC</h3>
            {aluno.disc ? (
              <p className={styles.testeResultado}>
                <strong>{aluno.disc}</strong> {ROTULO_DISC[aluno.disc]}
              </p>
            ) : (
              <p className={styles.semTeste}>Ainda não fez o teste. Ele é obrigatório para palestras de soft skills.</p>
            )}
          </Card>
          <Card>
            <h3 className={styles.testeTitulo}>RIASEC</h3>
            {aluno.riasec ? (
              <p className={styles.testeResultado}>
                <strong>{aluno.riasec}</strong> {ROTULO_RIASEC[aluno.riasec]}
              </p>
            ) : (
              <p className={styles.semTeste}>Ainda não fez o teste.</p>
            )}
          </Card>
        </div>
      ),
    },
  ];

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => navigate("/alunos")} className={styles.voltar}>
        <ArrowLeft size={16} aria-hidden="true" />
        Alunos
      </Button>

      <Card accent={aluno.bloqueadoAte ? "neutral" : "yellow"}>
        <div className={styles.cabecalho}>
          <div className={styles.info}>
            <div className={styles.badges}>
              <StatusAlunoBadge situacao={aluno} />
              <DiscBadge letra={aluno.disc} />
            </div>
            <h1 className={styles.nome}>{aluno.nome}</h1>
            <p className={styles.email}>{aluno.email}</p>
          </div>
          <dl className={styles.numeros}>
            <div>
              <dt>Palestras</dt>
              <dd>{aluno.palestrasFrequentadas}</dd>
            </div>
            <div>
              <dt>Badges</dt>
              <dd>
                <Medal size={20} aria-hidden="true" />
                {aluno.badges}
              </dd>
            </div>
            <div>
              <dt>Pontos de falta</dt>
              <dd className={aluno.pontosFalta > 0 ? styles.alerta : undefined}>
                {aluno.pontosFalta}
                <span>/ {PONTOS_PARA_BLOQUEIO}</span>
              </dd>
            </div>
          </dl>
        </div>
      </Card>

      <div className={styles.abas}>
        <Tabs tabs={abas} activeId={abaAtiva} onChange={setAbaAtiva} />
      </div>
    </>
  );
}
