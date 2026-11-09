package com.example.proximaetapa.data.repository;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;

import androidx.lifecycle.LiveData;

import java.io.IOException;
import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

import com.example.proximaetapa.data.local.AppDatabase;
import com.example.proximaetapa.data.local.entity.Aluno;
import com.example.proximaetapa.data.local.entity.Bolsa;
import com.example.proximaetapa.data.local.entity.Certificado;
import com.example.proximaetapa.data.local.entity.Evento;
import com.example.proximaetapa.data.local.entity.Inscricao;
import com.example.proximaetapa.data.local.entity.InscricaoComEvento;
import com.example.proximaetapa.data.local.entity.MensagemChat;
import com.example.proximaetapa.data.local.entity.Notificacao;
import com.example.proximaetapa.data.local.entity.Presenca;
import com.example.proximaetapa.data.local.entity.ResultadoTeste;
import com.example.proximaetapa.data.remote.ApiClient;
import com.example.proximaetapa.data.remote.ApiService;
import com.example.proximaetapa.data.remote.dto.Dtos;
import com.example.proximaetapa.domain.ChatbotFaq;
import com.example.proximaetapa.sync.SyncManager;
import com.example.proximaetapa.sync.SyncWorker;
import com.example.proximaetapa.util.SessionManager;
import retrofit2.Response;

public class AppRepository {

    public interface Callback<T> {
        void sucesso(T resultado);

        void erro(String mensagem);
    }

    private static final long HORAS_72 = 72L * 60 * 60 * 1000;
    public static final String LINK_NOVA_SENHA = "proximaetapa://nova-senha";
    private static volatile AppRepository instancia;

    private final Context ctx;
    private final AppDatabase db;
    private final ApiService api;
    private final SessionManager sessao;
    private final ExecutorService io = Executors.newFixedThreadPool(3);
    private final Handler principal = new Handler(Looper.getMainLooper());

    private AppRepository(Context ctx) {
        this.ctx = ctx.getApplicationContext();
        this.db = AppDatabase.get(this.ctx);
        this.api = ApiClient.get(this.ctx);
        this.sessao = SessionManager.get(this.ctx);
    }

    public static AppRepository get(Context ctx) {
        if (instancia == null) {
            synchronized (AppRepository.class) {
                if (instancia == null) instancia = new AppRepository(ctx);
            }
        }
        return instancia;
    }

    public long alunoId() {
        return sessao.getAlunoId();
    }

    public LiveData<Aluno> aluno() {
        return db.alunoDao().observar(alunoId());
    }

    public LiveData<List<Evento>> eventos() {
        return db.eventoDao().observarTodos();
    }

    public LiveData<Evento> evento(long id) {
        return db.eventoDao().observar(id);
    }

    public LiveData<List<Inscricao>> inscricoesAtivas() {
        return db.inscricaoDao().observarAtivas(alunoId());
    }

    public LiveData<List<InscricaoComEvento>> ingressos() {
        return db.inscricaoDao().observarAtivasComEvento(alunoId());
    }

    public LiveData<InscricaoComEvento> ingresso(String inscricaoId) {
        return db.inscricaoDao().observarComEvento(inscricaoId);
    }

    public LiveData<Inscricao> inscricaoDoEvento(long eventoId) {
        return db.inscricaoDao().observarPorEvento(alunoId(), eventoId);
    }

    public LiveData<List<Presenca>> presencas() {
        return db.presencaDao().observarTodas(alunoId());
    }

    public LiveData<List<Presenca>> presencasDoEvento(long eventoId) {
        return db.presencaDao().observarPorEvento(alunoId(), eventoId);
    }

    public LiveData<List<Certificado>> certificados() {
        return db.certificadoDao().observar(alunoId());
    }

    public LiveData<List<Notificacao>> notificacoes() {
        return db.notificacaoDao().observarAtivas(System.currentTimeMillis());
    }

    public LiveData<List<Bolsa>> bolsasDestaque() {
        return db.bolsaDao().observarDestaques();
    }

    public LiveData<List<Bolsa>> bolsasInternacionais() {
        return db.bolsaDao().observarInternacionais();
    }

    public LiveData<Bolsa> bolsa(long id) {
        return db.bolsaDao().observar(id);
    }

    public LiveData<List<ResultadoTeste>> resultadosTeste() {
        return db.resultadoTesteDao().observarTodos(alunoId());
    }

    public LiveData<ResultadoTeste> resultadoTeste(String id) {
        return db.resultadoTesteDao().observar(id);
    }

    public LiveData<List<MensagemChat>> mensagensChat() {
        return db.mensagemChatDao().observarTodas();
    }

