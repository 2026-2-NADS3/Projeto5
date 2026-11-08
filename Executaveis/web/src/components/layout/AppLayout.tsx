import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import styles from "./AppLayout.module.css";

/**
 * Estrutura das páginas logadas: menu lateral + barra superior + conteúdo.
 * No celular o menu vira uma gaveta aberta pelo botão hambúrguer (como no app).
 */
export function AppLayout({ children }: { children: ReactNode }) {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className={styles.shell}>
      <Sidebar open={menuAberto} onNavigate={() => setMenuAberto(false)} />
      {menuAberto && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Fechar menu"
          onClick={() => setMenuAberto(false)}
        />
      )}
      <div className={styles.main}>
        <Topbar onToggleMenu={() => setMenuAberto((aberto) => !aberto)} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
