package com.example.proximaetapa.ui.auth;

import android.os.Bundle;
import android.util.Patterns;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.Button;
import android.widget.EditText;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.snackbar.Snackbar;

import com.example.proximaetapa.R;
import com.example.proximaetapa.data.repository.AppRepository;

public class RecuperarSenhaActivity extends AppCompatActivity {

    public static final String EXTRA_EMAIL = "email";

    private EditText edtEmail;
    private Button btnEnviar;
    private View progresso;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_recuperar_senha);
        edtEmail = findViewById(R.id.edt_email);
        btnEnviar = findViewById(R.id.btn_enviar);
        progresso = findViewById(R.id.progresso);

        String email = getIntent().getStringExtra(EXTRA_EMAIL);
        if (email != null) edtEmail.setText(email);

        findViewById(R.id.btn_voltar).setOnClickListener(v -> finish());
        btnEnviar.setOnClickListener(v -> enviar());
        edtEmail.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                enviar();
                return true;
            }
            return false;
        });
    }

    private void enviar() {
        if (!btnEnviar.isEnabled()) return;
        String email = LoginActivity.texto(edtEmail).toLowerCase();
        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            edtEmail.setError(getString(R.string.erro_email_invalido));
            edtEmail.requestFocus();
            return;
        }
        carregando(true);
        AppRepository.get(this).recuperarSenha(email, new AppRepository.Callback<String>() {
            @Override
            public void sucesso(String msg) {
                carregando(false);
                Snackbar.make(btnEnviar, msg, Snackbar.LENGTH_LONG).show();
            }

            @Override
            public void erro(String msg) {
                carregando(false);
                Snackbar.make(btnEnviar, msg, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private void carregando(boolean sim) {
        progresso.setVisibility(sim ? View.VISIBLE : View.GONE);
        btnEnviar.setEnabled(!sim);
    }
}