    public void login(String email, String senha, Callback<Aluno> cb) {
        io.execute(() -> {
            try {
                Response<Dtos.AuthResponse> r = api.login(new Dtos.LoginRequest(email, senha)).execute();
                if (!r.isSuccessful() || r.body() == null || r.body().access_token == null) {
                    erro(cb, ApiClient.mensagemDeErro(r));
                    return;
                }
                iniciarSessao(r.body(), cb);
            } catch (IOException e) {
                sessao.limpar();
                erro(cb, ApiClient.MSG_SEM_INTERNET);
            }
        });
    }

    public static final String MSG_CONFIRMAR_EMAIL =
            "Quase lá! Enviamos um link de confirmação para o seu e-mail. "
                    + "Confirme e depois entre com o seu e-mail e senha.";

    public void cadastrar(Dtos.CadastroRequest dados, Callback<Aluno> cb) {
        io.execute(() -> {
            try {
                Response<Dtos.AuthResponse> r = api.cadastrar(new Dtos.SignupRequest(dados)).execute();
                if (!r.isSuccessful() || r.body() == null) {
                    erro(cb, ApiClient.mensagemDeErro(r));
                    return;
                }
                if (r.body().access_token == null) {
                    try {
                        Response<Dtos.AuthResponse> rLogin = api.login(new Dtos.LoginRequest(dados.email, dados.senha)).execute();
                        if (rLogin.isSuccessful() && rLogin.body() != null && rLogin.body().access_token != null) {
                            iniciarSessao(rLogin.body(), cb);
                            return;
                        } else {
                            erro(cb, "Conta criada com sucesso! Entre com seu e-mail e senha.");
                            return;
                        }
                    } catch (IOException eLogin) {
                        erro(cb, ApiClient.MSG_SEM_INTERNET);
                        return;
                    }
                }
                iniciarSessao(r.body(), cb);
            } catch (IOException e) {
                sessao.limpar();
                erro(cb, ApiClient.MSG_SEM_INTERNET);
            }
        });
    }

    public void recuperarSenha(String email, Callback<String> cb) {
        io.execute(() -> {
            try {
                Response<Void> r = api.recuperarSenha(LINK_NOVA_SENHA,
                        new Dtos.RecuperarSenhaRequest(email)).execute();
                if (r.isSuccessful()) {
                    sucesso(cb, "Se o e-mail estiver cadastrado, você vai receber as instruções em instantes.");
                } else {
                    erro(cb, ApiClient.mensagemDeErro(r));
                }
            } catch (IOException e) {
                erro(cb, ApiClient.MSG_SEM_INTERNET);
            }
        });
    }

    public void definirNovaSenha(Dtos.AuthResponse sessaoDoLink, String nova, Callback<String> cb) {
        io.execute(() -> {
            SyncWorker.cancelarTudo(ctx);
            db.clearAllTables();
            sessao.limpar();
            ApiClient.salvarSessao(sessao, sessaoDoLink);
            try {
                Response<Void> r = api.alterarSenha(new Dtos.NovaSenhaRequest(nova)).execute();
                if (r.isSuccessful()) {
                    try {
                        api.logout().execute();
                    } catch (IOException ignorada) {
                    }
                    sessao.limpar();
                    sucesso(cb, "Senha alterada! Entre com a sua nova senha.");
                } else {
                    String msg = r.code() == 401 || r.code() == 403
                            ? "Este link expirou. Peça um novo em \"Esqueci minha senha\"."
                            : ApiClient.mensagemDeErro(r);
                    sessao.limpar();
                    erro(cb, msg);
                }
            } catch (IOException e) {
                sessao.limpar();
                erro(cb, ApiClient.MSG_SEM_INTERNET);
            }
        });
    }

    private void iniciarSessao(Dtos.AuthResponse auth, Callback<Aluno> cb) throws IOException {
        SyncWorker.cancelarTudo(ctx);
        db.clearAllTables();
        sessao.limpar();
        ApiClient.salvarSessao(sessao, auth);

        Response<Aluno> r = api.meuPerfil(Dtos.VAZIO).execute();
        if (!r.isSuccessful() || r.body() == null || r.body().id <= 0) {
            String msg = ApiClient.mensagemDeErro(r);
            sessao.limpar();
            erro(cb, msg);
            return;
        }
        Aluno aluno = r.body();
        sessao.salvarAluno(aluno.id, aluno.nome);
        db.alunoDao().salvar(aluno);
        new SyncManager(ctx).sincronizar();
        SyncWorker.agendarPeriodica(ctx);
        sucesso(cb, aluno);
    }

