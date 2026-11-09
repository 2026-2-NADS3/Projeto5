package com.example.proximaetapa.ui.convite;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ObjectAnimator;
import android.content.res.ColorStateList;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.TextView;

import com.google.android.material.card.MaterialCardView;

import java.time.Clock;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import com.example.proximaetapa.R;
import com.example.proximaetapa.data.local.entity.Evento;
import com.example.proximaetapa.data.local.entity.InscricaoComEvento;
import com.example.proximaetapa.data.local.entity.Presenca;
import com.example.proximaetapa.data.repository.AppRepository;
import com.example.proximaetapa.domain.CheckinValidator;
import com.example.proximaetapa.domain.IngressoQr;
import com.example.proximaetapa.domain.ParticipacaoCalculator;
import com.example.proximaetapa.ui.BaseActivity;
import com.example.proximaetapa.util.CapaUtils;
import com.example.proximaetapa.util.DateUtils;
import com.example.proximaetapa.util.QrUtils;
import com.example.proximaetapa.util.SessionManager;

public class ConviteActivity extends BaseActivity {

    public static final String EXTRA_INSCRICAO_ID = "inscricao_id";
    private static final long INTERVALO_SYNC_MS = 30_000L;
    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    private AppRepository repo;
    private InscricaoComEvento item;
    private List<Presenca> presencas;
    private boolean mostrandoVerso = false;
    private boolean presencasObservadas = false;
    private String qrGerado;
    private boolean qrDisponivel = false;

    private final CheckinValidator checkin = new CheckinValidator(Clock.systemDefaultZone());
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable sincronizarPeriodico = new Runnable() {
        @Override
        public void run() {
            repo.sincronizar(null);
            mostrarJanela();
            handler.postDelayed(this, INTERVALO_SYNC_MS);
        }
    };

