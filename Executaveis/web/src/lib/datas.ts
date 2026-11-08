/**
 * Funções de data do painel. Tudo é exibido no fuso de quem usa o painel
 * (a equipe da ONG, em São Paulo) e no formato brasileiro.
 */

const formatoData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const formatoDiaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const formatoHora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const formatoDataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatarData = (iso: string) => formatoData.format(new Date(iso));
export const formatarHora = (iso: string) => formatoHora.format(new Date(iso));
export const formatarDataHora = (iso: string) => formatoDataHora.format(new Date(iso));
export const formatarDiaSemana = (iso: string) => formatoDiaSemana.format(new Date(iso)).replace(".", "");
export const formatarHorario = (inicioIso: string, fimIso: string) =>
  `${formatarHora(inicioIso)} – ${formatarHora(fimIso)}`;

function mesmoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export type Situacao = "HOJE" | "FUTURA" | "ENCERRADA";

/** Situação da palestra na lista (tela 9.5). */
export function situacaoDaPalestra(inicioIso: string, listaEncerrada: boolean, agora = new Date()): Situacao {
  const inicio = new Date(inicioIso);
  if (listaEncerrada) return "ENCERRADA";
  if (mesmoDia(inicio, agora)) return "HOJE";
  return inicio > agora ? "FUTURA" : "ENCERRADA";
}

/* Meses no formato AAAA-MM (filtro do Dashboard). */

const formatoMesCurto = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" });
const formatoMesLongo = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const deMes = (mes: string) => {
  const [ano, m] = mes.split("-").map(Number);
  return new Date(ano, m - 1, 1);
};

export const mesAtual = (agora = new Date()) => `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
/** "out/26" */
export const formatarMesCurto = (mes: string) => formatoMesCurto.format(deMes(mes)).replace(". de ", "/").replace(" de ", "/");
/** "outubro de 2026" */
export const formatarMesLongo = (mes: string) => formatoMesLongo.format(deMes(mes));

/* Conversão entre os campos do formulário (data + hora locais) e ISO. */

const doisDigitos = (n: number) => String(n).padStart(2, "0");

export function isoParaCampos(iso: string): { data: string; hora: string } {
  const d = new Date(iso);
  return {
    data: `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`,
    hora: `${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`,
  };
}

export function camposParaIso(data: string, hora: string): string {
  const [ano, mes, dia] = data.split("-").map(Number);
  const [h, m] = hora.split(":").map(Number);
  return new Date(ano, mes - 1, dia, h, m).toISOString();
}
