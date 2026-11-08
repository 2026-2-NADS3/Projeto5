import { useId, type InputHTMLAttributes } from "react";
import styles from "./TextField.module.css";

/**
 * Campo em pílula roxa, como os campos de login do app.
 * O rótulo fica visível acima do campo (acessibilidade: não depender só do placeholder).
 */
interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function TextField({ label, id, ...props }: TextFieldProps) {
  const idGerado = useId();
  const inputId = id ?? idGerado;

  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <input id={inputId} className={styles.input} {...props} />
    </div>
  );
}
