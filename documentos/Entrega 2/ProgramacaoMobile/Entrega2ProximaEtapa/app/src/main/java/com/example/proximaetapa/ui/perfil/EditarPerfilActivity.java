package com.example.proximaetapa.ui.perfil;

import android.content.Intent;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import com.google.android.material.snackbar.Snackbar;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import com.example.proximaetapa.R;
import com.example.proximaetapa.data.local.entity.Aluno;
import com.example.proximaetapa.data.repository.AppRepository;
import com.example.proximaetapa.ui.BaseActivity;
import com.example.proximaetapa.ui.main.MainActivity;

public class EditarPerfilActivity extends BaseActivity {

    public static final String EXTRA_ONBOARDING = "onboarding";

    private AppRepository repo;
    private Aluno aluno;
    private boolean onboarding;
    private boolean preenchido = false;

    private ChipGroup chips;
    private EditText edtNome, edtLinkedin, edtEndereco, edtCidade, edtEscola;
    private Button btnSalvar;
    private View progresso;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_editar_perfil);
        onboarding = getIntent().getBooleanExtra(EXTRA_ONBOARDING, false);
        configurarToolbar(onboarding ? R.string.onboarding_titulo : R.string.menu_editar_perfil);
        repo = AppRepository.get(this);

        chips = findViewById(R.id.chips_interesses);
        edtNome = findViewById(R.id.edt_nome);
        edtLinkedin = findViewById(R.id.edt_linkedin);
        edtEndereco = findViewById(R.id.edt_endereco);
        edtCidade = findViewById(R.id.edt_cidade);
        edtEscola = findViewById(R.id.edt_escola);
        btnSalvar = findViewById(R.id.btn_salvar);
        progresso = findViewById(R.id.progresso);

        for (String tag : getResources().getStringArray(R.array.interesses)) {
            Chip c = new Chip(this);
            c.setText(tag);
            c.setCheckable(true);
            chips.addView(c);
        }

        if (onboarding) {
            findViewById(R.id.txt_onboarding).setVisibility(View.VISIBLE);
            View pular = findViewById(R.id.btn_pular);
            pular.setVisibility(View.VISIBLE);
            pular.setOnClickListener(v -> irParaHome());
        }

        btnSalvar.setOnClickListener(v -> salvar());

        repo.aluno().observe(this, a -> {
            aluno = a;
            if (a != null && !preenchido) {
                preencher(a);
                preenchido = true;
            }
        });
    }

    private void preencher(Aluno a) {
        edtNome.setText(a.nome);
        edtLinkedin.setText(a.linkedin);
        edtEndereco.setText(a.endereco);
        edtCidade.setText(a.cidade);
        edtEscola.setText(a.escola);
        List<String> marcados = a.interesses == null
                ? new ArrayList<>()
                : Arrays.asList(a.interesses.split(","));
        for (int i = 0; i < chips.getChildCount(); i++) {
            Chip c = (Chip) chips.getChildAt(i);
            c.setChecked(marcados.contains(c.getText().toString()));
        }
    }

    private void salvar() {
        if (aluno == null) return;
        String nome = texto(edtNome);
        if (nome.split("\\s+").length < 2) {
            edtNome.setError(getString(R.string.erro_nome));
            edtNome.requestFocus();
            return;
        }

        List<String> tags = new ArrayList<>();
        for (int i = 0; i < chips.getChildCount(); i++) {
            Chip c = (Chip) chips.getChildAt(i);
            if (c.isChecked()) tags.add(c.getText().toString());
        }

        Aluno novo = new Aluno();
        novo.id = aluno.id;
        novo.email = aluno.email;
        novo.matricula = aluno.matricula;
        novo.nome = nome;
        novo.linkedin = texto(edtLinkedin);
        novo.endereco = texto(edtEndereco);
        novo.cidade = texto(edtCidade);
        novo.escola = texto(edtEscola);
        novo.interesses = TextUtils.join(",", tags);

        progresso.setVisibility(View.VISIBLE);
        btnSalvar.setEnabled(false);
        repo.atualizarPerfil(novo, new AppRepository.Callback<Aluno>() {
            @Override
            public void sucesso(Aluno salvo) {
                progresso.setVisibility(View.GONE);
                btnSalvar.setEnabled(true);
                if (onboarding) {
                    irParaHome();
                } else {
                    Snackbar.make(btnSalvar, R.string.perfil_salvo, Snackbar.LENGTH_SHORT).show();
                }
            }

            @Override
            public void erro(String mensagem) {
                progresso.setVisibility(View.GONE);
                btnSalvar.setEnabled(true);
                Snackbar.make(btnSalvar, mensagem, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private void irParaHome() {
        Intent i = new Intent(this, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(i);
        finish();
    }

    private static String texto(EditText e) {
        return e.getText() == null ? "" : e.getText().toString().trim();
    }
}
