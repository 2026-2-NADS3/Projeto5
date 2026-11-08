import { useId, type KeyboardEvent, type ReactNode } from "react";
import styles from "./Tabs.module.css";

/**
 * Abas acessíveis (setas do teclado trocam de aba).
 * Usadas no detalhe da palestra: Inscritos, Presença, Grupos DISC, Certificados.
 */
export interface Aba {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Aba[];
  activeId: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeId, onChange }: TabsProps) {
  const base = useId();
  const ativa = tabs.find((aba) => aba.id === activeId) ?? tabs[0];

  const navegarComTeclado = (evento: KeyboardEvent<HTMLDivElement>) => {
    if (evento.key !== "ArrowRight" && evento.key !== "ArrowLeft") return;
    const indice = tabs.findIndex((aba) => aba.id === ativa.id);
    const passo = evento.key === "ArrowRight" ? 1 : -1;
    const proxima = tabs[(indice + passo + tabs.length) % tabs.length];
    onChange(proxima.id);
    document.getElementById(`${base}-tab-${proxima.id}`)?.focus();
  };

  return (
    <div>
      <div role="tablist" className={styles.list} onKeyDown={navegarComTeclado}>
        {tabs.map((aba) => {
          const selecionada = aba.id === ativa.id;
          return (
            <button
              key={aba.id}
              id={`${base}-tab-${aba.id}`}
              type="button"
              role="tab"
              aria-selected={selecionada}
              aria-controls={`${base}-panel-${aba.id}`}
              tabIndex={selecionada ? 0 : -1}
              className={`${styles.tab} ${selecionada ? styles.selected : ""}`}
              onClick={() => onChange(aba.id)}
            >
              {aba.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${base}-panel-${ativa.id}`}
        aria-labelledby={`${base}-tab-${ativa.id}`}
        className={styles.panel}
      >
        {ativa.content}
      </div>
    </div>
  );
}