    public void logout(Runnable aoTerminar) {
        io.execute(() -> {
            if (sessao.getToken() != null) {
                try {
                    api.logout().execute();
                } catch (IOException ignorada) {
                }
            }
            SyncWorker.cancelarTudo(ctx);
            db.clearAllTables();
            sessao.limpar();
            principal.post(aoTerminar);
        });
    }

    private final AtomicBoolean encerrandoSessao = new AtomicBoolean(false);

    public void encerrarSessaoExpirada(Runnable aoTerminar) {
        if (!encerrandoSessao.compareAndSet(false, true)) return;
        io.execute(() -> {
            SyncWorker.cancelarTudo(ctx);
            db.clearAllTables();
            sessao.limpar();
            encerrandoSessao.set(false);
            principal.post(aoTerminar);
        });
    }

    public void atualizarPerfil(Aluno aluno, Callback<Aluno> cb) {
        io.execute(() -> {
            try {
                Response<Aluno> r = api.atualizarPerfil(new Dtos.Param<>(aluno)).execute();
                if (r.isSuccessful() && r.body() != null) {
                    db.alunoDao().salvar(r.body());
                    sessao.setNome(r.body().nome);
                    sucesso(cb, r.body());
                } else {
                    erro(cb, ApiClient.mensagemDeErro(r));
                }
            } catch (IOException e) {
                erro(cb, ApiClient.MSG_SEM_INTERNET);
            }
        });
    }

    public void alterarSenha(String atual, String nova, Callback<String> cb) {
        io.execute(() -> {
            Aluno aluno = db.alunoDao().buscar(alunoId());
            if (aluno == null || aluno.email == null) {
                erro(cb, "Não foi possível confirmar sua conta. Sincronize e tente de novo.");
                return;
            }
            try {
                Response<Dtos.AuthResponse> conf =
                        api.login(new Dtos.LoginRequest(aluno.email, atual)).execute();
                if (!conf.isSuccessful() || conf.body() == null || conf.body().access_token == null) {
                    erro(cb, conf.code() == 400 ? "A senha atual está incorreta." : ApiClient.mensagemDeErro(conf));
                    return;
                }
                ApiClient.salvarSessao(sessao, conf.body());

                Response<Void> r = api.alterarSenha(new Dtos.NovaSenhaRequest(nova)).execute();
                if (r.isSuccessful()) sucesso(cb, "Senha alterada com sucesso.");
                else erro(cb, ApiClient.mensagemDeErro(r));
            } catch (IOException e) {
                erro(cb, ApiClient.MSG_SEM_INTERNET);
            }
        });
    }

    public void excluirConta(Callback<String> cb) {
        io.execute(() -> {
            try {
                Response<Dtos.MensagemResponse> r = api.excluirConta(Dtos.VAZIO).execute();
                if (!r.isSuccessful()) {
                    erro(cb, ApiClient.mensagemDeErro(r));
                    return;
                }
                SyncWorker.cancelarTudo(ctx);
                db.clearAllTables();
                sessao.limpar();
                sucesso(cb, "Sua conta e seus dados foram excluídos.");
            } catch (IOException e) {
                erro(cb, ApiClient.MSG_SEM_INTERNET);
            }
        });
    }

    public void inscrever(Evento evento, Callback<Inscricao> cb) {
        io.execute(() -> {
            long aluno = alunoId();
            if (evento.requerTestes && db.resultadoTesteDao().contarTiposConcluidos(aluno) < 2) {
                erro(cb, "Para este curso, conclua antes os dois testes de perfil (Menu > Testes de perfil).");
                return;
            }
            if (evento.jaTerminou(System.currentTimeMillis())) {
                erro(cb, "Esse evento já terminou.");
                return;
            }
            Inscricao existente = db.inscricaoDao().buscarPorEvento(aluno, evento.id);
            String statusAnterior = existente == null ? null : existente.status;
            boolean sincAnterior = existente != null && existente.sincronizado;
            Inscricao i = existente != null ? existente : new Inscricao();
            if (existente == null) {
                i.id = UUID.randomUUID().toString();
                i.alunoId = aluno;
                i.eventoId = evento.id;
                i.codigoIngresso = gerarCodigoIngresso();
            }
            i.status = Inscricao.ATIVA;
            i.dataInscricao = System.currentTimeMillis();
            i.sincronizado = false;
            db.inscricaoDao().salvar(i);

            try {
                Response<Inscricao> r = api.inscrever(
                        new Dtos.Param<>(SyncManager.requisicao(i))).execute();
                if (r.isSuccessful()) {
                    db.inscricaoDao().confirmar(i, r.body());
                } else if (r.code() >= 400 && r.code() < 500 && r.code() != 401) {
                    if (existente == null) {
                        db.inscricaoDao().apagar(i.id);
                    } else {
                        i.status = statusAnterior;
                        i.sincronizado = sincAnterior;
                        db.inscricaoDao().salvar(i);
                    }
                    erro(cb, ApiClient.mensagemDeErro(r));
                    return;
                } else {
                    SyncWorker.sincronizarQuandoOnline(ctx);
                }
            } catch (IOException e) {
                SyncWorker.sincronizarQuandoOnline(ctx);
            }
            Inscricao atual = db.inscricaoDao().buscarPorEvento(aluno, evento.id);
            sucesso(cb, atual != null ? atual : i);
        });
    }

