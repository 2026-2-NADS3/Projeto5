import type { TipoEvento } from "../../types/dominio";

/**
 * Estado e validação do formulário de palestra (tela 9.6).
 * Separado da tela para poder ser testado sem renderizar nada.
 */
export interface FormularioPalestra {
  modoEvento: "existente" | "novo";
  eventoId: string;
  novoTitulo: string;
  novaDescricao: string;
  novaCargaHoraria: string;
  novoTipo: TipoEvento;
  data: string; // AAAA-MM-DD
  horaInicio: string; // HH:MM
  horaFim: string; // HH:MM
  sala: string;
  vagas: string;
}

export type ErrosFormulario = Partial<Record<keyof FormularioPalestra, string>>;

export const formularioVazio: FormularioPalestra = {
  modoEvento: "existente",
  eventoId: "",
  novoTitulo: "",
  novaDescricao: "",
  novaCargaHoraria: "",
  novoTipo: "PADRAO",
  data: "",
  horaInicio: "",
  horaFim: "",
  sala: "",
  vagas: "",
};

interface Contexto {
  editando: boolean;
  confirmados: number; // inscritos ATIVA (só importa na edição)
  hoje: string; // AAAA-MM-DD, para não aceitar data passada ao criar
}

export function validarFormulario(f: FormularioPalestra, ctx: Contexto): ErrosFormulario {
  const erros: ErrosFormulario = {};

  if (f.modoEvento === "existente" && !f.eventoId) erros.eventoId = "Escolha o evento.";
  if (f.modoEvento === "novo") {
    if (!f.novoTitulo.trim()) erros.novoTitulo = "Informe o título.";
    const carga = Number(f.novaCargaHoraria);
    if (!f.novaCargaHoraria || !Number.isFinite(carga) || carga <= 0) {
      erros.novaCargaHoraria = "Informe a carga horária em horas (maior que zero).";
    }
  }

  if (!f.data) erros.data = "Informe a data.";
  else if (!ctx.editando && f.data < ctx.hoje) erros.data = "A data não pode estar no passado.";

  if (!f.horaInicio) erros.horaInicio = "Informe o horário de início.";
  if (!f.horaFim) erros.horaFim = "Informe o horário de término.";
  if (f.horaInicio && f.horaFim && f.horaFim <= f.horaInicio) {
    erros.horaFim = "O término precisa ser depois do início.";
  }

  const vagas = Number(f.vagas);
  if (!f.vagas || !Number.isInteger(vagas) || vagas < 1) erros.vagas = "Informe um número inteiro de vagas (mínimo 1).";
  else if (ctx.editando && vagas < ctx.confirmados) {
    erros.vagas = `Já há ${ctx.confirmados} inscritos confirmados; as vagas não podem ser menos que isso.`;
  }

  return erros;
}
