import styles from "./DateTile.module.css";

/**
 * "Bilhete" de data no formato do calendário do app (mês em cima, dia grande),
 * com as argolas de folhinha. A palestra de hoje ganha a faixa amarela.
 */
const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

interface DateTileProps {
  iso: string;
  size?: "sm" | "md" | "lg";
  destaque?: boolean; // palestra de hoje
  apagado?: boolean; // palestra encerrada
}

export function DateTile({ iso, size = "md", destaque = false, apagado = false }: DateTileProps) {
  const data = new Date(iso);
  const mes = meses[data.getMonth()];
  const dia = data.getDate();

  return (
    <span
      className={`${styles.tile} ${styles[size]} ${destaque ? styles.destaque : ""} ${apagado ? styles.apagado : ""}`}
      aria-label={`${dia} de ${mes}`}
      role="img"
    >
      <span className={styles.argolas} aria-hidden="true">
        <span />
        <span />
      </span>
      <span className={styles.mes} aria-hidden="true">
        {mes}
      </span>
      <span className={styles.dia} aria-hidden="true">
        {dia}
      </span>
    </span>
  );
}
