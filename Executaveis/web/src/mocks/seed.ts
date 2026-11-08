import type {
  AlunoResumo,
  Duvida,
  Evento,
  Inscricao,
  LetraDisc,
  LetraRiasec,
  Mensagem,
  OrigemPresenca,
  Palestra,
  PerfilAluno,
} from "../types/dominio";

/**
 * Dados FICTÍCIOS para desenvolver sem API.
 * Nenhum nome ou e-mail é de pessoa real (exigência de LGPD do briefing, seção 5.2).
 * Datas são geradas em relação a hoje, para sempre existirem palestras
 * futuras, de hoje e encerradas.
 */

function horasAPartirDeAgora(horas: number): string {
  return new Date(Date.now() + horas * 60 * 60 * 1000).toISOString();
}

function diaRelativo(dias: number, hora: number, minuto = 0): string {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  data.setHours(hora, minuto, 0, 0);
  return data.toISOString();
}

export const eventosIniciais: Evento[] = [
  {
    id: "evt-curriculo",
    titulo: "Currículo que chama atenção",
    descricao: "Como montar um currículo claro e objetivo para a primeira vaga.",
    cargaHoraria: 2,
    tipo: "PADRAO",
  },
  {
    id: "evt-comunicacao",
    titulo: "Comunicação e trabalho em equipe",
    descricao: "Dinâmica em grupos DISC sobre comunicação e colaboração.",
    cargaHoraria: 3,
    tipo: "SOFT_SKILLS",
  },
  {
    id: "evt-enem",
    titulo: "Estratégias para o ENEM",
    descricao: "Organização de estudos, simulados e escolha de curso.",
    cargaHoraria: 2,
    tipo: "PADRAO",
  },
  {
    id: "evt-entrevista",
    titulo: "Preparação para entrevistas",
    descricao: "Simulação de entrevista e postura em processos seletivos.",
    cargaHoraria: 2,
    tipo: "SOFT_SKILLS",
  },
];

export const palestrasIniciais: Palestra[] = [
  { id: "pal-1", eventoId: "evt-comunicacao", inicio: diaRelativo(0, 14), fim: diaRelativo(0, 17), sala: "Auditório", vagas: 8, listaEncerrada: false },
  { id: "pal-2", eventoId: "evt-curriculo", inicio: diaRelativo(5, 10), fim: diaRelativo(5, 12), sala: "Sala 204", vagas: 30, listaEncerrada: false },
  { id: "pal-3", eventoId: "evt-enem", inicio: diaRelativo(12, 19), fim: diaRelativo(12, 21), sala: null, vagas: 40, listaEncerrada: false },
  // pal-4 e pal-5 já aconteceram: o mockDb encerra a lista delas ao iniciar,
  // aplicando as regras de falta/bloqueio de verdade (src/regras/presenca.ts).
  { id: "pal-4", eventoId: "evt-entrevista", inicio: diaRelativo(-7, 14), fim: diaRelativo(-7, 16), sala: "Sala 110", vagas: 20, listaEncerrada: false },
  { id: "pal-5", eventoId: "evt-curriculo", inicio: diaRelativo(-21, 10), fim: diaRelativo(-21, 12), sala: "Sala 204", vagas: 25, listaEncerrada: false },
  // pal-6 e pal-7: meses anteriores, para o gráfico de palestras por mês e o ranking geral.
  { id: "pal-6", eventoId: "evt-enem", inicio: diaRelativo(-45, 19), fim: diaRelativo(-45, 21), sala: "Auditório", vagas: 40, listaEncerrada: false },
  { id: "pal-7", eventoId: "evt-comunicacao", inicio: diaRelativo(-80, 14), fim: diaRelativo(-80, 17), sala: "Auditório", vagas: 12, listaEncerrada: false },
];

const NOMES = [
  "Ana Beatriz Lima", "Bruno Henrique Souza", "Camila Ferreira", "Diego Martins", "Eduarda Rocha",
  "Felipe Gomes", "Gabriela Nunes", "Heitor Ramos", "Isabela Cardoso", "João Pedro Alves",
  "Larissa Moreira", "Mateus Ribeiro", "Nathalia Costa", "Otávio Pereira", "Paula Teixeira",
  "Rafael Barbosa", "Sabrina Dias", "Thiago Monteiro", "Vitória Campos", "Yuri Fernandes",
];

function aluno(indice: number): AlunoResumo {
  const nome = NOMES[indice % NOMES.length];
  const usuario = nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(" ")[0];
  return { id: `alu-${indice + 1}`, nome, email: `${usuario}${indice + 1}@exemplo.test` };
}

