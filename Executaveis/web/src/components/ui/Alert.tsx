import type { ReactNode } from "react";
import styles from "./Alert.module.css";

/** Caixa de aviso (erro, sucesso ou informação), no estilo do "Lembrete" do app. */
interface AlertProps {
  tone?: "info" | "success" | "danger";
  title?: string;
  children: ReactNode;
}

export function Alert({ tone = "info", title, children }: AlertProps) {
  return (
    <div className={`${styles.alert} ${styles[tone]}`} role={tone === "danger" ? "alert" : "status"}>
      {title && <p className={styles.title}>{title}</p>}
      <div className={styles.body}>{children}</div>
    </div>
  );
}
