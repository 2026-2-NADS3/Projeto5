import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import styles from "./Field.module.css";

/**
 * Campos claros para formulários do painel (o campo roxo em pílula fica só no login).
 * Todos têm rótulo visível, dica opcional e mensagem de erro ligada ao campo
 * por aria-describedby, para leitores de tela.
 */
interface BaseProps {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
}

function FieldShell({
  id,
  label,
  hint,
  error,
  optional,
  children,
}: BaseProps & { id: string; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {optional && <span className={styles.optional}> (opcional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  if (error) return `${id}-error`;
  return hint ? `${id}-hint` : undefined;
}

export function InputField({ label, hint, error, optional, id, ...props }: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  const gerado = useId();
  const campoId = id ?? gerado;
  return (
    <FieldShell id={campoId} label={label} hint={hint} error={error} optional={optional}>
      <input
        id={campoId}
        className={styles.control}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(campoId, hint, error)}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  hint,
  error,
  optional,
  id,
  children,
  ...props
}: BaseProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const gerado = useId();
  const campoId = id ?? gerado;
  return (
    <FieldShell id={campoId} label={label} hint={hint} error={error} optional={optional}>
      <select
        id={campoId}
        className={styles.control}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(campoId, hint, error)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function TextareaField({
  label,
  hint,
  error,
  optional,
  id,
  ...props
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const gerado = useId();
  const campoId = id ?? gerado;
  return (
    <FieldShell id={campoId} label={label} hint={hint} error={error} optional={optional}>
      <textarea
        id={campoId}
        className={`${styles.control} ${styles.textarea}`}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(campoId, hint, error)}
        {...props}
      />
    </FieldShell>
  );
}
