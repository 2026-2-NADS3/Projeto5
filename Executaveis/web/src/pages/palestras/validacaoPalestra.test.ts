import { describe, expect, it } from "vitest";
import { formularioVazio, validarFormulario, type FormularioPalestra } from "./validacaoPalestra";

const valido: FormularioPalestra = {
  ...formularioVazio,
  eventoId: "evt-1",
  data: "2026-12-05",
  horaInicio: "10:00",
  horaFim: "12:00",
  vagas: "20",
};

const criando = { editando: false, confirmados: 0, hoje: "2026-10-29" };

describe("validarFormulario (tela 9.6)", () => {
  it("aceita um formulário completo", () => {
    expect(validarFormulario(valido, criando)).toEqual({});
  });

  it("exige término depois do início", () => {
    const erros = validarFormulario({ ...valido, horaFim: "09:00" }, criando);
    expect(erros.horaFim).toBeDefined();
  });

  it("não aceita data no passado ao criar, mas aceita ao editar", () => {
    const passado = { ...valido, data: "2026-10-01" };
    expect(validarFormulario(passado, criando).data).toBeDefined();
    expect(validarFormulario(passado, { ...criando, editando: true }).data).toBeUndefined();
  });

  it("na edição, não deixa as vagas ficarem abaixo dos confirmados", () => {
    const erros = validarFormulario({ ...valido, vagas: "5" }, { ...criando, editando: true, confirmados: 8 });
    expect(erros.vagas).toContain("8 inscritos");
  });

  it("exige título e carga horária quando o evento é novo", () => {
    const erros = validarFormulario({ ...valido, modoEvento: "novo", eventoId: "" }, criando);
    expect(erros.novoTitulo).toBeDefined();
    expect(erros.novaCargaHoraria).toBeDefined();
    expect(erros.eventoId).toBeUndefined();
  });

  it("recusa vagas zero ou fracionadas", () => {
    expect(validarFormulario({ ...valido, vagas: "0" }, criando).vagas).toBeDefined();
    expect(validarFormulario({ ...valido, vagas: "2.5" }, criando).vagas).toBeDefined();
  });
});
