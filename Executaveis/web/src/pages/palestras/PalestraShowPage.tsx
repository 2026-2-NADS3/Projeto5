import { useOne } from "@refinedev/core";
import { ArrowLeft, CalendarDays, Clock, MapPin, Pencil } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DateTile } from "../../components/ui/DateTile";
import { Tabs, type Aba } from "../../components/ui/Tabs";
import { formatarData, formatarDiaSemana, formatarHorario, situacaoDaPalestra } from "../../lib/datas";
import type { PalestraDetalhada } from "../../types/dominio";
import { CertificadosTab } from "./CertificadosTab";
import { GruposTab } from "./GruposTab";
import { InscritosTab } from "./InscritosTab";
import { PresencaTab } from "./PresencaTab";
import { SituacaoBadge, TipoBadge } from "./Badges";
import styles from "./PalestraShowPage.module.css";

/** Tela 9.7 — detalhe da palestra, com as abas Inscritos, Presença, Grupos DISC (soft skills) e Certificados. */
export function PalestraShowPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [busca] = useSearchParams();
  // ?aba=presenca abre direto na aba Presença (atalho vindo da tela de check-in).
  const [abaAtiva, setAbaAtiva] = useState(busca.get("aba") ?? "inscritos");

  const { result: palestra, query } = useOne<PalestraDetalhada>({ resource: "palestras", id });

  if (query.isLoading) return <p>Carregando palestra...</p>;
  if (query.isError || !palestra) {
    return (
      <Alert tone="danger" title="Palestra não encontrada">
        {query.error?.message ?? "Confira o endereço e tente de novo."}
      </Alert>
    );
  }

  const situacao = situacaoDaPalestra(palestra.inicio, palestra.listaEncerrada);
  const softSkills = palestra.evento.tipo === "SOFT_SKILLS";
  const lotada = palestra.vagas !== null && palestra.contagem.confirmados >= palestra.vagas;

  const abas: Aba[] = [
    { id: "inscritos", label: "Inscritos", content: <InscritosTab key={palestra.id} palestraId={palestra.id} /> },
    { id: "presenca", label: "Presença", content: <PresencaTab key={palestra.id} palestra={palestra} /> },
    ...(softSkills
      ? [
          { id: "grupos", label: "Grupos DISC", content: <GruposTab key={palestra.id} palestra={palestra} /> },
        ]
      : []),
    { id: "certificados", label: "Certificados", content: <CertificadosTab key={palestra.id} palestra={palestra} /> },
  ];

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => navigate("/palestras")} className={styles.voltar}>
        <ArrowLeft size={16} aria-hidden="true" />
        Palestras
      </Button>

      <Card accent={situacao === "ENCERRADA" ? "neutral" : "yellow"}>
        <div className={styles.cabecalho}>
          <DateTile iso={palestra.inicio} size="lg" destaque={situacao === "HOJE"} apagado={situacao === "ENCERRADA"} />
          <div className={styles.info}>
            <div className={styles.badges}>
              <SituacaoBadge situacao={situacao} />
              <TipoBadge tipo={palestra.evento.tipo} />
              <Badge tone="neutral">{palestra.evento.cargaHoraria}h</Badge>
            </div>
            <h1 className={styles.titulo}>{palestra.evento.titulo}</h1>
            {palestra.evento.descricao && <p className={styles.descricao}>{palestra.evento.descricao}</p>}
            <ul className={styles.meta}>
              <li>
                <CalendarDays size={16} aria-hidden="true" />
                {formatarDiaSemana(palestra.inicio)}, {formatarData(palestra.inicio)}
              </li>
              <li>
                <Clock size={16} aria-hidden="true" />
                {formatarHorario(palestra.inicio, palestra.fim)}
              </li>
              {palestra.sala && (
                <li>
                  <MapPin size={16} aria-hidden="true" />
                  {palestra.sala}
                </li>
              )}
            </ul>
          </div>

          <div className={styles.lateral}>
            <dl className={styles.numeros}>
              <div>
                <dt>Inscritos</dt>
                <dd className={lotada ? styles.lotada : undefined}>
                  {palestra.contagem.confirmados}
                  <span>/ {palestra.vagas ?? "—"}</span>
                </dd>
              </div>
              <div>
                <dt>Na espera</dt>
                <dd>{palestra.contagem.espera}</dd>
              </div>
              <div>
                <dt>Presentes</dt>
                <dd>{palestra.contagem.presentes}</dd>
              </div>
            </dl>
            {!palestra.listaEncerrada && (
              <Button variant="success" size="sm" onClick={() => navigate(`/palestras/${palestra.id}/editar`)}>
                <Pencil size={14} aria-hidden="true" />
                Editar palestra
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className={styles.abas}>
        <Tabs tabs={abas} activeId={abaAtiva} onChange={setAbaAtiva} />
      </div>
    </>
  );
}
