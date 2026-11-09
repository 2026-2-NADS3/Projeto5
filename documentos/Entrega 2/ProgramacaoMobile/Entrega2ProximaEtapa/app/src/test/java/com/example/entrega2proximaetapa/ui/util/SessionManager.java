package com.example.proximaetapa.util;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

public final class SessionManager {

    private static final String TAG = "SessionManager";
    private static final String ARQUIVO = "pe_sessao_segura";
    private static final String K_TOKEN = "token";
    private static final String K_REFRESH = "refresh_token";
    private static final String K_EXPIRA_EM = "token_expira_em";
    private static final String K_ALUNO_ID = "aluno_id";
    private static final String K_NOME = "nome";
    private static final String K_ULTIMA_SYNC = "ultima_sync";
    private static final String K_PRIMEIRA_SYNC_OK = "primeira_sync_ok";

    private static volatile SessionManager instancia;
    private final SharedPreferences prefs;

    private SessionManager(Context ctx) {
        SharedPreferences p;
        try {
            MasterKey chave = new MasterKey.Builder(ctx)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build();
            p = EncryptedSharedPreferences.create(ctx, ARQUIVO, chave,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM);
        } catch (Exception e) {
            Log.w(TAG, "Criptografia indisponível, usando SharedPreferences comum", e);
            p = ctx.getSharedPreferences(ARQUIVO + "_fallback", Context.MODE_PRIVATE);
        }
        prefs = p;
    }

    public static SessionManager get(Context ctx) {
        if (instancia == null) {
            synchronized (SessionManager.class) {
                if (instancia == null) {
                    instancia = new SessionManager(ctx.getApplicationContext());
                }
            }
        }
        return instancia;
    }

    public void salvarAluno(long alunoId, String nome) {
        prefs.edit()
                .putLong(K_ALUNO_ID, alunoId)
                .putString(K_NOME, nome)
                .apply();
    }

    public synchronized void salvarTokens(String accessToken, String refreshToken, long expiraEm) {
        prefs.edit()
                .putString(K_TOKEN, accessToken)
                .putString(K_REFRESH, refreshToken)
                .putLong(K_EXPIRA_EM, expiraEm)
                .apply();
    }

    public String getRefreshToken() {
        return prefs.getString(K_REFRESH, null);
    }

    public long getTokenExpiraEm() {
        return prefs.getLong(K_EXPIRA_EM, 0L);
    }

    public boolean estaLogado() {
        return getToken() != null && getAlunoId() > 0;
    }

    public String getToken() {
        return prefs.getString(K_TOKEN, null);
    }

    public long getAlunoId() {
        return prefs.getLong(K_ALUNO_ID, -1L);
    }

    public String getNome() {
        return prefs.getString(K_NOME, "");
    }

    public void setNome(String nome) {
        prefs.edit().putString(K_NOME, nome).apply();
    }

    public long getUltimaSync() {
        return prefs.getLong(K_ULTIMA_SYNC, 0L);
    }

    public void setUltimaSync(long quando) {
        prefs.edit().putLong(K_ULTIMA_SYNC, quando).apply();
    }

    public boolean primeiraSyncFeita() {
        return prefs.getBoolean(K_PRIMEIRA_SYNC_OK, false);
    }

    public void setPrimeiraSyncFeita() {
        prefs.edit().putBoolean(K_PRIMEIRA_SYNC_OK, true).apply();
    }

    public void limpar() {
        prefs.edit().clear().apply();
        sessaoExpirada.postValue(false);
    }

    private final MutableLiveData<Boolean> sessaoExpirada = new MutableLiveData<>(false);

    public LiveData<Boolean> sessaoExpirada() {
        return sessaoExpirada;
    }

    public void marcarSessaoExpirada() {
        sessaoExpirada.postValue(true);
    }

    public void limparAvisoSessaoExpirada() {
        sessaoExpirada.setValue(false);
    }
}
