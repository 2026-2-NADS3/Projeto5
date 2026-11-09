package com.example.proximaetapa.ui.auth;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.Button;
import android.widget.EditText;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.snackbar.Snackbar;

import com.example.proximaetapa.R;
import com.example.proximaetapa.data.remote.dto.Dtos;
import com.example.proximaetapa.data.repository.AppRepository;
import com.example.proximaetapa.ui.widget.CampoSenha;
import com.example.proximaetapa.util.TecladoUtils;

public class NovaSenhaActivity extends AppCompatActivity {

    private static final int SENHA_MINIMA = 6;

    private EditText edtSenha, edtConfirmacao;
    private Button btnSalvar;
    private View progresso;
    private Dtos.AuthResponse sessaoDoLink;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_nova_senha);
        TecladoUtils.ajustarAoTeclado(this);
        edtSenha = findViewById(R.id.edt_senha);
        edtConfirmacao = findViewById(R.id.edt_confirmacao);
        btnSalvar = findViewById(R.id.btn_salvar);
        progresso = findViewById(R.id.progresso);
        CampoSenha.configurar(edtSenha, findViewById(R.id.btn_olho_senha));
        CampoSenha.configurar(edtConfirmacao, findViewById(R.id.btn_olho_confirmacao));

        sessaoDoLink = lerLink(getIntent().getData());
        if (sessaoDoLink == null) {
            irParaLogin(getString(R.string.erro_link_recuperacao));
            return;
        }

        btnSalvar.setOnClickListener(v -> salvar());
        edtConfirmacao.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                salvar();
                return true;
            }
            return false;
        });
    }

    private static Dtos.AuthResponse lerLink(Uri link) {
        if (link == null || link.getEncodedFragment() == null) return null;
        Uri params = Uri.parse("x://x?" + link.getEncodedFragment());
        if (params.getQueryParameter("error") != null) return null;
        Dtos.AuthResponse a = new Dtos.AuthResponse();
        a.access_token = params.getQueryParameter("access_token");
        a.refresh_token = params.getQueryParameter("refresh_token");
        try {
            String exp = params.getQueryParameter("expires_in");
            a.expires_in = exp == null ? 3600 : Long.parseLong(exp);
        } catch (NumberFormatException e) {
            a.expires_in = 3600;
        }
        return a.access_token == null ? null : a;
    }

    private void salvar() {
        if (!btnSalvar.isEnabled()) return;
        String senha = LoginActivity.texto(edtSenha);
        String confirmacao = LoginActivity.texto(edtConfirmacao);
        if (senha.length() < SENHA_MINIMA) {
            edtSenha.setError(getString(R.string.erro_senha_curta));
            edtSenha.requestFocus();
            return;
        }
        if (!senha.equals(confirmacao)) {
            edtConfirmacao.setError(getString(R.string.erro_senhas_diferentes));
            edtConfirmacao.requestFocus();
            return;
        }
        progresso.setVisibility(View.VISIBLE);
        btnSalvar.setEnabled(false);
        AppRepository.get(this).definirNovaSenha(sessaoDoLink, senha, new AppRepository.Callback<String>() {
            @Override
            public void sucesso(String msg) {
                irParaLogin(msg);
            }

            @Override
            public void erro(String msg) {
                progresso.setVisibility(View.GONE);
                btnSalvar.setEnabled(true);
                Snackbar.make(btnSalvar, msg, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private void irParaLogin(String aviso) {
        Intent i = new Intent(this, LoginActivity.class);
        i.putExtra(LoginActivity.EXTRA_AVISO, aviso);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(i);
        finish();
    }
}
