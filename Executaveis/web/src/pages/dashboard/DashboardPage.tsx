import { useCustom, useGetIdentity, useList } from "@refinedev/core";
import { ArrowRight, ClipboardCheck, Medal, QrCode } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { BarChart } from "../../components/ui/BarChart";
import { Button } from "../../components/ui/Button";
import { DateTile } from "../../components/ui/DateTile";
import { ProgressBar } from "../../components/ui/ProgressBar";
import {
  formatarDiaSemana,
  formatarHorario,
  formatarMesCurto,
  formatarMesLongo,
  mesAtual,
  situacaoDaPalestra,
} from "../../lib/datas";
import { TOP_DO_MES, TOP_GERAL } from "../../regras/ranking";
import type { Indicadores, ItemRanking, LetraDisc, LetraRiasec, PalestraDetalhada, Ranking } from "../../types/dominio";
import { ROTULO_DISC, ROTULO_RIASEC } from "../alunos/rotulos";
import { TipoBadge } from "../palestras/Badges";
import styles from "./DashboardPage.module.css";

/**
 * Tela 9.2 — Dashboard.
 * Abre pelo que importa hoje (a palestra do dia e o check-in), depois os
 * indicadores do mês (com filtro de mês), as próximas palestras, os gráficos
 * e os rankings (seção 4.4).
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const { data: usuario } = useGetIdentity<{ nome: string }>();
  const { result: palestras } = useList<PalestraDetalhada>({ resource: "palestras", pagination: { mode: "off" } });
  const [agora] = useState(() => Date.now());
  const [mes, setMes] = useState(() => mesAtual());
  const { result: indicadores, query: indicadoresQuery } = useCustom<Indicadores>({
    url: "/admin/dashboard",
    method: "get",
    config: { query: { mes } },
  });
  const { result: ranking, query: rankingQuery } = useCustom<Ranking>({
    url: "/admin/ranking",
    method: "get",
    config: { query: { mes } },
  });

  const { deHoje, proximas } = useMemo(() => {
    const ordenadas = [...palestras.data].sort((a, b) => a.inicio.localeCompare(b.inicio));
    return {
      deHoje: ordenadas.filter((p) => situacaoDaPalestra(p.inicio, p.listaEncerrada) === "HOJE"),
      proximas: ordenadas.filter((p) => new Date(p.inicio).getTime() > agora && situacaoDaPalestra(p.inicio, p.listaEncerrada) === "FUTURA").slice(0, 4),
    };
  }, [palestras.data, agora]);

  const primeiroNome = usuario?.nome.split(" ")[0];
  const dados = indicadoresQuery.isSuccess ? indicadores.data : null;
  const rankings = rankingQuery.isSuccess ? ranking.data : null;
  const ehMesAtual = mes === mesAtual();
  const nomeDoMes = formatarMesLongo(mes);

  return (
    <div className={styles.pagina}>
      <h1 className={styles.saudacao}>Olá{primeiroNome ? `, ${primeiroNome}` : ""}!</h1>

      {deHoje.length > 0 ? (
        deHoje.map((p) => (
          <section key={p.id} className={styles.hoje} aria-label="Palestra de hoje">
            <DateTile iso={p.inicio} size="lg" destaque />
            <div className={styles.hojeInfo}>
              <p className={styles.hojeEyebrow}>Acontece hoje · {formatarHorario(p.inicio, p.fim)}{p.sala ? ` · ${p.sala}` : ""}</p>
              <h2 className={styles.hojeTitulo}>{p.evento.titulo}</h2>
              <div className={styles.hojePresenca}>
                <ProgressBar
                  valor={p.contagem.presentes}
                  total={p.contagem.confirmados}
                  rotulo="Presentes em relação aos confirmados"
                  sobreFundoEscuro
                />
                <span>
                  <strong>{p.contagem.presentes}</strong> de {p.contagem.confirmados} confirmados já chegaram
                </span>
              </div>
            </div>
            <div className={styles.hojeAcoes}>
              <Button variant="success" onClick={() => navigate("/checkin")}>
                <QrCode size={18} aria-hidden="true" />
                Abrir check-in
              </Button>
              <Link to={`/palestras/${p.id}?aba=presenca`} className={styles.hojeLink}>
                Ver lista de presença
              </Link>
            </div>
          </section>
        ))
      ) : (
        <section className={`${styles.hoje} ${styles.hojeVazio}`}>
          <div className={styles.hojeInfo}>
            <p className={styles.hojeEyebrow}>Nenhuma palestra hoje</p>
            <h2 className={styles.hojeTitulo}>
              {proximas[0] ? `A próxima é ${proximas[0].evento.titulo}` : "Nenhuma palestra agendada"}
            </h2>
          </div>
          <div className={styles.hojeAcoes}>
            <Button variant="success" onClick={() => navigate("/palestras/nova")}>
              Cadastrar palestra
            </Button>
          </div>
        </section>
      )}

      <div className={styles.colunas}>
        <section aria-labelledby="titulo-indicadores">
          <div className={styles.secaoTopo}>
            <h2 id="titulo-indicadores" className={styles.secaoTitulo}>
              {ehMesAtual ? "Este mês" : nomeDoMes}
            </h2>
            <label className={styles.filtroMes}>
              <span>Mês</span>
              <input
                type="month"
                value={mes}
                max={mesAtual()}
                onChange={(e) => e.target.value && setMes(e.target.value)}
              />
            </label>
          </div>
          <div className={styles.indicadores}>
            <Indicador rotulo="Alunos registrados" valor={dados?.alunosRegistrados} />
            <Indicador rotulo="Palestras no mês" valor={dados?.palestrasNoMes} />
            <Indicador
              rotulo="Comparecimento"
              valor={dados?.taxaComparecimentoMes == null ? null : `${Math.round(dados.taxaComparecimentoMes * 100)}%`}
              detalhe="nas palestras já encerradas"
            />
            <Indicador rotulo="Faltas" valor={dados?.faltasNoMes} detalhe="não justificadas" />
            <Indicador rotulo="Bloqueados agora" valor={dados?.bloqueadosAgora} detalhe="sem novas inscrições por 30 dias" alerta={Boolean(dados?.bloqueadosAgora)} />
            <Indicador rotulo="Ativos na semana" valor={dados?.ativosNaSemana} detalhe="aparece quando o app estiver no ar" />
          </div>
        </section>

        <section aria-labelledby="titulo-proximas">
          <div className={styles.secaoTopo}>
            <h2 id="titulo-proximas" className={styles.secaoTitulo}>
              Próximas palestras
            </h2>
            <Link to="/palestras" className={styles.verTodas}>
              Ver todas <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <ul className={styles.proximas}>
            {proximas.length === 0 && <li className={styles.vazio}>Nenhuma palestra futura cadastrada.</li>}
            {proximas.map((p) => (
              <li key={p.id}>
                <Link to={`/palestras/${p.id}`} className={styles.proxima}>
                  <DateTile iso={p.inicio} size="sm" />
                  <span className={styles.proximaInfo}>
                    <span className={styles.proximaTitulo}>{p.evento.titulo}</span>
                    <span className={styles.proximaMeta}>
                      {formatarDiaSemana(p.inicio)} · {formatarHorario(p.inicio, p.fim)}
                    </span>
                    {p.vagas !== null && <ProgressBar valor={p.contagem.confirmados} total={p.vagas} rotulo="Vagas ocupadas" tom="roxo" />}
                    <span className={styles.proximaMeta}>
                      {p.vagas === null ? `${p.contagem.confirmados} inscritos · vagas não definidas` : `${p.contagem.confirmados} de ${p.vagas} vagas`}
                      {p.contagem.espera > 0 ? ` · ${p.contagem.espera} na espera` : ""}
                    </span>
                  </span>
                  <TipoBadge tipo={p.evento.tipo} />
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/palestras/nova" className={styles.novaPalestra}>
            <ClipboardCheck size={16} aria-hidden="true" />
            Cadastrar nova palestra
          </Link>
        </section>
      </div>

      <section aria-labelledby="titulo-graficos">
        <div className={styles.secaoTopo}>
          <h2 id="titulo-graficos" className={styles.secaoTitulo}>
            Palestras e perfis
          </h2>
        </div>
        <div className={styles.graficos}>
          <BarChart
            titulo={`Palestras por mês (até ${formatarMesCurto(mes)})`}
            barras={(dados?.palestrasPorMes ?? []).map((p) => ({
              rotulo: formatarMesCurto(p.mes),
              valor: p.total,
              descricao: `${formatarMesLongo(p.mes)}: ${p.total} palestra(s)`,
            }))}
            vazio="Nenhuma palestra nesses meses."
          />
          <BarChart
            titulo="Perfil DISC dos alunos"
            barras={(Object.keys(ROTULO_DISC) as LetraDisc[]).map((letra) => ({
              rotulo: `${letra} · ${ROTULO_DISC[letra]}`,
              valor: dados?.distribuicaoDisc[letra] ?? 0,
            }))}
            vazio="Nenhum aluno fez o teste DISC ainda."
          />
          <BarChart
            titulo="Perfil RIASEC dos alunos"
            barras={(Object.keys(ROTULO_RIASEC) as LetraRiasec[]).map((letra) => ({
              rotulo: `${letra} · ${ROTULO_RIASEC[letra]}`,
              valor: dados?.distribuicaoRiasec[letra] ?? 0,
            }))}
            vazio="Nenhum aluno fez o teste RIASEC ainda."
          />
        </div>
      </section>

      <section aria-labelledby="titulo-ranking">
        <div className={styles.secaoTopo}>
          <h2 id="titulo-ranking" className={styles.secaoTitulo}>
            Melhores alunos
          </h2>
          <span className={styles.secaoNota}>Palestras frequentadas; empate decidido pelos badges</span>
        </div>
        <div className={styles.rankings}>
          <ListaRanking
            titulo={`Top ${TOP_DO_MES} ${ehMesAtual ? "deste mês" : `de ${nomeDoMes}`}`}
            itens={rankings?.doMes}
            vazio="Ninguém frequentou palestras neste mês."
          />
          <ListaRanking titulo={`Top ${TOP_GERAL} geral`} itens={rankings?.geral} vazio="Nenhuma presença registrada ainda." />
        </div>
      </section>
    </div>
  );
}

function Indicador({
  rotulo,
  valor,
  detalhe,
  alerta = false,
}: {
  rotulo: string;
  valor: number | string | null | undefined;
  detalhe?: string;
  alerta?: boolean;
}) {
  const semValor = valor === null || valor === undefined;
  return (
    <div className={`${styles.indicador} ${alerta ? styles.alerta : ""}`}>
      <span className={styles.indicadorRotulo}>{rotulo}</span>
      <span className={`${styles.indicadorValor} ${semValor ? styles.semValor : ""}`}>{semValor ? "—" : valor}</span>
      {detalhe && <span className={styles.indicadorDetalhe}>{detalhe}</span>}
    </div>
  );
}

function ListaRanking({ titulo, itens, vazio }: { titulo: string; itens: ItemRanking[] | undefined; vazio: string }) {
  return (
    <div className={styles.ranking}>
      <h3 className={styles.rankingTitulo}>{titulo}</h3>
      {itens && itens.length === 0 && <p className={styles.vazio}>{vazio}</p>}
      <ol className={styles.rankingLista}>
        {itens?.map((item) => (
          <li key={item.aluno.id}>
            <Link to={`/alunos/${item.aluno.id}`} className={styles.rankingItem}>
              <span className={`${styles.posicao} ${item.posicao <= 3 ? styles.podio : ""}`}>{item.posicao}º</span>
              <span className={styles.rankingNome}>{item.aluno.nome}</span>
              <span className={styles.rankingNumero}>{item.palestras} palestra(s)</span>
              <span className={styles.rankingBadges} aria-label={`${item.badges} badges`}>
                <Medal size={14} aria-hidden="true" />
                {item.badges}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
