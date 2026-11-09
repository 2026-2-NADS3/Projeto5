package com.example.proximaetapa.ui.config;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.EditText;
import android.widget.TextView;

import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.materialswitch.MaterialSwitch;
import com.google.android.material.snackbar.Snackbar;

import com.example.proximaetapa.BuildConfig;
import com.example.proximaetapa.R;
import com.example.proximaetapa.data.repository.AppRepository;
import com.example.proximaetapa.ui.BaseActivity;
import com.example.proximaetapa.ui.auth.LoginActivity;
import com.example.proximaetapa.ui.widget.CampoSenha;
import com.example.proximaetapa.util.DateUtils;
import com.example.proximaetapa.util.Preferencias;
import com.example.proximaetapa.util.SessionManager;

public class ConfiguracoesActivity extends BaseActivity {

    private AppRepository repo;
    private TextView txtUltimaSync;
    private View raiz;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_configuracoes);
        configurarToolbar(R.string.menu_configuracoes);
        repo = AppRepository.get(this);
        raiz = findViewById(R.id.txt_versao);
        txtUltimaSync = findViewById(R.id.txt_ultima_sync);

        MaterialSwitch swTema = findViewById(R.id.sw_tema_escuro);
        swTema.setChecked(Preferencias.temaEscuro(this));
        swTema.setOnCheckedChangeListener((b, marcado) -> Preferencias.setTemaEscuro(this, marcado));

        MaterialSwitch swNotif = findViewById(R.id.sw_notificacoes);
        swNotif.setChecked(Preferencias.notificacoesAtivas(this));
        swNotif.setOnCheckedChangeListener((b, marcado) -> Preferencias.setNotificacoesAtivas(this, marcado));

        findViewById(R.id.btn_sincronizar).setOnClickListener(v -> sincronizar());
        findViewById(R.id.btn_alterar_senha).setOnClickListener(v -> alterarSenha());
        findViewById(R.id.btn_apagar_conta).setOnClickListener(v -> apagarConta());

        ((TextView) findViewById(R.id.txt_versao)).setText(getString(R.string.versao,
                BuildConfig.VERSION_NAME, getString(R.string.modo_api)));

        atualizarUltimaSync();
    }

    private void atualizarUltimaSync() {
        long quando = SessionManager.get(this).getUltimaSync();
        txtUltimaSync.setText(quando == 0
                ? getString(R.string.nunca_sincronizado)
                : getString(R.string.ultima_sync, DateUtils.dataHora(quando)));
    }

    private void sincronizar() {
        repo.sincronizar(new AppRepository.Callback<String>() {
            @Override
            public void sucesso(String msg) {
                atualizarUltimaSync();
                Snackbar.make(raiz, msg, Snackbar.LENGTH_SHORT).show();
            }

            @Override
            public void erro(String msg) {
                Snackbar.make(raiz, msg, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private void alterarSenha() {
        View form = LayoutInflater.from(this).inflate(R.layout.dialog_alterar_senha, null);
        EditText atual = form.findViewById(R.id.edt_senha_atual);
        EditText nova = form.findViewById(R.id.edt_nova_senha);
        EditText confirma = form.findViewById(R.id.edt_confirmar_senha);
        CampoSenha.configurar(atual, form.findViewById(R.id.btn_olho_senha_atual));
        CampoSenha.configurar(nova, form.findViewById(R.id.btn_olho_nova_senha));
        CampoSenha.configurar(confirma, form.findViewById(R.id.btn_olho_confirmar_senha));
        new MaterialAlertDialogBuilder(this)
                .setTitle(R.string.alterar_senha)
                .setView(form)
                .setNegativeButton(R.string.cancelar, null)
                .setPositiveButton(R.string.salvar, (d, w) -> {
                    String sAtual = valor(atual), sNova = valor(nova), sConf = valor(confirma);
                    if (sNova.length() < 6) {
                        Snackbar.make(raiz, R.string.erro_senha_curta, Snackbar.LENGTH_LONG).show();
                        return;
                    }
                    if (!sNova.equals(sConf)) {
                        Snackbar.make(raiz, R.string.erro_senhas_diferentes, Snackbar.LENGTH_LONG).show();
                        return;
                    }
                    repo.alterarSenha(sAtual, sNova, new AppRepository.Callback<String>() {
                        @Override
                        public void sucesso(String msg) {
                            Snackbar.make(raiz, msg, Snackbar.LENGTH_LONG).show();
                        }

                        @Override
                        public void erro(String msg) {
                            Snackbar.make(raiz, msg, Snackbar.LENGTH_LONG).show();
                        }
                    });
                })
                .show();
    }

    private void apagarConta() {
        new MaterialAlertDialogBuilder(this)
                .setTitle(R.string.apagar_conta)
                .setMessage(R.string.apagar_conta_msg)
                .setNegativeButton(R.string.cancelar, null)
                .setPositiveButton(R.string.apagar, (d, w) ->
                        repo.excluirConta(new AppRepository.Callback<String>() {
                            @Override
                            public void sucesso(String msg) {
                                voltarParaLogin();
                            }

                            @Override
                            public void erro(String msg) {
                                Snackbar.make(raiz, msg, Snackbar.LENGTH_LONG).show();
                            }
                        }))
                .show();
    }

    private void voltarParaLogin() {
        Intent i = new Intent(this, LoginActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(i);
    }

    private static String valor(EditText e) {
        return e.getText() == null ? "" : e.getText().toString();
    }
}