    private MaterialCardView cardFrente, cardVerso;
    private ImageView imgQr;
    private TextView txtQrEstado, txtJanela, txtStatus, txtParticipacao;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_convite);
        configurarToolbar(R.string.convite_titulo);
        repo = AppRepository.get(this);

        cardFrente = findViewById(R.id.card_frente);
        cardVerso = findViewById(R.id.card_verso);
        imgQr = findViewById(R.id.img_qr);
        txtQrEstado = findViewById(R.id.txt_qr_estado);
        txtJanela = findViewById(R.id.txt_janela);
        txtStatus = findViewById(R.id.txt_status_presenca);
        txtParticipacao = findViewById(R.id.txt_participacao);

        float distancia = 8000 * getResources().getDisplayMetrics().density;
        cardFrente.setCameraDistance(distancia);
        cardVerso.setCameraDistance(distancia);
        cardFrente.setOnClickListener(v -> virarCartao());
        cardVerso.setOnClickListener(v -> virarCartao());

        String inscricaoId = getIntent().getStringExtra(EXTRA_INSCRICAO_ID);
        repo.ingresso(inscricaoId).observe(this, i -> {
            item = i;
            mostrarIngresso();
            observarPresencas();
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        handler.post(sincronizarPeriodico);
        aplicarBrilho();
    }

    @Override
    protected void onPause() {
        handler.removeCallbacks(sincronizarPeriodico);
        super.onPause();
    }

    private void observarPresencas() {
        if (presencasObservadas || item == null) return;
        presencasObservadas = true;
        repo.presencasDoEvento(item.inscricao.eventoId).observe(this, lista -> {
            presencas = lista;
            mostrarPresencas();
        });
    }

    private void mostrarIngresso() {
        if (item == null || item.evento == null) return;
        Evento e = item.evento;
        String nome = SessionManager.get(this).getNome();
        String quando = DateUtils.periodo(e.dataInicio, e.dataFim);
        ((TextView) findViewById(R.id.txt_convite)).setText(
                getString(R.string.convite_texto, nome, e.titulo, e.local, quando));
        ((TextView) findViewById(R.id.txt_verso_titulo)).setText(e.titulo);
        ((TextView) findViewById(R.id.txt_verso_quando)).setText(getString(R.string.ingresso_encontro, quando));

        int cor = CapaUtils.corDaInstituicao(e.instituicao);
        cardFrente.setCardBackgroundColor(cor);
        cardVerso.setStrokeColor(ColorStateList.valueOf(cor));

        TextView txtCodigo = findViewById(R.id.txt_codigo_ingresso);
        IngressoQr.Estado estado = IngressoQr.estado(item.inscricao, e);
        qrDisponivel = estado == IngressoQr.Estado.DISPONIVEL;
        if (qrDisponivel) {
            String conteudo = IngressoQr.conteudo(item.inscricao, e);
            if (!conteudo.equals(qrGerado)) {
                Bitmap qr = QrUtils.gerar(conteudo, 600);
                if (qr != null) imgQr.setImageBitmap(qr);
                qrGerado = conteudo;
            }
            imgQr.setVisibility(View.VISIBLE);
            txtQrEstado.setVisibility(View.GONE);
            txtCodigo.setText(item.inscricao.codigoIngresso);
            txtCodigo.setVisibility(View.VISIBLE);
        } else {
            imgQr.setImageDrawable(null);
            imgQr.setVisibility(View.INVISIBLE);
            qrGerado = null;
            txtQrEstado.setVisibility(View.VISIBLE);
            txtQrEstado.setText(estado == IngressoQr.Estado.SINCRONIZANDO
                    ? getString(R.string.ingresso_sincronizando) + "\n\n" + getString(R.string.ingresso_sincronizando_dica)
                    : getString(R.string.ingresso_indisponivel));
            txtCodigo.setVisibility(View.GONE);
        }
        aplicarBrilho();
        mostrarJanela();
        mostrarPresencas();
    }

    private void mostrarJanela() {
        if (item == null || item.evento == null) return;
        CheckinValidator.Resultado r = checkin.avaliar(item.evento);
        String texto;
        switch (r.situacao) {
            case NO_HORARIO:
                texto = getString(R.string.checkin_no_horario, r.fechaAs().format(HH_MM));
                break;
            case ANTES_DO_HORARIO:
                texto = getString(R.string.checkin_antes, r.abreAs().format(HH_MM));
                break;
            case ENCERRADO_HOJE:
                texto = getString(R.string.checkin_encerrado, r.fechaAs().format(HH_MM));
                break;
            case EVENTO_EXTERNO:
                texto = getString(R.string.checkin_externo);
                break;
            default:
                texto = getString(R.string.checkin_fora);
        }
        txtJanela.setText(texto);
        txtJanela.setVisibility(qrDisponivel || r.situacao == CheckinValidator.Situacao.EVENTO_EXTERNO
                ? View.VISIBLE : View.GONE);
    }

    private void mostrarPresencas() {
        if (item == null || item.evento == null) return;
        int total = item.evento.totalEncontros;
        int qtd = presencas == null ? 0 : presencas.size();
        txtParticipacao.setText(getString(R.string.participacao_evento,
                ParticipacaoCalculator.percentual(qtd, total), qtd, total));

        String hoje = LocalDate.now(CheckinValidator.FUSO).toString();
        Presenca deHoje = null;
        if (presencas != null) {
            for (Presenca p : presencas) {
                if (hoje.equals(p.dataEncontro)) deHoje = p;
            }
        }
        if (deHoje == null) {
            txtStatus.setVisibility(View.GONE);
        } else {
            txtStatus.setVisibility(View.VISIBLE);
            txtStatus.setText(getString(R.string.presenca_hoje_confirmada, DateUtils.hora(deHoje.registradoEm)));
        }
    }

    private void aplicarBrilho() {
        WindowManager.LayoutParams lp = getWindow().getAttributes();
        float desejado = qrDisponivel
                ? WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_FULL
                : WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE;
        if (lp.screenBrightness != desejado) {
            lp.screenBrightness = desejado;
            getWindow().setAttributes(lp);
        }
    }

    private void virarCartao() {
        View sai = mostrandoVerso ? cardVerso : cardFrente;
        View entra = mostrandoVerso ? cardFrente : cardVerso;
        ObjectAnimator meia = ObjectAnimator.ofFloat(sai, "rotationY", 0f, 90f);
        meia.setDuration(180);
        meia.addListener(new AnimatorListenerAdapter() {
            @Override
            public void onAnimationEnd(Animator animation) {
                sai.setVisibility(View.INVISIBLE);
                sai.setRotationY(0f);
                entra.setRotationY(-90f);
                entra.setVisibility(View.VISIBLE);
                ObjectAnimator.ofFloat(entra, "rotationY", -90f, 0f).setDuration(180).start();
            }
        });
        meia.start();
        mostrandoVerso = !mostrandoVerso;
    }
}
