package com.example.proximaetapa.ui.evento;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.CalendarContract;
import android.view.View;
import android.widget.TextView;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.snackbar.Snackbar;

import java.util.HashSet;
import java.util.Set;

import com.example.proximaetapa.R;
import com.example.proximaetapa.data.local.entity.Bolsa;
import com.example.proximaetapa.data.local.entity.Evento;
import com.example.proximaetapa.data.local.entity.Inscricao;
import com.example.proximaetapa.data.local.entity.ResultadoTeste;
import com.example.proximaetapa.data.repository.AppRepository;
import com.example.proximaetapa.domain.ParticipacaoCalculator;
import com.example.proximaetapa.ui.BaseActivity;
import com.example.proximaetapa.ui.convite.ConviteActivity;
import com.example.proximaetapa.ui.testes.TestesActivity;
import com.example.proximaetapa.util.CapaUtils;
import com.example.proximaetapa.util.DateUtils;

public class EventoDetalheActivity extends BaseActivity {

    public static final String EXTRA_EVENTO_ID = "evento_id";
    public static final String EXTRA_BOLSA_ID = "bolsa_id";

    private AppRepository repo;
    private Evento evento;
    private Inscricao inscricao;
    private int presencasNoEvento;
    private int testesConcluidos;

    private TextView txtTipo, txtTitulo, txtLocal, txtData, txtDescricao, txtAviso;
    private ChipGroup chipsMeta;
    private MaterialButton btnPrincipal, btnSecundario;
    private View progresso;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_evento_detalhe);
        repo = AppRepository.get(this);

        txtTipo = findViewById(R.id.txt_tipo);
        txtTitulo = findViewById(R.id.txt_titulo);
        txtLocal = findViewById(R.id.txt_local);
        txtData = findViewById(R.id.txt_data);
        txtDescricao = findViewById(R.id.txt_descricao);
        txtAviso = findViewById(R.id.txt_aviso);
        chipsMeta = findViewById(R.id.chips_meta);
        btnPrincipal = findViewById(R.id.btn_principal);
        btnSecundario = findViewById(R.id.btn_secundario);
        progresso = findViewById(R.id.progresso);

        long bolsaId = getIntent().getLongExtra(EXTRA_BOLSA_ID, -1);
        if (bolsaId > 0) {
            configurarToolbar(R.string.detalhe_bolsa);
            repo.bolsa(bolsaId).observe(this, this::mostrarBolsa);
            return;
        }

        long eventoId = getIntent().getLongExtra(EXTRA_EVENTO_ID, -1);
        configurarToolbar(R.string.detalhe_evento);
        repo.evento(eventoId).observe(this, e -> {
            evento = e;
            atualizarEvento();
        });
        repo.inscricaoDoEvento(eventoId).observe(this, i -> {
            inscricao = i;
            atualizarEvento();
        });
        repo.presencasDoEvento(eventoId).observe(this, lista -> {
            presencasNoEvento = lista == null ? 0 : lista.size();
            atualizarEvento();
        });
        repo.resultadosTeste().observe(this, lista -> {
            Set<String> tipos = new HashSet<>();
            if (lista != null) for (ResultadoTeste r : lista) tipos.add(r.tipo);
            testesConcluidos = tipos.size();
            atualizarEvento();
        });
    }

    private void atualizarEvento() {
        if (evento == null) return;
        Evento e = evento;
        long agora = System.currentTimeMillis();
        boolean inscrito = inscricao != null && Inscricao.ATIVA.equals(inscricao.status);

        CapaUtils.aplicar(findViewById(R.id.capa), findViewById(R.id.txt_capa), e.instituicao, 0);
        txtTipo.setText(e.isExterno() ? "EVENTO EXTERNO" : e.isCurso() ? "CURSO" : "PALESTRA");
        txtTitulo.setText(e.titulo);
        txtLocal.setText(e.local);
        txtData.setText(DateUtils.periodo(e.dataInicio, e.dataFim));
        txtDescricao.setText(e.descricao);

        chipsMeta.removeAllViews();
        if (!e.isExterno()) {
            adicionarChip(getString(R.string.meta_carga, e.cargaHoraria));
            adicionarChip(getResources().getQuantityString(R.plurals.encontros, e.totalEncontros, e.totalEncontros));
            if (inscrito) {
                int pct = ParticipacaoCalculator.percentual(presencasNoEvento, e.totalEncontros);
                adicionarChip(getString(R.string.meta_participacao, pct, presencasNoEvento, e.totalEncontros));
            }
        } else {
            adicionarChip(e.instituicao);
        }

        txtAviso.setVisibility(View.GONE);
        btnSecundario.setVisibility(View.VISIBLE);
        btnSecundario.setText(R.string.adicionar_agenda_celular);
        btnSecundario.setOnClickListener(v -> adicionarNaAgendaDoCelular(e));
        btnPrincipal.setEnabled(true);
        btnPrincipal.setIcon(null);
        findViewById(R.id.txt_externo).setVisibility(e.isExterno() ? View.VISIBLE : View.GONE);

        if (e.isExterno()) {
            btnPrincipal.setText(R.string.acessar_site_oficial);
            btnPrincipal.setIconResource(R.drawable.ic_abrir_externo);
            btnPrincipal.setOnClickListener(v -> abrirLink(e.linkExterno));
        } else if (inscrito) {
            btnPrincipal.setText(R.string.ver_convite);
            btnPrincipal.setIconResource(R.drawable.ic_qrcode);
            btnPrincipal.setOnClickListener(v -> abrirConvite(inscricao.id));
        } else if (e.jaTerminou(agora)) {
            btnPrincipal.setText(R.string.evento_encerrado);
            btnPrincipal.setEnabled(false);
            btnSecundario.setVisibility(View.GONE);
        } else if (e.requerTestes && testesConcluidos < 2) {
            txtAviso.setText(R.string.aviso_requer_testes);
            txtAviso.setVisibility(View.VISIBLE);
            btnPrincipal.setText(R.string.fazer_testes_perfil);
            btnPrincipal.setOnClickListener(v -> startActivity(new Intent(this, TestesActivity.class)));
        } else {
            btnPrincipal.setText(R.string.inscreva_se);
            btnPrincipal.setOnClickListener(v -> confirmarInscricao(e));
        }
    }

    private void confirmarInscricao(Evento e) {
        new MaterialAlertDialogBuilder(this)
                .setTitle(getString(R.string.confirmar_inscricao_titulo, e.titulo))
                .setMessage(R.string.confirmar_inscricao_msg)
                .setNegativeButton(R.string.cancelar, null)
                .setPositiveButton(R.string.confirmar, (d, w) -> inscrever(e))
                .show();
    }

    private void inscrever(Evento e) {
        progresso.setVisibility(View.VISIBLE);
        btnPrincipal.setEnabled(false);
        repo.inscrever(e, new AppRepository.Callback<Inscricao>() {
            @Override
            public void sucesso(Inscricao i) {
                progresso.setVisibility(View.GONE);
                btnPrincipal.setEnabled(true);
                abrirConvite(i.id);
            }

            @Override
            public void erro(String mensagem) {
                progresso.setVisibility(View.GONE);
                btnPrincipal.setEnabled(true);
                Snackbar.make(btnPrincipal, mensagem, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private void abrirConvite(String inscricaoId) {
        Intent i = new Intent(this, ConviteActivity.class);
        i.putExtra(ConviteActivity.EXTRA_INSCRICAO_ID, inscricaoId);
        startActivity(i);
    }

    private void adicionarNaAgendaDoCelular(Evento e) {
        Intent i = new Intent(Intent.ACTION_INSERT)
                .setData(CalendarContract.Events.CONTENT_URI)
                .putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, e.dataInicio)
                .putExtra(CalendarContract.EXTRA_EVENT_END_TIME, e.dataFim)
                .putExtra(CalendarContract.Events.TITLE, e.titulo)
                .putExtra(CalendarContract.Events.EVENT_LOCATION, e.local)
                .putExtra(CalendarContract.Events.DESCRIPTION, e.descricao);
        try {
            startActivity(i);
        } catch (ActivityNotFoundException ex) {
            Snackbar.make(btnPrincipal, R.string.sem_app_agenda, Snackbar.LENGTH_LONG).show();
        }
    }

    private void mostrarBolsa(Bolsa b) {
        if (b == null) return;
        CapaUtils.aplicar(findViewById(R.id.capa), findViewById(R.id.txt_capa), b.instituicao, 0);
        txtTipo.setText(b.internacional ? "BOLSA INTERNACIONAL" : "BOLSA DE ESTUDO");
        txtTitulo.setText(b.nome);
        txtLocal.setText(b.instituicao);
        txtData.setText(getString(R.string.prazo, b.prazo));
        txtDescricao.setText(b.descricao);
        chipsMeta.removeAllViews();
        adicionarChip(b.duracao);

        TextView titReq = findViewById(R.id.txt_requisitos_titulo);
        TextView req = findViewById(R.id.txt_requisitos);
        titReq.setVisibility(View.VISIBLE);
        req.setVisibility(View.VISIBLE);
        req.setText(b.requisitos);
        findViewById(R.id.txt_externo).setVisibility(View.VISIBLE);

        btnPrincipal.setText(R.string.acessar_site_oficial);
        btnPrincipal.setIconResource(R.drawable.ic_abrir_externo);
        btnPrincipal.setOnClickListener(v -> abrirLink(b.link));
        btnSecundario.setVisibility(View.GONE);
    }

    private void adicionarChip(String texto) {
        Chip c = new Chip(this);
        c.setText(texto);
        c.setClickable(false);
        chipsMeta.addView(c);
    }

    private void abrirLink(String url) {
        if (url == null || url.isEmpty()) return;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        } catch (ActivityNotFoundException e) {
            Snackbar.make(btnPrincipal, R.string.sem_navegador, Snackbar.LENGTH_LONG).show();
        }
    }
}
