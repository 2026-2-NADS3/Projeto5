import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./Button";
import styles from "./ConfirmDialog.module.css";

/**
 * Janela de confirmação para ações que não dá para desfazer
 * (ex.: encerrar a lista de presença). Usa o <dialog> nativo do navegador,
 * que já cuida do foco e da tecla Esc.
 */
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  tone?: "primary" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  tone = "primary",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (open && !dialogo.open) dialogo.showModal();
    if (!open && dialogo.open) dialogo.close();
  }, [open]);

  return (
    <dialog ref={ref} className={styles.dialog} onCancel={onCancel} aria-labelledby="confirm-title">
      <h2 id="confirm-title" className={styles.title}>
        {title}
      </h2>
      <div className={styles.body}>{children}</div>
      <div className={styles.actions}>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Voltar
        </Button>
        <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>
          {busy ? "Aguarde..." : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
