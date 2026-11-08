import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import App from "./App.tsx";
import { ConfiguracaoInvalida } from "./components/layout/ConfiguracaoInvalida";
import { problemasDeConfiguracao } from "./lib/supabase";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {problemasDeConfiguracao.length > 0 ? <ConfiguracaoInvalida problemas={problemasDeConfiguracao} /> : <App />}
  </StrictMode>,
);
