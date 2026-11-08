import { useGetIdentity, useLogout, useMenu } from "@refinedev/core";
import { LogOut } from "lucide-react";
import { Link } from "react-router";
import type { MetaRecurso } from "../../config/resources";
import { Logo } from "../ui/Logo";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  open: boolean;
  onNavigate: () => void;
}

interface Identidade {
  nome: string;
  papel: string;
}

/** Menu lateral roxo: logo, as 6 áreas do painel e, no rodapé, quem está logado. */
export function Sidebar({ open, onNavigate }: SidebarProps) {
  const { menuItems, selectedKey } = useMenu();
  const { data: usuario } = useGetIdentity<Identidade>();
  const { mutate: sair } = useLogout();

  return (
    <aside className={`${styles.sidebar} ${open ? styles.open : ""}`} aria-label="Menu principal">
      <div className={styles.brand}>
        <span className={styles.sticker}>
          <Logo />
        </span>
        <span className={styles.brandCaption}>Painel da equipe</span>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.list}>
          {menuItems.map((item) => {
            const meta = item.meta as MetaRecurso | undefined;
            const Icone = meta?.Icone;
            const ativo = item.key === selectedKey;

            return (
              <li key={item.key}>
                <Link
                  to={item.route ?? "/"}
                  className={`${styles.link} ${ativo ? styles.active : ""}`}
                  aria-current={ativo ? "page" : undefined}
                  onClick={onNavigate}
                >
                  {Icone && <Icone size={20} aria-hidden="true" />}
                  <span>{meta?.label ?? item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {usuario && (
        <div className={styles.usuario}>
          <span className={styles.avatar} aria-hidden="true">
            {usuario.nome.charAt(0)}
          </span>
          <span className={styles.usuarioTexto}>
            <span className={styles.usuarioNome}>{usuario.nome}</span>
            <span className={styles.usuarioPapel}>{usuario.papel === "ADMIN" ? "Administrador" : "Equipe"}</span>
          </span>
          <button type="button" className={styles.sair} onClick={() => sair()} aria-label="Sair do painel" title="Sair">
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </aside>
  );
}
