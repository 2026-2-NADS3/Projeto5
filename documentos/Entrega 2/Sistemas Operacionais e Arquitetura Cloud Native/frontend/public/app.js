/* ===========================================================================
   app.js - Painel administrativo Proxima Etapa
   ---------------------------------------------------------------------------
   Observacao importante sobre a arquitetura:

   Todas as chamadas abaixo usam caminhos RELATIVOS ("/api/cursos"), nunca
   "http://localhost:3000". Isso acontece porque o navegador fala apenas com
   o Nginx, e e' o Nginx que repassa /api/ para o container da API pelo nome
   de servico ("api:3000") dentro da rede Docker.

   Consequencia pratica: a porta da API nao precisa estar publicada no host
   para o painel funcionar.
   =========================================================================== */

'use strict';

// --- utilitarios ------------------------------------------------------------

async function buscar(caminho) {
  const resposta = await fetch(caminho, { headers: { Accept: 'application/json' } });
  if (!resposta.ok) {
    throw new Error(`${resposta.status} ${resposta.statusText}`);
  }
  return resposta.json();
}

function esc(valor) {
  const d = document.createElement('div');
  d.textContent = valor === null || valor === undefined ? '' : String(valor);
  return d.innerHTML;
}

function dataHoraBR(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function montarTabela(area, colunas, linhas, construirLinha) {
  if (!linhas.length) {
    area.innerHTML = '<p class="carregando">Nenhum registro encontrado.</p>';
    return;
  }
  area.innerHTML = `
    <table>
      <thead><tr>${colunas.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${linhas.map(construirLinha).join('')}</tbody>
    </table>`;
}

function mostrarErro(area, erro) {
  area.innerHTML = `<p class="erro">Falha ao carregar: ${esc(erro.message)}</p>`;
}

// --- estado da API ----------------------------------------------------------

async function verificarApi() {
  const ponto = document.getElementById('ponto-estado');
  const texto = document.getElementById('texto-estado');
  try {
    const dados = await buscar('/api-health');
    ponto.className = 'ponto ok';
    texto.textContent = `API no ar · banco ${dados.banco}`;
  } catch (erro) {
    ponto.className = 'ponto falha';
    texto.textContent = `API inacessível (${erro.message})`;
  }
}

// --- resumo -----------------------------------------------------------------

async function carregarResumo() {
  try {
    const d = await buscar('/api/resumo');
    document.getElementById('m-alunos').textContent     = d.total_alunos;
    document.getElementById('m-cursos').textContent     = d.total_cursos;
    document.getElementById('m-matriculas').textContent = d.matriculas_ativas;
    document.getElementById('m-presencas').textContent  = d.presencas_registradas;
    document.getElementById('m-encontros').textContent  = d.encontros_futuros;
  } catch (erro) {
    document.querySelectorAll('.cartao strong').forEach((e) => { e.textContent = '!'; });
    console.error('[painel] resumo:', erro);
  }
}

// --- cursos -----------------------------------------------------------------

async function carregarCursos() {
  const area = document.getElementById('area-cursos');
  try {
    const { dados } = await buscar('/api/cursos');
    montarTabela(
      area,
      ['Curso', 'Trilha', 'Carga horária', 'Encontros', 'Matrículas ativas'],
      dados,
      (c) => `
        <tr>
          <td><strong>${esc(c.titulo)}</strong></td>
          <td><span class="etiqueta">${esc(c.trilha)}</span></td>
          <td class="num">${esc(c.carga_horaria)} h</td>
          <td class="num">${esc(c.total_encontros)}</td>
          <td class="num">${esc(c.matriculas_ativas)}</td>
        </tr>`
    );
  } catch (erro) { mostrarErro(area, erro); }
}

// --- participacao -----------------------------------------------------------

async function carregarParticipacao() {
  const area = document.getElementById('area-participacao');
  try {
    const { dados } = await buscar('/api/participacao');
    montarTabela(
      area,
      ['Aluno', 'Curso', 'Presenças', 'Participação'],
      dados,
      (p) => {
        const pct = Number(p.percentual_participacao) || 0;
        return `
        <tr>
          <td>${esc(p.aluno)}</td>
          <td>${esc(p.curso)}</td>
          <td class="num">${esc(p.encontros_presentes)}/${esc(p.total_encontros)}</td>
          <td>
            <div class="barra-area">
              <div class="barra"><span style="width:${Math.min(pct, 100)}%"></span></div>
              <span class="barra-valor">${pct.toFixed(1)}%</span>
            </div>
          </td>
        </tr>`;
      }
    );
  } catch (erro) { mostrarErro(area, erro); }
}

// --- encontros --------------------------------------------------------------

async function carregarEncontros() {
  const area = document.getElementById('area-encontros');
  try {
    const { dados } = await buscar('/api/encontros');
    montarTabela(
      area,
      ['Encontro', 'Curso', 'Data e hora', 'Formato'],
      dados,
      (e) => `
        <tr>
          <td>${esc(e.titulo)}</td>
          <td>${esc(e.curso)}</td>
          <td>${esc(dataHoraBR(e.data_hora))}</td>
          <td><span class="etiqueta">${e.online ? 'online' : esc(e.local)}</span></td>
        </tr>`
    );
    preencherEncontros(dados);
  } catch (erro) { mostrarErro(area, erro); }
}

// --- alunos -----------------------------------------------------------------

async function carregarAlunos() {
  const area = document.getElementById('area-alunos');
  try {
    const { dados } = await buscar('/api/alunos');
    montarTabela(
      area,
      ['Nome', 'E-mail', 'Bairro', 'Cursos ativos'],
      dados,
      (a) => `
        <tr>
          <td><strong>${esc(a.nome)}</strong></td>
          <td>${esc(a.email)}</td>
          <td>${esc(a.bairro)}</td>
          <td class="num">${esc(a.cursos_ativos)}</td>
        </tr>`
    );
    preencherAlunos(dados);
  } catch (erro) { mostrarErro(area, erro); }
}

// --- formulario de presenca -------------------------------------------------

function preencherAlunos(alunos) {
  const sel = document.getElementById('sel-aluno');
  sel.innerHTML = alunos
    .map((a) => `<option value="${a.id}">${esc(a.nome)}</option>`)
    .join('');
}

function preencherEncontros(encontros) {
  const sel = document.getElementById('sel-encontro');
  sel.innerHTML = encontros
    .map((e) => `<option value="${e.id}">${esc(e.titulo)} — ${esc(e.curso)}</option>`)
    .join('');
}

function configurarFormulario() {
  const form = document.getElementById('form-presenca');
  const saida = document.getElementById('resposta-presenca');

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;
    saida.className = 'resposta';
    saida.textContent = 'Enviando…';

    const corpo = {
      aluno_id: Number(document.getElementById('sel-aluno').value),
      encontro_id: Number(document.getElementById('sel-encontro').value),
      metodo: document.getElementById('sel-metodo').value,
    };

    try {
      const resposta = await fetch('/api/presencas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      const dados = await resposta.json();

      if (!resposta.ok) throw new Error(dados.erro || `HTTP ${resposta.status}`);

      saida.className = 'resposta ok';
      saida.textContent = `Presença gravada (id ${dados.dados.id}, método ${dados.dados.metodo}). Recarregando os números…`;
      await Promise.all([carregarResumo(), carregarParticipacao()]);
    } catch (erro) {
      saida.className = 'resposta falha';
      saida.textContent = `Falha: ${erro.message}`;
    } finally {
      botao.disabled = false;
    }
  });
}

// --- abas -------------------------------------------------------------------

function configurarAbas() {
  document.querySelectorAll('.aba').forEach((aba) => {
    aba.addEventListener('click', () => {
      document.querySelectorAll('.aba').forEach((a) => a.classList.remove('ativa'));
      document.querySelectorAll('.painel:not(.registro)').forEach((p) => p.classList.remove('ativo'));
      aba.classList.add('ativa');
      document.getElementById(aba.dataset.painel).classList.add('ativo');
    });
  });
}

// --- inicializacao ----------------------------------------------------------

async function iniciar() {
  configurarAbas();
  configurarFormulario();

  await verificarApi();
  await Promise.all([
    carregarResumo(),
    carregarCursos(),
    carregarParticipacao(),
    carregarEncontros(),
    carregarAlunos(),
  ]);

  // Reconsulta o estado da API a cada 30 segundos.
  setInterval(verificarApi, 30000);
}

document.addEventListener('DOMContentLoaded', iniciar);
