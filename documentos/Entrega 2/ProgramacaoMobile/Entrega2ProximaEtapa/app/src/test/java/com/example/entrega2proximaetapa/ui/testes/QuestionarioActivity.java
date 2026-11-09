package com.example.proximaetapa.ui.testes;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.card.MaterialCardView;
import com.google.android.material.radiobutton.MaterialRadioButton;
import com.google.android.material.snackbar.Snackbar;
import com.google.gson.Gson;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.example.proximaetapa.R;
import com.example.proximaetapa.data.local.entity.ResultadoTeste;
import com.example.proximaetapa.data.repository.AppRepository;
import com.example.proximaetapa.data.repository.TesteRepository;
import com.example.proximaetapa.domain.teste.TesteDefinicao;
import com.example.proximaetapa.domain.teste.TesteScorer;
import com.example.proximaetapa.ui.BaseActivity;
import com.example.proximaetapa.ui.widget.BarraPercentual;

public class QuestionarioActivity extends BaseActivity {

    public static final String EXTRA_TESTE_ID = "teste_id";
    private static final String ESTADO_RESPOSTAS = "respostas";
    private static final String ESTADO_ATUAL = "atual";

    private TesteDefinicao teste;
    private int[] respostas;
    private int atual = 0;

    private TextView txtPergunta, txtContador;
    private View progresso;
    private MaterialButton btnVoltar, btnProxima;
    private final OpcaoAdapter opcaoAdapter = new OpcaoAdapter();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_questionario);

        teste = TesteRepository.buscar(this, getIntent().getStringExtra(EXTRA_TESTE_ID));
        if (teste == null) {
            finish();
            return;
        }
        configurarToolbar(teste.titulo);

        respostas = new int[teste.perguntas.size()];
        Arrays.fill(respostas, -1);
        if (savedInstanceState != null) {
            int[] salvas = savedInstanceState.getIntArray(ESTADO_RESPOSTAS);
            if (salvas != null && salvas.length == respostas.length) respostas = salvas;
            atual = savedInstanceState.getInt(ESTADO_ATUAL, 0);
        }

        txtPergunta = findViewById(R.id.txt_pergunta);
        txtContador = findViewById(R.id.txt_contador);
        progresso = findViewById(R.id.progresso);
        btnVoltar = findViewById(R.id.btn_anterior);
        btnProxima = findViewById(R.id.btn_proxima);
        ((TextView) findViewById(R.id.txt_instrucao)).setText(teste.instrucao);
        ((RecyclerView) findViewById(R.id.rv_opcoes)).setAdapter(opcaoAdapter);

        btnVoltar.setOnClickListener(v -> {
            if (atual > 0) {
                atual--;
                mostrarPergunta();
            } else {
                finish();
            }
        });
        btnProxima.setOnClickListener(v -> avancar());
        mostrarPergunta();
    }

    @Override
    protected void onSaveInstanceState(@NonNull Bundle outState) {
        super.onSaveInstanceState(outState);
        outState.putIntArray(ESTADO_RESPOSTAS, respostas);
        outState.putInt(ESTADO_ATUAL, atual);
    }

    private void mostrarPergunta() {
        TesteDefinicao.Pergunta p = teste.perguntas.get(atual);
        int total = teste.perguntas.size();
        txtPergunta.setText(p.texto);
        txtContador.setText(getString(R.string.pergunta_x_de_y, atual + 1, total));
        BarraPercentual.definir(progresso, (atual + 1) * 100 / total);
        btnVoltar.setText(atual == 0 ? R.string.sair : R.string.voltar);
        btnProxima.setText(atual == total - 1 ? R.string.ver_resultado : R.string.proxima);
        opcaoAdapter.mostrar(p.alternativas);
    }

    private void avancar() {
        if (respostas[atual] < 0) {
            Snackbar.make(btnProxima, R.string.escolha_uma_opcao, Snackbar.LENGTH_SHORT).show();
            return;
        }
        if (atual < teste.perguntas.size() - 1) {
            atual++;
            mostrarPergunta();
            return;
        }
        concluir();
    }

    private void concluir() {
        Map<String, Integer> pontos = TesteScorer.pontuar(teste, respostas);
        int qtd = "RIASEC".equals(teste.id) ? 2 : 1;
        List<String> principais = TesteScorer.principais(pontos, qtd);

        StringBuilder codigo = new StringBuilder();
        StringBuilder nomes = new StringBuilder();
        for (String dim : principais) {
            codigo.append(dim);
            if (nomes.length() > 0) nomes.append(" / ");
            TesteDefinicao.PerfilResultado pr = teste.perfis.get(dim);
            nomes.append(pr == null ? dim : pr.nome);
        }

        ResultadoTeste r = new ResultadoTeste();
        r.id = UUID.randomUUID().toString();
        r.tipo = teste.id;
        r.codigo = codigo.toString();
        r.perfil = nomes.toString();
        r.pontuacoesJson = new Gson().toJson(pontos);
        r.data = System.currentTimeMillis();

        btnProxima.setEnabled(false);
        AppRepository.get(this).salvarResultadoTeste(r, new AppRepository.Callback<ResultadoTeste>() {
            @Override
            public void sucesso(ResultadoTeste salvo) {
                Intent i = new Intent(QuestionarioActivity.this, ResultadoTesteActivity.class);
                i.putExtra(ResultadoTesteActivity.EXTRA_RESULTADO_ID, salvo.id);
                startActivity(i);
                finish();
            }

            @Override
            public void erro(String mensagem) {
                btnProxima.setEnabled(true);
                Snackbar.make(btnProxima, mensagem, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private class OpcaoAdapter extends RecyclerView.Adapter<OpcaoAdapter.VH> {

        private List<TesteDefinicao.Alternativa> alternativas;

        void mostrar(List<TesteDefinicao.Alternativa> novas) {
            alternativas = novas;
            notifyDataSetChanged();
        }

        @NonNull
        @Override
        public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            return new VH(LayoutInflater.from(parent.getContext()).inflate(R.layout.item_opcao, parent, false));
        }

        @Override
        public void onBindViewHolder(@NonNull VH h, int position) {
            boolean marcada = respostas[atual] == position;
            String texto = alternativas.get(position).texto;
            h.texto.setText(texto);
            h.radio.setChecked(marcada);
            h.card.setChecked(marcada);
            h.card.setStrokeColor(ContextCompat.getColor(h.itemView.getContext(),
                    marcada ? R.color.pe_roxo : R.color.pe_borda));
            h.card.setStrokeWidth((int) ((marcada ? 2 : 1) * h.itemView.getResources().getDisplayMetrics().density));
            h.card.setContentDescription(texto + (marcada ? ", selecionada" : ", não selecionada"));
            h.card.setOnClickListener(v -> {
                int pos = h.getBindingAdapterPosition();
                if (pos == RecyclerView.NO_POSITION) return;
                respostas[atual] = pos;
                notifyDataSetChanged();
            });
        }

        @Override
        public int getItemCount() {
            return alternativas == null ? 0 : alternativas.size();
        }

        class VH extends RecyclerView.ViewHolder {
            final MaterialCardView card;
            final MaterialRadioButton radio;
            final TextView texto;

            VH(View v) {
                super(v);
                card = v.findViewById(R.id.card);
                radio = v.findViewById(R.id.rb_opcao);
                texto = v.findViewById(R.id.txt_opcao);
            }
        }
    }
}
