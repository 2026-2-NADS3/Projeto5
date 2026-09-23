package com.example.proximaetapa;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

/**
 * Tela de Agenda/Calendário do aluno — a "função principal" desta etapa
 * (RFM05: exibir agenda individual com cursos, encontros e atividades).
 *
 * A grade de dias do mês é fixa nesta etapa (mostra Setembro/2026, como no
 * protótipo), mas o nome do mês exibido em cima da grade é dinâmico: os
 * botões "<" e ">" percorrem um vetor (array) com os 12 meses do ano,
 * usando o mesmo tipo de lógica com arrays visto em aula (ex: JoKenPo).
 *
 * O evento do dia 14 vem de um objeto Evento (classe de modelo), que também
 * calcula a carga horária (dado numérico) a partir dos horários de início e fim.
 */
public class CalendarioActivity extends AppCompatActivity {

    // Nomes dos 12 meses, usados para trocar o texto ao clicar em "<" e ">"
    private final String[] meses = {
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    };

    // Índice do mês exibido no momento (8 = Setembro, pois o array começa em 0 = Janeiro)
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

        // Ligação das variáveis Java com os componentes do XML
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

        // Cria o evento fixo do dia 14/Setembro usando a classe de modelo Evento
        Evento eventoDoDia = new Evento("Empreendedorismos", "Fecap", 13, 0, 17, 30);
        exibirEvento(eventoDoDia);

        // Mostra o mês inicial (Setembro) no topo da grade
        atualizarTextoDoMes();

        // Botões de navegação de mês (usam arrays + módulo, sem inventar nada novo)
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

        // Ícone de Perfil na barra inferior -> volta para a tela de Perfil
        btnNavPerfil.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent irParaPerfil = new Intent(CalendarioActivity.this, PerfilActivity.class);
                irParaPerfil.putExtra("nomeUsuario", getIntent().getStringExtra("nomeUsuario"));
                startActivity(irParaPerfil);
            }
        });

        // Ícone de calendário: já estamos nesta tela, então não faz nada
        btnNavCalendario.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // Tela atual - nenhuma navegação necessária
            }
        });

        // Reservados para a Entrega 2 (Início / Mensagens), assim como na tela de Perfil
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

    /** Exibe os dados de um Evento nos TextViews da tela, incluindo a carga horária calculada. */
    private void exibirEvento(Evento evento) {
        txtTema.setText("TEMA: " + evento.getTema());
        txtHorario.setText("HORÁRIO: " + evento.getHorarioFormatado());
        txtLocal.setText("LOCAL: " + evento.getLocal());
        txtCargaHoraria.setText("CARGA HORÁRIA: " + evento.getCargaHorariaEmHoras() + "h");
    }

    /** Volta um mês no array de meses, voltando para Dezembro se estiver em Janeiro. */
    private void voltarMes() {
        indiceMesAtual = (indiceMesAtual - 1 + meses.length) % meses.length;
        atualizarTextoDoMes();
    }

    /** Avança um mês no array de meses, voltando para Janeiro se estiver em Dezembro. */
    private void avancarMes() {
        indiceMesAtual = (indiceMesAtual + 1) % meses.length;
        atualizarTextoDoMes();
    }

    private void atualizarTextoDoMes() {
        txtMes.setText(meses[indiceMesAtual]);
    }
}
