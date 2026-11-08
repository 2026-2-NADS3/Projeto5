import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";
import styles from "./QrScanner.module.css";

/**
 * Leitor de QR Code pela câmera traseira do celular.
 * A câmera só funciona em HTTPS (ou em localhost, durante o desenvolvimento).
 */
interface QrScannerProps {
  ativo: boolean;
  onLeitura: (texto: string) => void;
}

function mensagemDeErro(falha: unknown): string {
  if (!window.isSecureContext) return "A câmera só funciona com o painel aberto em HTTPS.";
  const nome = falha instanceof Error ? falha.name : "";
  if (nome === "NotAllowedError") return "A permissão da câmera foi negada. Libere a câmera nas configurações do navegador.";
  if (nome === "NotFoundError" || nome === "OverconstrainedError") return "Nenhuma câmera foi encontrada neste aparelho.";
  if (nome === "NotReadableError") return "A câmera está sendo usada por outro aplicativo.";
  return "Não foi possível abrir a câmera.";
}

export function QrScanner({ ativo, onLeitura }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onLeituraRef = useRef(onLeitura);
  const [erro, setErro] = useState<string | null>(null);

  // Guarda sempre a versão mais recente do callback sem reiniciar a câmera.
  useEffect(() => {
    onLeituraRef.current = onLeitura;
  }, [onLeitura]);

  /**
   * Fila de liga/desliga da câmera. `controles.stop()` do ZXing também limpa o <video>; se um leitor
   * antigo terminar de desligar DEPOIS que o novo ligou, o novo fica sem imagem e para de ler.
   * Acontecia ao abrir a tela em modo dev (o React liga, desliga e religa) e ao pausar/reativar rápido.
   * Com a fila, cada leitor só liga depois que o anterior desligou por completo.
   */
  const filaDaCamera = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const video = videoRef.current;
    if (!ativo || !video) return;

    let controles: IScannerControls | null = null;
    let cancelado = false;
    const leitor = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 250 });

    filaDaCamera.current = filaDaCamera.current.then(async () => {
      if (cancelado) return;
      try {
        const c = await leitor.decodeFromConstraints({ video: { facingMode: "environment" } }, video, (resultado) => {
          if (resultado) onLeituraRef.current(resultado.getText());
        });
        if (cancelado) c.stop();
        else {
          controles = c;
          setErro(null);
        }
      } catch (falha) {
        if (!cancelado) setErro(mensagemDeErro(falha));
      }
    });

    return () => {
      cancelado = true;
      controles?.stop();
    };
  }, [ativo]);

  return (
    <div className={styles.moldura}>
      <video ref={videoRef} className={styles.video} muted playsInline aria-label="Imagem da câmera para leitura do QR Code" />
      {ativo && !erro && <div className={styles.mira} aria-hidden="true" />}
      {!ativo && <p className={styles.mensagem}>Câmera pausada</p>}
      {erro && (
        <p className={styles.mensagem} role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}