const LETRAS_DISC: LetraDisc[] = ["D", "I", "S", "C"];
const LETRAS_RIASEC: LetraRiasec[] = ["R", "I", "A", "S", "E", "C"];

/** Os 20 alunos cadastrados, com testes e badges vindos do app. Os 2 últimos ainda não fizeram os testes. */
export const alunosIniciais: (AlunoResumo & PerfilAluno)[] = NOMES.map((_, i) => ({
  ...aluno(i),
  disc: i >= 18 ? null : LETRAS_DISC[(i * 3) % 4],
  riasec: i >= 18 ? null : LETRAS_RIASEC[(i * 5) % 6],
  badges: (i * 7) % 5,
}));

let sequencia = 0;
function inscricao(palestraId: string, indiceAluno: number, extra: Partial<Inscricao> = {}): Inscricao {
  sequencia += 1;
  return {
    id: `ins-${sequencia}`,
    palestraId,
    aluno: aluno(indiceAluno),
    status: "ATIVA",
    criadaEm: diaRelativo(-10 + (sequencia % 7), 9 + (sequencia % 8)),
    posicaoEspera: null,
    conviteExpiraEm: null,
    canceladaEm: null,
    ...extra,
  };
}

export const inscricoesIniciais: Inscricao[] = [
  // pal-1: lotada (8 vagas) com lista de espera e um convite pendente
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => inscricao("pal-1", i)),
  inscricao("pal-1", 8, { status: "CONVIDADA", posicaoEspera: 1, conviteExpiraEm: horasAPartirDeAgora(20) }),
  inscricao("pal-1", 9, { status: "ESPERA", posicaoEspera: 2 }),
  inscricao("pal-1", 10, { status: "ESPERA", posicaoEspera: 3 }),
  inscricao("pal-1", 11, { status: "CANCELADA", canceladaEm: diaRelativo(-1, 18) }),
  // pal-2: com vagas sobrando
  ...[3, 5, 7, 9, 12, 14, 16].map((i) => inscricao("pal-2", i)),
  // pal-3: poucas inscrições ainda
  ...[1, 2, 18].map((i) => inscricao("pal-3", i)),
  // pal-4 e pal-5: encerradas
  ...[0, 3, 6, 8, 10, 13, 15, 17, 19].map((i) => inscricao("pal-4", i)),
  ...[2, 3, 11, 12, 14].map((i) => inscricao("pal-5", i)),
  // pal-6 e pal-7: todos compareceram
  ...[0, 2, 5, 6, 12, 15, 17].map((i) => inscricao("pal-6", i)),
  ...[0, 1, 6, 10, 13, 16].map((i) => inscricao("pal-7", i)),
];

/**
 * Presenças já registradas. Quem não está aqui leva falta quando a lista é encerrada.
 * Resultado esperado ao iniciar: Diego Martins (alu-4) faltou na pal-5 e na pal-4 e
 * está bloqueado; Isabela Cardoso (alu-9) faltou na pal-4 e tem 1 ponto.
 */
function presente(palestraId: string, indicesAlunos: number[], origem: OrigemPresenca = "QR") {
  return indicesAlunos.map((i) => ({ palestraId, alunoId: `alu-${i + 1}`, origem }));
}

export const presencasIniciais = [
  ...presente("pal-5", [2, 11, 12, 14]), // faltou: alu-4
  ...presente("pal-4", [0, 6, 10, 13, 15, 17]), // faltaram: alu-4 e alu-9
  ...presente("pal-4", [19], "MANUAL"),
  ...presente("pal-1", [0, 1, 2]), // palestra de hoje, check-in em andamento
  ...presente("pal-6", [0, 2, 5, 6, 12, 15, 17]),
  ...presente("pal-7", [0, 1, 6, 10, 13, 16]),
];

/** Ordem em que as listas são encerradas ao iniciar o mock (da mais antiga para a mais recente). */
export const listasParaEncerrarAoIniciar = ["pal-7", "pal-6", "pal-5", "pal-4"];

/**
 * Palestras com certificados já liberados ao iniciar. A pal-4 fica pendente de propósito,
 * para testar o botão. Quem recebeu na pal-5 (Currículo) e for à pal-2 (mesmo evento)
 * aparece como "já recebeu" — um certificado por evento.
 */
export const certificadosParaLiberarAoIniciar = ["pal-7", "pal-6", "pal-5"];

