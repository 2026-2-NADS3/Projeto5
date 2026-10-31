import { PresencaService, PresencaRepository, PresencaJaRegistradaError } from '../src/services/presencaService';

// Teste 1 — Serviço de presença com repositório simulado (mock)
describe('Teste 1 — PresencaService.registrar', () => {
  const presenca = { alunoId: 1, atividadeId: 10, encontro: new Date('2026-10-15T19:00:00-03:00') };

  it('impede presença duplicada no mesmo encontro e não chama salvar()', async () => {
    const repo: jest.Mocked<PresencaRepository> = {
      buscar: jest.fn().mockResolvedValue(presenca), // já existe registro
      salvar: jest.fn(),
    };
    const service = new PresencaService(repo);

    await expect(service.registrar(presenca)).rejects.toThrow(PresencaJaRegistradaError);
    await expect(service.registrar(presenca)).rejects.toThrow('presença já registrada');
    expect(repo.salvar).not.toHaveBeenCalled();
  });

  it('registra normalmente quando ainda não há presença para o encontro', async () => {
    const repo: jest.Mocked<PresencaRepository> = {
      buscar: jest.fn().mockResolvedValue(null),
      salvar: jest.fn().mockResolvedValue(presenca),
    };
    const service = new PresencaService(repo);

    await expect(service.registrar(presenca)).resolves.toEqual(presenca);
    expect(repo.salvar).toHaveBeenCalledTimes(1);
  });
});
