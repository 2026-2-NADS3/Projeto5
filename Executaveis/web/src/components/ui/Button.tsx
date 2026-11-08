import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

/**
 * Botão em pílula, no estilo dos botões do app.
 * - primary: roxo cheio (ação principal da tela)
 * - success / danger: pílulas claras com borda, como "Inscreva-se" e "Cancelar"
 * - ghost: ação secundária sem fundo
 */
type Variante = "primary" | "success" | "danger" | "ghost";
type Tamanho = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variante;
  size?: Tamanho;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : "",
    className ?? "",
  ].join(" ");

  return <button type={type} className={classes} {...props} />;
}
