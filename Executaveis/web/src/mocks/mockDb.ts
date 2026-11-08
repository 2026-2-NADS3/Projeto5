import { encerrarLista, gerarGrupos, liberarCertificados, registrarPresencaInicial, type Banco } from "./servicos";
import {
  alunosIniciais,
  certificadosParaLiberarAoIniciar,
  duvidasIniciais,
  eventosIniciais,
  gruposParaGerarAoIniciar,
  inscricoesIniciais,
  listasParaEncerrarAoIniciar,
  mensagensIniciais,
  palestrasIniciais,
  presencasIniciais,
} from "./seed";

/**
 * "Banco" em memória do mock. O que é feito no painel fica salvo no navegador
 * para sobreviver a um recarregamento. Mudar VERSAO descarta o que foi salvo e
 * volta aos dados fictícios.
 */
const VERSAO = 7;
const CHAVE = `proxima-etapa:mock-db:v${VERSAO}`;

function bancoInicial(): Banco {
  const banco: Banco = {
    eventos: structuredClone(eventosIniciais),
    palestras: structuredClone(palestrasIniciais),
    inscricoes: structuredClone(inscricoesIniciais),
    cadastros: structuredClone(alunosIniciais),
    alunos: {},
    presencas: [],
    faltas: [],
    bloqueios: [],
    certificados: [],
    mensagens: structuredClone(mensagensIniciais),
    duvidas: structuredClone(duvidasIniciais),
    grupos: [],
  };

  for (const aluno of banco.cadastros) {
    banco.alunos[aluno.id] = { pontosFalta: 0, bloqueadoAte: null };
  }
  // Grupos gerados "na véspera", antes de as listas serem encerradas (ordem fixa, para o seed ser previsível).
  for (const palestraId of gruposParaGerarAoIniciar) gerarGrupos(banco, palestraId, (lista) => lista);
  for (const p of presencasIniciais) registrarPresencaInicial(banco, p.palestraId, p.alunoId, p.origem);

  // Encerra as palestras passadas com as regras reais, como se o admin tivesse
  // clicado em "Encerrar lista" ao fim de cada uma.
  for (const palestraId of listasParaEncerrarAoIniciar) {
    const palestra = banco.palestras.find((p) => p.id === palestraId)!;
    encerrarLista(banco, palestraId, new Date(palestra.fim));
  }
  for (const palestraId of certificadosParaLiberarAoIniciar) {
    const palestra = banco.palestras.find((p) => p.id === palestraId)!;
    liberarCertificados(banco, palestraId, new Date(palestra.fim));
  }
  return banco;
}

function carregar(): Banco {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo) return JSON.parse(salvo) as Banco;
  } catch {
    // Armazenamento indisponível: segue só em memória.
  }
  return bancoInicial();
}

export const db: Banco = carregar();

export function persistir(): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(db));
  } catch {
    // Sem armazenamento: as mudanças valem até recarregar a página.
  }
}

/** Volta aos dados fictícios originais (botão do modo de teste). */
export function restaurarDadosDeTeste(): void {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // Nada a limpar.
  }
  Object.assign(db, bancoInicial());
}
