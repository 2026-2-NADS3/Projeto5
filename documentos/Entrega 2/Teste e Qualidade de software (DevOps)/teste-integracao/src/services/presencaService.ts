/**
 * Serviço de presença — RFM06 / regra de negócio do briefing:
 * "uma presença deve estar relacionada ao aluno, curso/atividade, data e horário,
 * evitando duplicidades para o mesmo encontro".
 */

export interface Presenca {
  alunoId: number;
  atividadeId: number;
  encontro: Date; // data e horário do encontro
}

/** Contrato do repositório (implementado com Prisma no back; aqui é injetado para permitir mock). */
export interface PresencaRepository {
  buscar(alunoId: number, atividadeId: number, encontro: Date): Promise<Presenca | null>;
  salvar(presenca: Presenca): Promise<Presenca>;
}

export class PresencaJaRegistradaError extends Error {
  constructor() {
    super('presença já registrada');
    this.name = 'PresencaJaRegistradaError';
  }
}

export class PresencaService {
  constructor(private readonly repo: PresencaRepository) {}

  /** Registra a presença; lança erro se já existir uma para o mesmo aluno + atividade + encontro. */
  async registrar(presenca: Presenca): Promise<Presenca> {
    const existente = await this.repo.buscar(presenca.alunoId, presenca.atividadeId, presenca.encontro);
    if (existente) {
      throw new PresencaJaRegistradaError();
    }
    return this.repo.salvar(presenca);
  }
}
