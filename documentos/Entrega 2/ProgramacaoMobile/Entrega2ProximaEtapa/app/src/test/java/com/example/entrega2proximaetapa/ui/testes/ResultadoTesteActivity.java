package com.example.proximaetapa.ui.testes;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.example.proximaetapa.R;
import com.example.proximaetapa.data.local.entity.ResultadoTeste;
import com.example.proximaetapa.data.repository.AppRepository;
import com.example.proximaetapa.data.repository.TesteRepository;
import com.example.proximaetapa.domain.teste.TesteDefinicao;
import com.example.proximaetapa.ui.BaseActivity;
import com.example.proximaetapa.ui.widget.BarraPercentual;

public class ResultadoTesteActivity extends BaseActivity {

    public static final String EXTRA_RESULTADO_ID = "resultado_id";

    private final PontuacaoAdapter pontuacaoAdapter = new PontuacaoAdapter();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_resultado_teste);
        configurarToolbar(R.string.resultado_titulo);
        findViewById(R.id.btn_concluir).setOnClickListener(v -> finish());
        ((RecyclerView) findViewById(R.id.rv_pontuacao)).setAdapter(pontuacaoAdapter);

        String id = getIntent().getStringExtra(EXTRA_RESULTADO_ID);
        AppRepository.get(this).resultadoTeste(id).observe(this, this::mostrar);
    }

    private void mostrar(ResultadoTeste r) {
        if (r == null) return;
        TesteDefinicao def = TesteRepository.buscar(this, r.tipo);
        if (def == null) return;

        ((TextView) findViewById(R.id.txt_tipo)).setText(
                "DISC".equals(r.tipo) ? R.string.resultado_disc : R.string.resultado_riasec);
        ((TextView) findViewById(R.id.txt_perfil)).setText(r.perfil);

        StringBuilder descricoes = new StringBuilder();
        ChipGroup chips = findViewById(R.id.chips_sugestoes);
        chips.removeAllViews();
        for (char c : r.codigo.toCharArray()) {
            TesteDefinicao.PerfilResultado pr = def.perfis.get(String.valueOf(c));
            if (pr == null) continue;
            if (descricoes.length() > 0) descricoes.append("\n\n");
            descricoes.append(pr.nome).append(": ").append(pr.descricao);
            for (String s : pr.sugestoes) {
                Chip chip = new Chip(this);
                chip.setText(s);
                chip.setClickable(false);
                chips.addView(chip);
            }
        }
        ((TextView) findViewById(R.id.txt_descricoes)).setText(descricoes.toString());

        Type tipo = new TypeToken<LinkedHashMap<String, Integer>>() {
        }.getType();
        Map<String, Integer> pontos = new Gson().fromJson(r.pontuacoesJson, tipo);
        int max = 0;
        for (Integer v : pontos.values()) max = Math.max(max, v);

        List<String[]> linhas = new ArrayList<>();
        for (Map.Entry<String, Integer> e : pontos.entrySet()) {
            TesteDefinicao.PerfilResultado pr = def.perfis.get(e.getKey());
            String nome = pr == null ? e.getKey() : pr.nome;
            int pct = max == 0 ? 0 : e.getValue() * 100 / max;
            linhas.add(new String[]{nome, String.valueOf(e.getValue()), String.valueOf(pct)});
        }
        pontuacaoAdapter.setLinhas(linhas);
    }

    private static class PontuacaoAdapter extends RecyclerView.Adapter<PontuacaoAdapter.VH> {

        private final List<String[]> linhas = new ArrayList<>();

        void setLinhas(List<String[]> novas) {
            linhas.clear();
            linhas.addAll(novas);
            notifyDataSetChanged();
        }

        @NonNull
        @Override
        public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            return new VH(LayoutInflater.from(parent.getContext()).inflate(R.layout.item_pontuacao, parent, false));
        }

        @Override
        public void onBindViewHolder(@NonNull VH h, int position) {
            String[] l = linhas.get(position);
            h.dimensao.setText(l[0] + " (" + l[1] + ")");
            BarraPercentual.definir(h.barra, Integer.parseInt(l[2]));
            h.itemView.setContentDescription(l[0] + ": " + l[1] + " pontos");
        }

        @Override
        public int getItemCount() {
            return linhas.size();
        }

        static class VH extends RecyclerView.ViewHolder {
            final TextView dimensao;
            final View barra;

            VH(View v) {
                super(v);
                dimensao = v.findViewById(R.id.txt_dimensao);
                barra = v.findViewById(R.id.barra);
            }
        }
    }
}