/** Histórico de mensagens já enviadas (o nº de destinatários é o que valia na hora do envio). */
export const mensagensIniciais: Mensagem[] = [
  {
    id: "msg-1",
    titulo: "Inscrições abertas para Estratégias para o ENEM",
    corpo: "A palestra sobre organização de estudos e simulados já está no app. Garanta sua vaga!",
    segmento: "TODOS",
    palestraId: null,
    letraDisc: null,
    enviadaEm: diaRelativo(-3, 18),
    destinatarios: 20,
  },
  {
    id: "msg-2",
    titulo: "Lembrete: hoje tem palestra no Auditório",
    corpo: "Chegue 10 minutos antes e deixe o convite com o QR Code aberto no celular.",
    segmento: "PALESTRA",
    palestraId: "pal-1",
    letraDisc: null,
    enviadaEm: diaRelativo(0, 8),
    destinatarios: 11,
  },
  {
    id: "msg-3",
    titulo: "Desafio da semana para o perfil Dominância",
    corpo: "Que tal liderar a próxima dinâmica em grupo? Conte pra gente como foi.",
    segmento: "DISC",
    palestraId: null,
    letraDisc: "D",
    enviadaEm: diaRelativo(-10, 15),
    destinatarios: 5,
  },
];

let seqMensagemDuvida = 0;
function conversa(...falas: [autor: "ALUNO" | "ADMIN", texto: string, diasAtras: number, hora: number][]) {
  return falas.map(([autor, texto, diasAtras, hora]) => {
    seqMensagemDuvida += 1;
    return { id: `mdu-${seqMensagemDuvida}`, autor, texto, criadaEm: diaRelativo(-diasAtras, hora) };
  });
}

/** Caixa de dúvidas: 2 abertas (uma é réplica do aluno), 2 respondidas e 1 fechada. */
export const duvidasIniciais: Duvida[] = [
  {
    id: "duv-1",
    aluno: aluno(4),
    assunto: "Posso levar um amigo na palestra?",
    status: "ABERTA",
    criadaEm: diaRelativo(0, 9),
    mensagens: conversa(["ALUNO", "Oi! Um amigo meu ainda não tem o app. Ele pode ir comigo na palestra de currículo?", 0, 9]),
  },
  {
    id: "duv-2",
    aluno: aluno(3),
    assunto: "Fui bloqueado e não entendi o motivo",
    status: "ABERTA",
    criadaEm: diaRelativo(-2, 20),
    mensagens: conversa(
      ["ALUNO", "Apareceu que estou bloqueado por 30 dias. Por quê?", 2, 20],
      ["ADMIN", "Oi, Diego! Você faltou em duas palestras sem cancelar com 72h de antecedência, e isso gera o bloqueio.", 1, 10],
      ["ALUNO", "Na segunda eu estava doente. Tenho atestado, posso mandar?", 1, 12],
    ),
  },
  {
    id: "duv-3",
    aluno: aluno(7),
    assunto: "Certificado da palestra de entrevistas",
    status: "RESPONDIDA",
    criadaEm: diaRelativo(-5, 14),
    mensagens: conversa(
      ["ALUNO", "Quando o certificado da palestra de entrevistas vai aparecer no app?", 5, 14],
      ["ADMIN", "Oi! A equipe libera os certificados depois da palestra, e você recebe uma notificação no app.", 5, 16],
    ),
  },
  {
    id: "duv-4",
    aluno: aluno(12),
    assunto: "Teste DISC",
    status: "RESPONDIDA",
    criadaEm: diaRelativo(-8, 11),
    mensagens: conversa(
      ["ALUNO", "Preciso fazer o teste DISC de novo para cada palestra de soft skills?", 8, 11],
      ["ADMIN", "Não precisa! Basta fazer uma vez; o resultado fica salvo no seu perfil.", 8, 13],
    ),
  },
  {
    id: "duv-5",
    aluno: aluno(16),
    assunto: "Endereço da faculdade",
    status: "FECHADA",
    criadaEm: diaRelativo(-15, 10),
    mensagens: conversa(
      ["ALUNO", "Qual é o endereço da faculdade onde acontecem as palestras?", 15, 10],
      ["ADMIN", "O endereço completo fica na tela de cada palestra no app, junto com a sala.", 15, 11],
      ["ALUNO", "Achei, obrigada!", 15, 12],
    ),
  },
];

/** Palestras de soft skills com grupos já gerados (como se a tarefa da véspera tivesse rodado). */
export const gruposParaGerarAoIniciar = ["pal-7", "pal-4", "pal-1"];
