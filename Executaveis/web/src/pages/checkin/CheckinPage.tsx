import { useList, type HttpError } from "@refinedev/core";
import { CircleAlert, CircleCheck, CircleX, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { DateTile } from "../../components/ui/DateTile";
import { SelectField } from "../../components/ui/form/Field";
import { PageHeader } from "../../components/ui/PageHeader";
import { useAcaoAdmin } from "../../hooks/useAcaoAdmin";
import { formatarHorario, situacaoDaPalestra } from "../../lib/datas";
import type { PalestraDetalhada, ResultadoCheckin } from "../../types/dominio";
import { QrScanner } from "./QrScanner";
import styles from "./CheckinPage.module.css";

/**
 * Tela 9.8 — check-in por QR Code, feita para o celular.
 * O staff/admin escolhe a palestra do dia e aponta a câmera para o QR do convite do aluno.
 */
const TEMPO_FAIXA_MS = 2000;
const IGNORAR_REPETIDO_MS = 3000;

type TomFaixa = "verde" | "amarelo" | "vermelho";
interface Faixa {
  tom: TomFaixa;
  titulo: string;
  detalhe?: string;
}

function faixaDoResultado(r: ResultadoCheckin): Faixa {
  switch (r.resultado) {
    case "gravada":
      return { tom: "verde", titulo: "Presença registrada", detalhe: r.aluno.nome };
    case "ja_registrado":
      return { tom: "amarelo", titulo: "Já registrado", detalhe: r.aluno.nome };
    case "nao_inscrito":
      return { tom: "vermelho", titulo: "Não inscrito nesta palestra", detalhe: r.aluno?.nome };
    case "lista_encerrada":
      return { tom: "vermelho", titulo: "Lista já encerrada" };
    default:
      return { tom: "vermelho", titulo: "QR inválido ou vencido", detalhe: "Peça para o aluno abrir o convite de novo." };
  }
}

const ICONE_FAIXA = { verde: CircleCheck, amarelo: CircleAlert, vermelho: CircleX };

export function CheckinPage() {
  const { result, query } = useList<PalestraDetalhada>({ resource: "palestras", pagination: { mode: "off" } });
  const palestrasDeHoje = useMemo(
    () =>
      result.data
        .filter((p) => situacaoDaPalestra(p.inicio, p.listaEncerrada) === "HOJE")
        .sort((a, b) => a.inicio.localeCompare(b.inicio)),
    [result.data],
  );

  const [escolhida, setEscolhida] = useState("");
  // Com uma só palestra no dia, ela já vem selecionada.
  const palestraId = escolhida || (palestrasDeHoje.length === 1 ? palestrasDeHoje[0].id : "");
  const palestra = palestrasDeHoje.find((p) => p.id === palestraId);

  const [cameraAtiva, setCameraAtiva] = useState(true);
  const [faixa, setFaixa] = useState<Faixa | null>(null);
  const ultimaLeitura = useRef<{ texto: string; em: number } | null>(null);
  const processando = useRef(false);
  const { executar } = useAcaoAdmin<ResultadoCheckin>();

  useEffect(() => {
    if (!faixa) return;
    const t = setTimeout(() => setFaixa(null), TEMPO_FAIXA_MS);
    return () => clearTimeout(t);
  }, [faixa]);

  const aoLer = useCallback(
    async (texto: string) => {
      if (!palestraId || processando.current) return;
      const agora = Date.now();
      const anterior = ultimaLeitura.current;
      // A câmera lê o mesmo QR várias vezes por segundo: ignora repetições seguidas.
      if (anterior && anterior.texto === texto && agora - anterior.em < IGNORAR_REPETIDO_MS) return;
      ultimaLeitura.current = { texto, em: agora };

      processando.current = true;
      try {
        const resposta = (await executar("post", `/admin/palestras/${palestraId}/checkin`, { token: texto })) as ResultadoCheckin;
        const nova = faixaDoResultado(resposta);
        setFaixa(nova);
        if (nova.tom === "verde") navigator.vibrate?.(80);
      } catch (falha) {
        setFaixa({ tom: "vermelho", titulo: "Erro ao registrar", detalhe: (falha as HttpError).message });
      } finally {
        processando.current = false;
      }
    },
    [palestraId, executar],
  );

  if (query.isError) {
    return (
      <Alert tone="danger" title="Não foi possível carregar as palestras">
        {query.error?.message}
      </Alert>
    );
  }

  const IconeFaixa = faixa ? ICONE_FAIXA[faixa.tom] : null;

  return (
    <div className={styles.pagina}>
      <PageHeader title="Check-in" description="Aponte a câmera para o QR Code do convite do aluno." />

      {!query.isLoading && palestrasDeHoje.length === 0 && (
        <Alert tone="info" title="Nenhuma palestra hoje">
          O check-in fica disponível no dia de cada palestra. <Link to="/palestras">Ver palestras</Link>
        </Alert>
      )}

      {palestrasDeHoje.length > 1 && (
        <SelectField label="Palestra" value={palestraId} onChange={(e) => setEscolhida(e.target.value)}>
          <option value="">Escolha a palestra</option>
          {palestrasDeHoje.map((p) => (
            <option key={p.id} value={p.id}>
              {formatarHorario(p.inicio, p.fim)} · {p.evento.titulo}
            </option>
          ))}
        </SelectField>
      )}

      {palestra && (
        <>
          <div className={styles.cabecalho}>
            <DateTile iso={palestra.inicio} size="sm" destaque />
            <div className={styles.cabecalhoTexto}>
              <p className={styles.titulo}>{palestra.evento.titulo}</p>
              <p className={styles.sub}>
                {formatarHorario(palestra.inicio, palestra.fim)}
                {palestra.sala ? ` · ${palestra.sala}` : ""}
              </p>
            </div>
            <div className={styles.contador} aria-live="polite">
              <strong>{palestra.contagem.presentes}</strong>
              <span>/ {palestra.contagem.confirmados} presentes</span>
            </div>
          </div>

          {palestra.listaEncerrada ? (
            <Alert tone="info">A lista desta palestra já foi encerrada.</Alert>
          ) : (
            <div className={styles.areaLeitura}>
              <QrScanner ativo={cameraAtiva} onLeitura={aoLer} />
              {faixa && IconeFaixa && (
                <div className={`${styles.faixa} ${styles[faixa.tom]}`} role="status" aria-live="assertive">
                  <IconeFaixa size={28} aria-hidden="true" />
                  <div>
                    <p className={styles.faixaTitulo}>{faixa.titulo}</p>
                    {faixa.detalhe && <p className={styles.faixaDetalhe}>{faixa.detalhe}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={styles.acoes}>
            {!palestra.listaEncerrada && (
              <Button variant="ghost" onClick={() => setCameraAtiva((a) => !a)}>
                {cameraAtiva ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                {cameraAtiva ? "Pausar câmera" : "Ativar câmera"}
              </Button>
            )}
            <Link to={`/palestras/${palestra.id}?aba=presenca`} className={styles.link}>
              QR não lê? Marcar presença manual
            </Link>
          </div>

        </>
      )}
    </div>
  );
}
