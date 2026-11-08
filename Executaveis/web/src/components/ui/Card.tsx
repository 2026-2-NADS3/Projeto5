import type { HTMLAttributes } from "react";
import styles from "./Card.module.css";

/**
 * Card branco com cantos arredondados e sombra, como os cards do app.
 * `accent` desenha a barra colorida lateral usada no app para destacar
 * (amarela) ou deixar neutro (cinza).
 */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: "yellow" | "neutral" | "purple";
}

export function Card({ accent, className, children, ...props }: CardProps) {
  const classes = [styles.card, accent ? styles.withAccent : "", className ?? ""].join(" ");

  return (
    <div className={classes} {...props}>
      <div className={styles.content}>{children}</div>
      {accent && <span className={`${styles.accent} ${styles[accent]}`} aria-hidden="true" />}
    </div>
  );
}
