import { Alert } from "../ui/Alert";
import styles from "./ConfiguracaoInvalida.module.css";

/** Aparece no lugar do painel quando o .env não tem a ligação certa com o Supabase. */
export function ConfiguracaoInvalida({ problemas }: { problemas: string[] }) {
  return (
    <main className={styles.pagina}>
      <Alert tone="danger" title="O painel não está ligado ao banco de dados">
        <p>Corrija o arquivo <code>admin-web/.env</code> e reinicie o <code>npm run dev</code>:</p>
        <ul>
          {problemas.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p>Os valores ficam no Supabase, em Project Settings → API.</p>
      </Alert>
    </main>
  );
}
