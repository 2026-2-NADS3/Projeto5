import styles from "./BarChart.module.css";

/**
 * Gráfico de barras horizontais simples (uma série, uma cor), sem biblioteca.
 * Cada barra tem rótulo e valor em texto ao lado, então a cor nunca é a única
 * forma de ler o dado; o leitor de tela recebe uma lista com "rótulo: valor".
 */
export interface Barra {
  rotulo: string;
  valor: number;
  /** Texto do tooltip e do leitor de tela; padrão "rótulo: valor". */
  descricao?: string;
}

interface BarChartProps {
  titulo: string;
  barras: Barra[];
  vazio?: string;
}

export function BarChart({ titulo, barras, vazio = "Sem dados para mostrar." }: BarChartProps) {
  const maximo = Math.max(1, ...barras.map((b) => b.valor));
  const total = barras.reduce((soma, b) => soma + b.valor, 0);

  return (
    <figure className={styles.grafico}>
      <figcaption className={styles.titulo}>{titulo}</figcaption>
      {total === 0 ? (
        <p className={styles.vazio}>{vazio}</p>
      ) : (
        <ul className={styles.lista}>
          {barras.map((b) => {
            const descricao = b.descricao ?? `${b.rotulo}: ${b.valor}`;
            return (
              <li key={b.rotulo} className={styles.linha} title={descricao} aria-label={descricao}>
                <span className={styles.rotulo} aria-hidden="true">
                  {b.rotulo}
                </span>
                <span className={styles.trilho} aria-hidden="true">
                  <span className={styles.barra} style={{ width: `${(b.valor / maximo) * 100}%` }} />
                </span>
                <span className={styles.valor} aria-hidden="true">
                  {b.valor}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </figure>
  );
}
