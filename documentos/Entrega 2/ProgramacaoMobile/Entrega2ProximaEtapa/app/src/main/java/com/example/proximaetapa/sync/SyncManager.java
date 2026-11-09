package com.example.proximaetapa.sync;

import android.content.Context;

import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import com.example.proximaetapa.data.local.AppDatabase;
import com.example.proximaetapa.data.local.entity.Aluno;
import com.example.proximaetapa.data.local.entity.Evento;
import com.example.proximaetapa.data.local.entity.Inscricao;
import com.example.proximaetapa.data.local.entity.Notificacao;
import com.example.proximaetapa.data.local.entity.Presenca;
import com.example.proximaetapa.data.local.entity.ResultadoTeste;
import com.example.proximaetapa.data.remote.ApiClient;
import com.example.proximaetapa.data.remote.ApiService;
import com.example.proximaetapa.data.remote.dto.Dtos;
import com.example.proximaetapa.data.repository.TesteRepository;
import com.example.proximaetapa.util.DateUtils;
import com.example.proximaetapa.util.NotificationHelper;
import com.example.proximaetapa.util.SessionManager;
import retrofit2.Response;

public class SyncManager {

    private static final Object TRAVA = new Object();

    public static final class Resultado {
        public final boolean ok;
        public final String erro;

        private Resultado(boolean ok, String erro) {
            this.ok = ok;
            this.erro = erro;
        }
    }

    private static final class ErroApi extends Exception {
        ErroApi(String msg) {
            super(msg);
        }
    }

    private final Context ctx;
    private final AppDatabase db;
    private final ApiService api;
    private final SessionManager sessao;

    public SyncManager(Context ctx) {
        this.ctx = ctx.getApplicationContext();
        this.db = AppDatabase.get(this.ctx);
        this.api = ApiClient.get(this.ctx);
        this.sessao = SessionManager.get(this.ctx);
    }

    public Resultado sincronizar() {
        synchronized (TRAVA) {
            if (!sessao.estaLogado()) return new Resultado(true, null);
            long alunoId = sessao.getAlunoId();
            try {
                enviarPendentes();
                baixarTudo(alunoId);
                sessao.setUltimaSync(System.currentTimeMillis());
                return new Resultado(true, null);
            } catch (IOException e) {
                return new Resultado(false, ApiClient.MSG_SEM_INTERNET);
            } catch (ErroApi e) {
                return new Resultado(false, e.getMessage());
            }
        }
    }

    private void enviarPendentes() throws IOException, ErroApi {
        for (Inscricao i : db.inscricaoDao().pendentes()) {
            if (Inscricao.ATIVA.equals(i.status)) {
                Response<Inscricao> r = api.inscrever(new Dtos.Param<>(requisicao(i))).execute();
                if (r.isSuccessful()) db.inscricaoDao().confirmar(i, r.body());
                else if (tratarEnvio(r)) db.inscricaoDao().marcarSincronizada(i.id);
            } else {
                Response<Dtos.MensagemResponse> r =
                        api.cancelarInscricao(new Dtos.CancelarRequest(i.id)).execute();
                if (tratarEnvio(r)) db.inscricaoDao().marcarSincronizada(i.id);
            }
        }

        for (ResultadoTeste t : db.resultadoTesteDao().pendentes()) {
            Response<ResultadoTeste> r = api.enviarResultado(new Dtos.Param<>(t)).execute();
            if (tratarEnvio(r)) db.resultadoTesteDao().marcarSincronizado(t.id);
        }
    }

    public static Dtos.InscricaoRequest requisicao(Inscricao i) {
        return new Dtos.InscricaoRequest(i.id, i.eventoId, i.dataInscricao, i.codigoIngresso);
    }

    private boolean tratarEnvio(Response<?> r) throws ErroApi {
        if (r.isSuccessful()) return true;
        if (r.code() == 401) throw new ErroApi(ApiClient.mensagemDeErro(r));
        return r.code() >= 400 && r.code() < 500;
    }

