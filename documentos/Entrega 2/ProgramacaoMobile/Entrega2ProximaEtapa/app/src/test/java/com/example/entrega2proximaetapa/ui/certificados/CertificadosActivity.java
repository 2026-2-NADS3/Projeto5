package com.example.proximaetapa.ui.certificados;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.TextView;

import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.snackbar.Snackbar;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.example.proximaetapa.R;
import com.example.proximaetapa.data.local.entity.Aluno;
import com.example.proximaetapa.data.local.entity.Certificado;
import com.example.proximaetapa.data.local.entity.Evento;
import com.example.proximaetapa.data.local.entity.Presenca;
import com.example.proximaetapa.data.local.entity.ResultadoTeste;
import com.example.proximaetapa.data.repository.AppRepository;
import com.example.proximaetapa.domain.ParticipacaoCalculator;
import com.example.proximaetapa.ui.BaseActivity;
import com.example.proximaetapa.ui.adapter.CertificadoAdapter;
import com.example.proximaetapa.util.CertificadoPdf;
import com.example.proximaetapa.util.DateUtils;

public class CertificadosActivity extends BaseActivity {

    private CertificadoAdapter adapter;
    private Aluno aluno;
    private List<Evento> eventos = new ArrayList<>();
    private List<Certificado> certificados = new ArrayList<>();
    private List<Presenca> presencas = new ArrayList<>();
    private String perfilDisc;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_certificados);
        configurarToolbar(R.string.menu_certificados);

        RecyclerView rv = findViewById(R.id.rv_certificados);
        rv.setLayoutManager(new GridLayoutManager(this, 2));
        adapter = new CertificadoAdapter(this::aoTocar);
        rv.setAdapter(adapter);

        AppRepository repo = AppRepository.get(this);
        repo.aluno().observe(this, a -> {
            aluno = a;
            atualizar();
        });
        repo.eventos().observe(this, l -> {
            eventos = l == null ? new ArrayList<>() : l;
            atualizar();
        });
        repo.certificados().observe(this, l -> {
            certificados = l == null ? new ArrayList<>() : l;
            atualizar();
        });
        repo.presencas().observe(this, l -> {
            presencas = l == null ? new ArrayList<>() : l;
            atualizar();
        });
        repo.resultadosTeste().observe(this, l -> {
            perfilDisc = null;
            if (l != null) {
                for (ResultadoTeste r : l) {
                    if ("DISC".equals(r.tipo)) {
                        perfilDisc = r.perfil;
                        break;
                    }
                }
            }
            atualizar();
        });
    }

    private void atualizar() {
        if (aluno != null) {
            ((TextView) findViewById(R.id.txt_avatar)).setText(aluno.iniciais());
            ((TextView) findViewById(R.id.txt_nome)).setText(getString(R.string.cert_nome, aluno.nome));
        }
        ((TextView) findViewById(R.id.txt_perfil)).setText(getString(R.string.cert_perfil,
                perfilDisc == null ? getString(R.string.cert_faca_teste) : perfilDisc));
        ((TextView) findViewById(R.id.txt_concluidos)).setText(
                getString(R.string.cert_concluidos, certificados.size()));

        Map<Long, Certificado> certPorEvento = new HashMap<>();
        for (Certificado c : certificados) certPorEvento.put(c.eventoId, c);
        Map<Long, Integer> presPorEvento = new HashMap<>();
        for (Presenca p : presencas) {
            Integer n = presPorEvento.get(p.eventoId);
            presPorEvento.put(p.eventoId, n == null ? 1 : n + 1);
        }

        List<CertificadoAdapter.Item> itens = new ArrayList<>();
        for (Evento e : eventos) {
            Certificado c = certPorEvento.get(e.id);
            if (!e.isCurso() && c == null) continue;
            Integer p = presPorEvento.get(e.id);
            itens.add(new CertificadoAdapter.Item(e, c, p == null ? 0 : p));
        }
        Collections.sort(itens, (a, b) -> {
            boolean ca = a.certificado != null, cb = b.certificado != null;
            if (ca != cb) return ca ? -1 : 1;
            return a.evento.instituicao.compareTo(b.evento.instituicao);
        });
        adapter.setItens(itens);
    }

    private void aoTocar(CertificadoAdapter.Item item) {
        if (item.certificado == null) {
            Evento e = item.evento;
            int faltam = ParticipacaoCalculator.presencasFaltantes(item.presencas, e.totalEncontros);
            String msg = getString(R.string.cert_bloqueado, ParticipacaoCalculator.PERCENTUAL_MINIMO_CERTIFICADO,
                    item.presencas, e.totalEncontros, faltam);
            new MaterialAlertDialogBuilder(this)
                    .setTitle(e.titulo)
                    .setMessage(msg)
                    .setPositiveButton(R.string.ok, null)
                    .show();
            return;
        }
        Certificado c = item.certificado;
        String info = getString(R.string.cert_info, c.instituicao, c.cargaHoraria,
                DateUtils.data(c.dataEmissao), c.codigoValidacao);
        new MaterialAlertDialogBuilder(this)
                .setTitle(c.titulo)
                .setMessage(info)
                .setNeutralButton(R.string.compartilhar, (d, w) -> gerar(c, Acao.COMPARTILHAR))
                .setNegativeButton(R.string.visualizar, (d, w) -> gerar(c, Acao.VISUALIZAR))
                .setPositiveButton(R.string.baixar, (d, w) -> gerar(c, Acao.BAIXAR))
                .show();
    }

    private enum Acao { VISUALIZAR, BAIXAR, COMPARTILHAR }

    private void gerar(Certificado c, Acao acao) {
        String nome = aluno == null ? "" : aluno.nome;
        new Thread(() -> {
            try {
                Uri uri = acao == Acao.BAIXAR
                        ? CertificadoPdf.baixar(this, c, nome)
                        : CertificadoPdf.gerarParaVisualizar(this, c, nome);
                runOnUiThread(() -> aposGerar(uri, acao));
            } catch (Exception e) {
                runOnUiThread(() -> Snackbar.make(findViewById(R.id.rv_certificados),
                        R.string.cert_erro_pdf, Snackbar.LENGTH_LONG).show());
            }
        }).start();
    }

    private void aposGerar(Uri uri, Acao acao) {
        if (acao == Acao.BAIXAR) {
            Snackbar.make(findViewById(R.id.rv_certificados), R.string.cert_baixado, Snackbar.LENGTH_LONG)
                    .setAction(R.string.abrir, v -> abrirPdf(uri))
                    .show();
        } else if (acao == Acao.VISUALIZAR) {
            abrirPdf(uri);
        } else {
            Intent enviar = new Intent(Intent.ACTION_SEND)
                    .setType("application/pdf")
                    .putExtra(Intent.EXTRA_STREAM, uri)
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(Intent.createChooser(enviar, getString(R.string.compartilhar)));
        }
    }

    private void abrirPdf(Uri uri) {
        Intent ver = new Intent(Intent.ACTION_VIEW)
                .setDataAndType(uri, "application/pdf")
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try {
            startActivity(ver);
        } catch (ActivityNotFoundException e) {
            Snackbar.make(findViewById(R.id.rv_certificados), R.string.sem_leitor_pdf, Snackbar.LENGTH_LONG).show();
        }
    }
}
