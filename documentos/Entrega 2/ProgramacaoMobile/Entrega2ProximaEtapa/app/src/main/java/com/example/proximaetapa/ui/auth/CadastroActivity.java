package com.example.proximaetapa.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.util.Patterns;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.snackbar.Snackbar;

import com.example.proximaetapa.R;
import com.example.proximaetapa.data.local.entity.Aluno;
import com.example.proximaetapa.data.remote.dto.Dtos;
import com.example.proximaetapa.data.repository.AppRepository;
import com.example.proximaetapa.ui.perfil.EditarPerfilActivity;
import com.example.proximaetapa.ui.widget.CampoSenha;
import com.example.proximaetapa.util.TecladoUtils;

public class CadastroActivity extends AppCompatActivity {

    private static final int SENHA_MINIMA = 6;

    private EditText edtNome, edtEmail, edtTelefone, edtSenha, edtConfirmacao;
    private Button btnCadastrar;
    private View progresso;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_cadastro);
        TecladoUtils.ajustarAoTeclado(this);

        edtNome = findViewById(R.id.edt_nome);
        edtEmail = findViewById(R.id.edt_email);
        edtTelefone = findViewById(R.id.edt_telefone);
        edtSenha = findViewById(R.id.edt_senha);
        edtConfirmacao = findViewById(R.id.edt_confirmacao);
        btnCadastrar = findViewById(R.id.btn_cadastrar);
        progresso = findViewById(R.id.progresso);

        CampoSenha.configurar(edtSenha, findViewById(R.id.btn_olho_senha));
        CampoSenha.configurar(edtConfirmacao, findViewById(R.id.btn_olho_confirmacao));

        btnCadastrar.setOnClickListener(v -> cadastrar());
        findViewById(R.id.btn_ja_tenho).setOnClickListener(v -> finish());
    }

    private void cadastrar() {
        String nome = LoginActivity.texto(edtNome);
        String email = LoginActivity.texto(edtEmail).toLowerCase();
        String telefone = LoginActivity.texto(edtTelefone);
        int digitosTelefone = telefone.replaceAll("\\D", "").length();
        String senha = LoginActivity.texto(edtSenha);
        String confirmacao = LoginActivity.texto(edtConfirmacao);

        if (nome.split("\\s+").length < 2) {
            erro(edtNome, R.string.erro_nome);
            return;
        }
        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            erro(edtEmail, R.string.erro_email_invalido);
            return;
        }
        if (!telefone.isEmpty() && (digitosTelefone < 10 || digitosTelefone > 11)) {
            erro(edtTelefone, R.string.erro_telefone);
            return;
        }
        if (senha.length() < SENHA_MINIMA) {
            erro(edtSenha, R.string.erro_senha_curta);
            return;
        }
        if (!senha.equals(confirmacao)) {
            erro(edtConfirmacao, R.string.erro_senhas_diferentes);
            return;
        }

        Dtos.CadastroRequest req = new Dtos.CadastroRequest();
        req.nome = nome;
        req.email = email;
        req.telefone = telefone;
        req.senha = senha;

        progresso.setVisibility(View.VISIBLE);
        btnCadastrar.setEnabled(false);
        AppRepository.get(this).cadastrar(req, new AppRepository.Callback<Aluno>() {
            @Override
            public void sucesso(Aluno aluno) {
                Intent i = new Intent(CadastroActivity.this, EditarPerfilActivity.class);
                i.putExtra(EditarPerfilActivity.EXTRA_ONBOARDING, true);
                i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                startActivity(i);
                finish();
            }

            @Override
            public void erro(String mensagem) {
                progresso.setVisibility(View.GONE);
                btnCadastrar.setEnabled(true);
                if (AppRepository.MSG_CONFIRMAR_EMAIL.equals(mensagem)) {
                    Intent i = new Intent(CadastroActivity.this, LoginActivity.class);
                    i.putExtra(LoginActivity.EXTRA_AVISO, mensagem);
                    i.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    startActivity(i);
                    finish();
                    return;
                }
                Snackbar.make(btnCadastrar, mensagem, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private void erro(EditText campo, int mensagem) {
        campo.setError(getString(mensagem));
        campo.requestFocus();
    }
}
