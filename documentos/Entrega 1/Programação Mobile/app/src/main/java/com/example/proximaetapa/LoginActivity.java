package com.example.proximaetapa;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

 //Tela de Login (tela inicial do app).

public class LoginActivity extends AppCompatActivity {

    // Campos de tela (Views)
    private EditText editEmailLogin;
    private EditText editSenhaLogin;
    private TextView txtErroLogin;
    private Button btnEntrar;
    private TextView txtIrCadastro;
    private TextView txtEsqueciSenha;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        editEmailLogin = findViewById(R.id.editEmailLogin);
        editSenhaLogin = findViewById(R.id.editSenhaLogin);
        txtErroLogin = findViewById(R.id.txtErroLogin);
        btnEntrar = findViewById(R.id.btnEntrar);
        txtIrCadastro = findViewById(R.id.txtIrCadastro);
        txtEsqueciSenha = findViewById(R.id.txtEsqueciSenha);

        // Se a tela de Cadastro mandou de volta um email já cadastrado,
        // preenchemos o campo de email automaticamente.
        String emailVindoDoCadastro = getIntent().getStringExtra("emailCadastrado");
        if (emailVindoDoCadastro != null) {
            editEmailLogin.setText(emailVindoDoCadastro);
            txtErroLogin.setText("Cadastro realizado com sucesso! Faça login para continuar.");
        }

        // botão "Entrar"
        btnEntrar.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                fazerLogin();
            }
        });

        // clique no texto "Cadastrar conta nova", abre a tela de Cadastro
        txtIrCadastro.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent irParaCadastro = new Intent(LoginActivity.this, CadastroActivity.class);
                startActivity(irParaCadastro);
            }
        });

    }

    //Função principal desta tela: valida os campos de login e, se estiverem certo, encaminha o aluno para a tela de Perfil
    private void fazerLogin() {
        String email = editEmailLogin.getText().toString().trim();
        String senha = editSenhaLogin.getText().toString().trim();

        if (email.isEmpty() || senha.isEmpty()) {
            txtErroLogin.setText("Preencha email e senha para continuar.");
            return;
        }

        // nome de usuário: usa o texto antes do "@" do email
        String nomeUsuario = email.contains("@") ? email.substring(0, email.indexOf("@")) : email;

        Intent irParaPerfil = new Intent(LoginActivity.this, PerfilActivity.class);
        irParaPerfil.putExtra("nomeUsuario", nomeUsuario);
        startActivity(irParaPerfil);
    }
}
