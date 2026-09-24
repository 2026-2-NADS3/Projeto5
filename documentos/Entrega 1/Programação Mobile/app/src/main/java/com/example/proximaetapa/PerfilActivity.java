package com.example.proximaetapa;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;


public class PerfilActivity extends AppCompatActivity {

    private TextView txtNomePerfil;
    private Button btnMeusEventos;
    private ImageButton btnNavCalendario;
    private ImageButton btnNavPerfil;
    private ImageButton btnNavInicio;
    private ImageButton btnNavMensagens;

    //Nome do usuário logado, navega para a Agenda.
    private String nomeUsuario;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_perfil);

        txtNomePerfil = findViewById(R.id.txtNomePerfil);
        btnMeusEventos = findViewById(R.id.btnMeusEventos);
        btnNavCalendario = findViewById(R.id.btnNavCalendario);
        btnNavPerfil = findViewById(R.id.btnNavPerfil);
        btnNavInicio = findViewById(R.id.btnNavInicio);
        btnNavMensagens = findViewById(R.id.btnNavMensagens);

        // Recebe o nome enviado pela tela de Login
        nomeUsuario = getIntent().getStringExtra("nomeUsuario");
        if (nomeUsuario == null || nomeUsuario.isEmpty()) {
            nomeUsuario = "Aluno(a)";
        }
        txtNomePerfil.setText(nomeUsuario);

        // botão "Meus Eventos /Calendário"
        btnMeusEventos.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                abrirCalendario();
            }
        });

        // icone de calendário
        btnNavCalendario.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                abrirCalendario();
            }
        });

        //já esta nessa tela, então não faz nada
        btnNavPerfil.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // nenhuma navegação necessária
            }
        });
    }

    // Abre a tela de Calendário, levando o nome do usuário junto
    private void abrirCalendario() {
        Intent irParaCalendario = new Intent(PerfilActivity.this, CalendarioActivity.class);
        irParaCalendario.putExtra("nomeUsuario", nomeUsuario);
        startActivity(irParaCalendario);
    }
}
