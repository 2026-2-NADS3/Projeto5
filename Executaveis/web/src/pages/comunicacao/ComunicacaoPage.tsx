import { useList } from "@refinedev/core";
import { useSearchParams } from "react-router";
import { PageHeader } from "../../components/ui/PageHeader";
import { Tabs, type Aba } from "../../components/ui/Tabs";
import type { DuvidaResumo } from "../../types/dominio";
import { DuvidasTab } from "./DuvidasTab";
import { MensagensTab } from "./MensagensTab";

/** Tela 9.10 — Comunicação: mensagens segmentadas e caixa de dúvidas. A aba fica no endereço (?aba=). */
export function ComunicacaoPage() {
  const [busca, setBusca] = useSearchParams();
  const abaAtiva = busca.get("aba") ?? "mensagens";

  const { result, query } = useList<DuvidaResumo>({ resource: "duvidas", pagination: { mode: "off" } });
  const contar = (status: DuvidaResumo["status"]) => result.data.filter((d) => d.status === status).length;
  const caixa = (status: DuvidaResumo["status"]) => (
    <DuvidasTab status={status} duvidas={result.data} carregando={query.isLoading} erro={query.error?.message} />
  );

  const abas: Aba[] = [
    { id: "mensagens", label: "Mensagens", content: <MensagensTab /> },
    { id: "abertas", label: `Dúvidas abertas (${contar("ABERTA")})`, content: caixa("ABERTA") },
    { id: "respondidas", label: "Respondidas", content: caixa("RESPONDIDA") },
    { id: "fechadas", label: "Fechadas", content: caixa("FECHADA") },
  ];

  return (
    <>
      <PageHeader title="Comunicação" description="Mensagens para os alunos no app e respostas às dúvidas que eles enviam." />
      <Tabs tabs={abas} activeId={abaAtiva} onChange={(id) => setBusca({ aba: id }, { replace: true })} />
    </>
  );
}
