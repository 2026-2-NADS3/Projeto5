import styles from "./ProgressBar.module.css";

/** Barra de progresso (ex.: presentes / confirmados, vagas ocupadas). */
interface ProgressBarProps {
  valor: number;
  total: number;
  rotulo: string; // descrição para leitores de tela
  tom?: "verde" | "amarelo" | "roxo";
  sobreFundoEscuro?: boolean;
}

export function ProgressBar({ valor, total, rotulo, tom = "verde", sobreFundoEscuro = false }: ProgressBarProps) {
  const porcentagem = total > 0 ? Math.min(100, Math.round((valor / total) * 100)) : 0;
  return (
    <div
      className={`${styles.trilho} ${sobreFundoEscuro ? styles.escuro : ""}`}
      role="progressbar"
      aria-label={rotulo}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={valor}
    >
      <div className={`${styles.barra} ${styles[tom]}`} style={{ width: `${porcentagem}%` }} />
    </div>
  );
}
