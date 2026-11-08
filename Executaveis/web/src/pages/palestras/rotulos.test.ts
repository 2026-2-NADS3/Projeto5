import { describe, expect, it } from "vitest";
import { statusDoConvite } from "./rotulos";

describe("statusDoConvite (lista de espera, tela 9.7)", () => {
  const agora = new Date("2026-10-29T15:00:00Z");

  it("quem só está na fila aguarda vaga", () => {
    expect(statusDoConvite("ESPERA", null, agora)).toBe("AGUARDANDO");
  });

  it("convite dentro do prazo está pendente", () => {
    expect(statusDoConvite("CONVIDADA", "2026-10-30T10:00:00Z", agora)).toBe("PENDENTE");
  });

  it("convite com prazo vencido aparece como expirado", () => {
    expect(statusDoConvite("CONVIDADA", "2026-10-29T12:00:00Z", agora)).toBe("EXPIRADO");
  });
});