    private void baixarTudo(long alunoId) throws IOException, ErroApi {
        Aluno aluno = corpo(api.meuPerfil(Dtos.VAZIO).execute());
        db.alunoDao().salvar(aluno);
        sessao.setNome(aluno.nome);

        Map<Long, Evento> agendaAntiga = new HashMap<>();
        for (Evento e : db.eventoDao().listarTodos()) agendaAntiga.put(e.id, e);
        Set<Long> inscritos = new HashSet<>(db.inscricaoDao().idsEventosAtivos(alunoId));
        List<Evento> eventos = corpo(api.eventos(Dtos.VAZIO).execute());
        db.eventoDao().substituirTodos(eventos);
        avisarMudancasNaAgenda(agendaAntiga, eventos, inscritos);

        List<Inscricao> inscricoes = corpo(api.inscricoes(Dtos.VAZIO).execute());
        for (Inscricao i : inscricoes) {
            i.alunoId = alunoId;
            i.sincronizado = true;
        }
        db.inscricaoDao().substituirSincronizadas(alunoId, inscricoes);

        List<Presenca> presencas = corpo(api.presencas(Dtos.VAZIO).execute());
        atualizarPresencas(alunoId, presencas, eventos);

        db.certificadoDao().substituir(alunoId, corpo(api.certificados(Dtos.VAZIO).execute()));
        db.bolsaDao().substituirTodas(corpo(api.bolsas(Dtos.VAZIO).execute()));

        mesclarNotificacoes(corpo(api.notificacoes(Dtos.VAZIO).execute()));

        TesteRepository.salvar(ctx, corpo(api.testes(Dtos.VAZIO).execute()));
    }

    private void atualizarPresencas(long alunoId, List<Presenca> doServidor, List<Evento> eventos) {
        Set<String> conhecidas = new HashSet<>();
        for (Presenca p : db.presencaDao().listar(alunoId)) conhecidas.add(chave(p));

        for (Presenca p : doServidor) p.alunoId = alunoId;
        db.presencaDao().substituirTodas(alunoId, doServidor);

        if (!sessao.primeiraSyncFeita()) return;
        Map<Long, String> titulos = new HashMap<>();
        for (Evento e : eventos) titulos.put(e.id, e.titulo);
        for (Presenca p : doServidor) {
            if (conhecidas.contains(chave(p))) continue;
            String titulo = titulos.get(p.eventoId);
            if (titulo == null) titulo = "evento";
            String texto = "Presença confirmada em " + titulo + " (" + DateUtils.dataIsoParaBr(p.dataEncontro) + ")";
            NotificationHelper.mostrar(ctx, Math.abs(chave(p).hashCode()), "Presença confirmada", texto);
        }
    }

    private static String chave(Presenca p) {
        return p.eventoId + "|" + p.dataEncontro;
    }

    private void avisarMudancasNaAgenda(Map<Long, Evento> antiga, List<Evento> nova, Set<Long> inscritos) {
        if (antiga.isEmpty()) return;
        long agora = System.currentTimeMillis();
        for (Evento e : nova) {
            Evento antes = antiga.get(e.id);
            if (antes == null || !inscritos.contains(e.id) || e.jaTerminou(agora)) continue;
            boolean mudou = antes.dataInicio != e.dataInicio || antes.dataFim != e.dataFim
                    || !Objects.equals(antes.local, e.local);
            if (!mudou) continue;

            Notificacao n = new Notificacao();
            n.id = -(e.id * 1_000_000L + Math.abs(e.dataInicio / 60_000L % 1_000_000L));
            n.tipo = Notificacao.TIPO_AGENDA;
            n.eventoId = e.id;
            n.titulo = "Mudança na agenda: " + e.titulo;
            n.mensagem = "Agora em " + DateUtils.periodo(e.dataInicio, e.dataFim) + " · " + e.local;
            n.dataPublicacao = agora;
            n.expiraEm = e.dataFim + 24L * 60 * 60 * 1000;
            n.exibidaNoSistema = true;
            db.notificacaoDao().salvar(n);
            NotificationHelper.mostrar(ctx, (int) (Math.abs(n.id) % Integer.MAX_VALUE), n.titulo, n.mensagem);
        }
    }

    private void mesclarNotificacoes(List<Notificacao> doServidor) {
        Map<Long, Notificacao> locais = new HashMap<>();
        for (Notificacao n : db.notificacaoDao().listarTodas()) locais.put(n.id, n);

        boolean primeira = !sessao.primeiraSyncFeita();
        long agora = System.currentTimeMillis();

        for (Notificacao n : doServidor) {
            Notificacao local = locais.get(n.id);
            if (local != null) {
                n.lida = local.lida;
                n.removida = local.removida;
                n.exibidaNoSistema = local.exibidaNoSistema;
            } else {
                n.lida = false;
                n.removida = false;
                n.exibidaNoSistema = false;
            }
            if (!n.exibidaNoSistema) {
                boolean valida = n.expiraEm == null || n.expiraEm > agora;
                if (!primeira && valida) {
                    NotificationHelper.mostrar(ctx, (int) (n.id % Integer.MAX_VALUE), n.titulo, n.mensagem);
                }
                n.exibidaNoSistema = true;
            }
        }
        db.notificacaoDao().salvarTodas(doServidor);
        if (primeira) sessao.setPrimeiraSyncFeita();
    }

    private <T> T corpo(Response<T> r) throws ErroApi {
        if (r.isSuccessful() && r.body() != null) return r.body();
        throw new ErroApi(ApiClient.mensagemDeErro(r));
    }
}
