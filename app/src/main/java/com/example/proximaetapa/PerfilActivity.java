package com.example.proximaetapa;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

/**
 * Tela de Perfil do aluno.
 *
 * Recebe o nome do usuário (extra "nomeUsuario") vindo da tela de Login e
 * exibe na tela, junto com as demais informações do perfil. A partir daqui
 * o aluno pode navegar para a Agenda (Calendário) pelo botão "Meus Eventos"
 * ou pelo ícone de calendário da barra inferior.
 */
public class PerfilActivity extends AppCompatActivity {

    private TextView txtNomePerfil;
    private Button btnMeusEventos;
    private ImageButton btnNavCalendario;
    private ImageButton btnNavPerfil;
    private ImageButton btnNavInicio;
    private ImageButton btnNavMensagens;

    /** Nome do usuário logado, usado também ao navegar para a Agenda. */
    private String nomeUsuario;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_perfil);

        // Ligação das variáveis Java com os componentes do XML
        txtNomePerfil = findViewById(R.id.txtNomePerfil);
        btnMeusEventos = findViewById(R.id.btnMeusEventos);
        btnNavCalendario = findViewById(R.id.btnNavCalendario);
        btnNavPerfil = findViewById(R.id.btnNavPerfil);
        btnNavInicio = findViewById(R.id.btnNavInicio);
        btnNavMensagens = findViewById(R.id.btnNavMensagens);

        // Recebe o nome enviado pela tela de Login (Intent + getStringExtra)
        nomeUsuario = getIntent().getStringExtra("nomeUsuario");
        if (nomeUsuario == null || nomeUsuario.isEmpty()) {
            nomeUsuario = "Aluno(a)";
        }
        txtNomePerfil.setText(nomeUsuario);

        // Botão "Meus Eventos (Calendário)" -> abre a Agenda
        btnMeusEventos.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                abrirCalendario();
            }
        });

        // Ícone de calendário na barra inferior -> abre a Agenda também
        btnNavCalendario.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                abrirCalendario();
            }
        });

        // Ícone de perfil na barra inferior: já estamos nesta tela, então não faz nada
        btnNavPerfil.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // Tela atual - nenhuma navegação necessária
            }
        });

        // Os dois ícones abaixo (Início e Mensagens) estão reservados para
        // funcionalidades da Entrega 2 (RFM02 - Página inicial e RFM12 - Chat),
        // por isso não navegam para nenhuma tela nesta etapa.
        btnNavInicio.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // Funcionalidade prevista para a Entrega 2
            }
        });
        btnNavMensagens.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // Funcionalidade prevista para a Entrega 2
            }
        });
    }

    /** Abre a tela de Calendário, levando o nome do usuário junto. */
    private void abrirCalendario() {
        Intent irParaCalendario = new Intent(PerfilActivity.this, CalendarioActivity.class);
        irParaCalendario.putExtra("nomeUsuario", nomeUsuario);
        startActivity(irParaCalendario);
    }
}
