import logoUrl from "../../assets/logo.png";
import styles from "./Logo.module.css";

/** Logo oficial da Próxima Etapa. */
export function Logo({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <span className={`${styles.logo} ${styles[size]}`}>
      <img src={logoUrl} alt="Próxima Etapa" className={styles.image} />
    </span>
  );
}
