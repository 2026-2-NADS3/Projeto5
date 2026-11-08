import type { ReactNode } from "react";
import styles from "./Badge.module.css";

/** Etiqueta de status em pílula (visual inspirado nos selos do app). */
type Tom = "success" | "danger" | "neutral" | "purple";

interface BadgeProps {
  tone?: Tom;
  icon?: ReactNode;
  children: ReactNode;
}

export function Badge({ tone = "neutral", icon, children }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      {icon}
      {children}
    </span>
  );
}
