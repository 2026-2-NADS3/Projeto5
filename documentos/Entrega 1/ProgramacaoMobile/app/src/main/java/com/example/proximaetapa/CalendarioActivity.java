package com.example.proximaetapa;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;


 //Tela de Agenda/Calendário do aluno
//A grade de dias do mês é fixa

public class CalendarioActivity extends AppCompatActivity {

    // Nomes dos 12 meses, usados para trocar o texto ao clicar em "<" e ">"
    private final String[] meses = {
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    };

    // mês exibido 8 = Setembro pois o array começa em 0 = Janeiro
    private int indiceMesAtual = 8;

    private TextView txtMes;
    private TextView txtTema;
    private TextView txtHorario;
    private TextView txtLocal;
    private TextView txtCargaHoraria;
    private Button btnMesAnterior;
    private Button btnProximoMes;
    private ImageButton btnNavPerfil;
    private ImageButton btnNavCalendario;
    private ImageButton btnNavInicio;
    private ImageButton btnNavMensagens;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_calendario);

        txtMes = findViewById(R.id.txtMes);
        txtTema = findViewById(R.id.txtTema);
        txtHorario = findViewById(R.id.txtHorario);
        txtLocal = findViewById(R.id.txtLocal);
        txtCargaHoraria = findViewById(R.id.txtCargaHoraria);
        btnMesAnterior = findViewById(R.id.btnMesAnterior);
        btnProximoMes = findViewById(R.id.btnProximoMes);
        btnNavPerfil = findViewById(R.id.btnNavPerfil);
        btnNavCalendario = findViewById(R.id.btnNavCalendario);
        btnNavInicio = findViewById(R.id.btnNavInicio);
        btnNavMensagens = findViewById(R.id.btnNavMensagens);

        // Cria o evento fixo no dia 14/Setembro usando a classe de modelo Evento
        Evento eventoDoDia = new Evento("Empreendedorismos", "Fecap", 13, 0, 17, 30);
        exibirEvento(eventoDoDia);

        // Mostra o mês inicial em cima
        atualizarTextoDoMes();

        // botões de navegação do mês
        btnMesAnterior.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                voltarMes();
            }
        });
        btnProximoMes.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                avancarMes();
            }
        });

        // Ícone de Perfil que volta para a tela de Perfil
        btnNavPerfil.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent irParaPerfil = new Intent(CalendarioActivity.this, PerfilActivity.class);
                irParaPerfil.putExtra("nomeUsuario", getIntent().getStringExtra("nomeUsuario"));
                startActivity(irParaPerfil);
            }
        });

        // icone de calendário (já estamos nesta tela, então não faz nada)
        btnNavCalendario.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // Tela atual - nenhuma navegação necessária
            }
        });

    }

    //Exibe os dados de um Evento nos TextViews da tela, incluindo a carga horária calculada.
    private void exibirEvento(Evento evento) {
        txtTema.setText("TEMA: " + evento.getTema());
        txtHorario.setText("HORÁRIO: " + evento.getHorarioFormatado());
        txtLocal.setText("LOCAL: " + evento.getLocal());
        txtCargaHoraria.setText("CARGA HORÁRIA: " + evento.getCargaHorariaEmHoras() + "h");
    }

    // Volta um mês no array de meses, voltando para Dezembro se estiver em Janeiro.
    private void voltarMes() {
        indiceMesAtual = (indiceMesAtual - 1 + meses.length) % meses.length;
        atualizarTextoDoMes();
    }

    //Avança um mês no array de meses, voltando para Janeiro se estiver em Dezembro.
    private void avancarMes() {
        indiceMesAtual = (indiceMesAtual + 1) % meses.length;
        atualizarTextoDoMes();
    }

    private void atualizarTextoDoMes() {
        txtMes.setText(meses[indiceMesAtual]);
    }
}
