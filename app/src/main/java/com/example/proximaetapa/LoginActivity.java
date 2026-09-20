package com.example.proximaetapa;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

/**
 * Tela de Login (tela inicial do app).
 *
 * Como ainda não temos um banco de dados/API (isso é da Entrega 2), o login
 * aqui é "simulado": ele apenas valida se o usuário preencheu email e senha
 * e, se estiver tudo certo, leva para a tela de Perfil, passando o nome do
 * usuário (extraído do email) via Intent, do mesmo jeito ensinado em aula
 * (Intent + putExtra).
 */
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

        // 1) Ligação das variáveis Java com os componentes do XML
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

        // 2) Evento de clique do botão "Entrar"
        btnEntrar.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                fazerLogin();
            }
        });

        // 3) Evento de clique no texto "Cadastrar conta nova" -> abre a tela de Cadastro
        txtIrCadastro.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent irParaCadastro = new Intent(LoginActivity.this, CadastroActivity.class);
                startActivity(irParaCadastro);
            }
        });

        // 4) Evento de clique em "Esqueci minha senha".
        // Recuperação de senha depende de backend/API, prevista para a Entrega 2.
        txtEsqueciSenha.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                txtErroLogin.setText("A recuperação de senha estará disponível na próxima entrega do projeto.");
            }
        });
    }

    /**
     * Função principal desta tela: valida os campos de login e, se
     * estiverem corretos, encaminha o aluno para a tela de Perfil.
     */
    private void fazerLogin() {
        String email = editEmailLogin.getText().toString().trim();
        String senha = editSenhaLogin.getText().toString().trim();

        if (email.isEmpty() || senha.isEmpty()) {
            txtErroLogin.setText("Preencha email e senha para continuar.");
            return;
        }

        // Simulação simples de nome de usuário: usa o texto antes do "@" do email
        String nomeUsuario = email.contains("@") ? email.substring(0, email.indexOf("@")) : email;

        Intent irParaPerfil = new Intent(LoginActivity.this, PerfilActivity.class);
        irParaPerfil.putExtra("nomeUsuario", nomeUsuario);
        startActivity(irParaPerfil);
    }
}
