import { Authenticated, Refine } from "@refinedev/core";
import routerProvider, { CatchAllNavigate, NavigateToResource } from "@refinedev/react-router";
import { lazy, Suspense } from "react";
import { BrowserRouter, HashRouter, MemoryRouter, Outlet, Route, Routes } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import { resources } from "./config/resources";
import { AlunoShowPage } from "./pages/alunos/AlunoShowPage";
import { AlunosListPage } from "./pages/alunos/AlunosListPage";
import { ComunicacaoPage } from "./pages/comunicacao/ComunicacaoPage";
import { DuvidaPage } from "./pages/comunicacao/DuvidaPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { LoginPage } from "./pages/login/LoginPage";
import { PalestraFormPage } from "./pages/palestras/PalestraFormPage";
import { PalestrasListPage } from "./pages/palestras/PalestrasListPage";
import { PalestraShowPage } from "./pages/palestras/PalestraShowPage";
import { authProvider } from "./providers/authProvider";
import { dataProvider } from "./providers/dataProvider";

/**
 * Em produção (Vercel/Nginx) o painel usa rotas normais: /alunos, /palestras...
 * VITE_ROUTER=hash ou memory só existe para prévias hospedadas em páginas
 * que não aceitam rotas próprias (ex.: o link de demonstração).
 */
const modoRota = import.meta.env.VITE_ROUTER ?? "browser";
const Router = modoRota === "memory" ? MemoryRouter : modoRota === "hash" ? HashRouter : BrowserRouter;

/** O check-in carrega a biblioteca de leitura de QR só quando a tela é aberta. */
const CheckinPage = lazy(() => import("./pages/checkin/CheckinPage").then((m) => ({ default: m.CheckinPage })));

function AreaLogada() {
  return (
    <Authenticated key="area-logada" fallback={<CatchAllNavigate to="/login" />}>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </Authenticated>
  );
}

export default function App() {
  return (
    <Router>
      <Refine
        routerProvider={routerProvider}
        authProvider={authProvider}
        dataProvider={dataProvider}
        resources={resources}
        options={{ disableTelemetry: true, syncWithLocation: true }}
      >
        <Routes>
          <Route element={<AreaLogada />}>
            <Route index element={<DashboardPage />} />
            <Route
              path="checkin"
              element={
                <Suspense fallback={<p>Carregando check-in...</p>}>
                  <CheckinPage />
                </Suspense>
              }
            />
            <Route path="alunos">
              <Route index element={<AlunosListPage />} />
              <Route path=":id" element={<AlunoShowPage />} />
            </Route>
            <Route path="comunicacao">
              <Route index element={<ComunicacaoPage />} />
              <Route path="duvidas/:id" element={<DuvidaPage />} />
            </Route>
            <Route path="palestras">
              <Route index element={<PalestrasListPage />} />
              <Route path="nova" element={<PalestraFormPage />} />
              <Route path=":id" element={<PalestraShowPage />} />
              <Route path=":id/editar" element={<PalestraFormPage />} />
            </Route>
          </Route>

          <Route
            element={
              <Authenticated key="area-publica" fallback={<Outlet />}>
                <NavigateToResource resource="dashboard" />
              </Authenticated>
            }
          >
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route path="*" element={<NavigateToResource resource="dashboard" />} />
        </Routes>
      </Refine>
    </Router>
  );
}
