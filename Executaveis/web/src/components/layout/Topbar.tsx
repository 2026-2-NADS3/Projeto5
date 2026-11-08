import { Menu, QrCode } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../ui/Button";
import styles from "./Topbar.module.css";

const formatoHoje = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });

/** Barra superior: menu (celular), data de hoje e atalho para o check-in. */
export function Topbar({ onToggleMenu }: { onToggleMenu: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [hoje] = useState(() => formatoHoje.format(new Date()));

  return (
    <header className={styles.topbar}>
      <button type="button" className={styles.menuButton} onClick={onToggleMenu} aria-label="Abrir menu">
        <Menu size={24} aria-hidden="true" />
      </button>

      <p className={styles.hoje}>
        <span className={styles.ponto} aria-hidden="true" />
        Hoje é {hoje}
      </p>

      {pathname !== "/checkin" && pathname !== "/" && (
        <Button size="sm" onClick={() => navigate("/checkin")} className={styles.atalho}>
          <QrCode size={16} aria-hidden="true" />
          Abrir check-in
        </Button>
      )}
    </header>
  );
}
