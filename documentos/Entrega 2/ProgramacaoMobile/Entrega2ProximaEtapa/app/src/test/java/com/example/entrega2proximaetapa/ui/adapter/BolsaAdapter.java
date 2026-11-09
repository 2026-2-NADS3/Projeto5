package com.example.proximaetapa.ui.adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

import com.example.proximaetapa.R;
import com.example.proximaetapa.data.local.entity.Bolsa;
import com.example.proximaetapa.util.CapaUtils;

public class BolsaAdapter extends RecyclerView.Adapter<BolsaAdapter.VH> {

    public interface Listener {
        void aoAbrir(Bolsa bolsa);
    }

    private final List<Bolsa> itens = new ArrayList<>();
    private final Listener listener;

    public BolsaAdapter(Listener listener) {
        this.listener = listener;
    }

    public void setItens(List<Bolsa> novas) {
        Diff.aplicar(this, itens, novas, b -> b.id, b -> Diff.assinatura(b.nome, b.duracao, b.instituicao));
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        return new VH(LayoutInflater.from(parent.getContext()).inflate(R.layout.item_bolsa, parent, false));
    }

    @Override
    public void onBindViewHolder(@NonNull VH h, int position) {
        Bolsa b = itens.get(position);
        float raio = 20 * h.itemView.getResources().getDisplayMetrics().density;
        CapaUtils.aplicar(h.capa, h.txtCapa, b.instituicao, raio);
        h.nome.setText(b.nome);
        h.duracao.setText(b.duracao);
        h.itemView.setContentDescription(b.nome + ", " + b.duracao);
        h.itemView.setOnClickListener(v -> listener.aoAbrir(b));
    }

    @Override
    public int getItemCount() {
        return itens.size();
    }

    static class VH extends RecyclerView.ViewHolder {
        final View capa;
        final TextView txtCapa, nome, duracao;

        VH(View v) {
            super(v);
            capa = v.findViewById(R.id.capa);
            txtCapa = v.findViewById(R.id.txt_capa);
            nome = v.findViewById(R.id.txt_nome);
            duracao = v.findViewById(R.id.txt_duracao);
        }
    }
}