    public void cancelarInscricao(InscricaoComEvento item, Callback<String> cb) {
        io.execute(() -> {
            long agora = System.currentTimeMillis();
            if (item.evento != null && item.evento.dataInicio - agora < HORAS_72) {
                erro(cb, "O cancelamento só é possível até 72h antes do evento. "
                        + "Se não puder ir, avise a equipe pelo chat.");
                return;
            }
            Inscricao i = item.inscricao;
            i.status = Inscricao.CANCELADA;
            i.sincronizado = false;
            db.inscricaoDao().salvar(i);
            try {
                Response<Dtos.MensagemResponse> r =
                        api.cancelarInscricao(new Dtos.CancelarRequest(i.id)).execute();
                if (r.isSuccessful()) db.inscricaoDao().marcarSincronizada(i.id);
                else SyncWorker.sincronizarQuandoOnline(ctx);
            } catch (IOException e) {
                SyncWorker.sincronizarQuandoOnline(ctx);
            }
            sucesso(cb, "Inscrição cancelada.");
        });
    }

    private static String gerarCodigoIngresso() {
        String letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        SecureRandom rnd = new SecureRandom();
        StringBuilder sb = new StringBuilder("PE-");
        for (int k = 0; k < 6; k++) sb.append(letras.charAt(rnd.nextInt(letras.length())));
        return sb.toString();
    }

    public void salvarResultadoTeste(ResultadoTeste r, Callback<ResultadoTeste> cb) {
        io.execute(() -> {
            r.alunoId = alunoId();
            r.sincronizado = false;
            db.resultadoTesteDao().salvar(r);
            try {
                Response<ResultadoTeste> resp = api.enviarResultado(new Dtos.Param<>(r)).execute();
                if (resp.isSuccessful()) db.resultadoTesteDao().marcarSincronizado(r.id);
                else SyncWorker.sincronizarQuandoOnline(ctx);
            } catch (IOException e) {
                SyncWorker.sincronizarQuandoOnline(ctx);
            }
            sucesso(cb, r);
        });
    }

    public void contarTestesConcluidos(Callback<Integer> cb) {
        io.execute(() -> sucesso(cb, db.resultadoTesteDao().contarTiposConcluidos(alunoId())));
    }

    public void marcarNotificacaoLida(long id) {
        io.execute(() -> db.notificacaoDao().marcarLida(id));
    }

    public void definirNotificacaoRemovida(long id, boolean removida) {
        io.execute(() -> db.notificacaoDao().definirRemovida(id, removida));
    }

    public void garantirSaudacao(String primeiroNome) {
        io.execute(() -> {
            if (db.mensagemChatDao().contar() == 0) {
                db.mensagemChatDao().inserir(MensagemChat.nova("Olá, " + primeiroNome
                        + "! Eu sou a ProxIA e estou aqui para tirar suas dúvidas sobre o app, "
                        + "suas inscrições e a próxima etapa da sua vida acadêmica!", false));
            }
        });
    }

    public void enviarMensagemChat(String texto) {
        io.execute(() -> {
            db.mensagemChatDao().inserir(MensagemChat.nova(texto, true));
            db.mensagemChatDao().inserir(MensagemChat.nova(ChatbotFaq.responder(texto), false));
        });
    }

    public void sincronizar(Callback<String> cb) {
        io.execute(() -> {
            SyncManager.Resultado r = new SyncManager(ctx).sincronizar();
            if (r.ok) sucesso(cb, "Dados atualizados.");
            else erro(cb, r.erro);
        });
    }

    private <T> void sucesso(Callback<T> cb, T valor) {
        if (cb != null) principal.post(() -> cb.sucesso(valor));
    }

    private void erro(Callback<?> cb, String msg) {
        if (cb != null) principal.post(() -> cb.erro(msg));
    }
}
