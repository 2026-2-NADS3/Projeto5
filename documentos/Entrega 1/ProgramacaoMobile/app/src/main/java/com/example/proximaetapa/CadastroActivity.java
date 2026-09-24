package com.example.proximaetapa;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;


 //Tela de Cadastro
 //Depois de validar o formulário, os dados  são usados para criar um objeto Usuario (classe de modelo) e o aluno é enviado de volta para a tela de Login cadastro -> login).


public class CadastroActivity extends AppCompatActivity {

    private EditText editNomeCompleto;
    private EditText editEmailCadastro;
    private EditText editEndereco;
    private EditText editCidade;
    private EditText editEscola;
    private EditText editSenhaCadastro;
    private EditText editConfirmaSenha;
    private TextView txtErroCadastro;
    private Button btnCadastrar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_cadastro);


        editNomeCompleto = findViewById(R.id.editNomeCompleto);
        editEmailCadastro = findViewById(R.id.editEmailCadastro);
        editEndereco = findViewById(R.id.editEndereco);
        editCidade = findViewById(R.id.editCidade);
        editEscola = findViewById(R.id.editEscola);
        editSenhaCadastro = findViewById(R.id.editSenhaCadastro);
        editConfirmaSenha = findViewById(R.id.editConfirmaSenha);
        txtErroCadastro = findViewById(R.id.txtErroCadastro);
        btnCadastrar = findViewById(R.id.btnCadastrar);

        btnCadastrar.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                cadastrar();
            }
        });
    }


     //Vvalida os dados do formulário de cadastro
    private void cadastrar() {
        String nome = editNomeCompleto.getText().toString().trim();
        String email = editEmailCadastro.getText().toString().trim();
        String endereco = editEndereco.getText().toString().trim();
        String cidade = editCidade.getText().toString().trim();
        String escola = editEscola.getText().toString().trim();
        String senha = editSenhaCadastro.getText().toString();
        String confirmaSenha = editConfirmaSenha.getText().toString();

        //nenhum campo pode ficar vazio
        if (nome.isEmpty() || email.isEmpty() || endereco.isEmpty() || cidade.isEmpty()
                || escola.isEmpty() || senha.isEmpty() || confirmaSenha.isEmpty()) {
            txtErroCadastro.setText("Preencha todos os campos para se cadastrar.");
            return;
        }

        // as duas senhas precisam ser iguais
        if (!senha.equals(confirmaSenha)) {
            txtErroCadastro.setText("As senhas digitadas não são iguais.");
            return;
        }

        // cria o objeto Usuario com os dados válidos (classe de modelo)
        Usuario novoUsuario = new Usuario(nome, email, escola);

        // Volta para a tela de Login já com o email preenchido
        Intent irParaLogin = new Intent(CadastroActivity.this, LoginActivity.class);
        irParaLogin.putExtra("emailCadastrado", novoUsuario.getEmail());
        startActivity(irParaLogin);
    }
}
