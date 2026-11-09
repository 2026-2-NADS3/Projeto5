package com.example.proximaetapa.ui.adapter;

import android.content.Context;
import android.content.res.Resources;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

import com.example.proximaetapa.R;
import com.example.proximaetapa.data.local.entity.Evento;
import com.example.proximaetapa.domain.ResumoParticipacao;
import com.example.proximaetapa.ui.widget.BarraPercentual;
import com.example.proximaetapa.util.DateUtils;

public class ParticipacaoAdapter extends RecyclerView.Adapter<ParticipacaoAdapter.VH> {

    public static class Item {
        public final Evento evento;
        public final ResumoParticipacao resumo;
        public final boolean temCertificado;

        public Item(Evento evento, ResumoParticipacao resumo, boolean temCertificado) {
            this.evento = evento;
            this.resumo = resumo;
            this.temCertificado = temCertificado;
        }
    }

    public interface Listener {
        void aoAbrir(Evento evento);
    }

    private final List<Item> itens = new ArrayList<>();
    private final Listener listener;

    public ParticipacaoAdapter(Listener listener) {
        this.listener = listener;
    }

    public void setItens(List<Item> novos) {
        Diff.aplicar(this, itens, novos, i -> i.evento.id,
                i -> Diff.assinatura(i.resumo.presencas, i.resumo.faltas, i.resumo.futuros, i.temCertificado));
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        return new VH(LayoutInflater.from(parent.getContext()).inflate(R.layout.item_participacao, parent, false));
    }

    @Override
    public void onBindViewHolder(@NonNull VH h, int position) {
        Item it = itens.get(position);
        Evento e = it.evento;
        ResumoParticipacao r = it.resumo;
        Context ctx = h.itemView.getContext();
        Resources res = ctx.getResources();
        long agora = System.currentTimeMillis();
        boolean comecou = e.dataInicio <= agora;

        h.titulo.setText(e.titulo);
        h.periodo.setText(e.instituicao + " · " + DateUtils.data(e.dataInicio)
                + (DateUtils.mesmoDia(e.dataInicio, e.dataFim) ? "" : " a " + DateUtils.data(e.dataFim)));
        h.percentual.setText(comecou ? r.percentual + "%" : "–");
        BarraPercentual.definir(h.barra, comecou ? r.percentual : 0);

        h.numeros.setText(res.getQuantityString(R.plurals.presencas, r.presencas, r.presencas) + " · "
                + res.getQuantityString(R.plurals.faltas, r.faltas, r.faltas) + " · "
                + res.getQuantityString(R.plurals.encontros_futuros, r.futuros, r.futuros));

        String certificado;
        if (it.temCertificado) {
            certificado = ctx.getString(R.string.part_certificado_ok);
        } else if (!comecou) {
            certificado = ctx.getString(R.string.part_comeca_em, DateUtils.data(e.dataInicio));
        } else if (r.faltamParaCertificado > 0) {
            certificado = res.getQuantityString(R.plurals.part_faltam,
                    r.faltamParaCertificado, r.faltamParaCertificado);
        } else {
            certificado = ctx.getString(R.string.part_certificado_em_breve);
        }
        h.certificado.setText(certificado);

        h.itemView.setContentDescription(e.titulo + ". " + h.numeros.getText() + ". "
                + (comecou ? r.percentual + " por cento de presença. " : "") + certificado);
        h.itemView.setOnClickListener(v -> listener.aoAbrir(e));
    }

    @Override
    public int getItemCount() {
        return itens.size();
    }

    static class VH extends RecyclerView.ViewHolder {
        final TextView titulo, periodo, percentual, numeros, certificado;
        final View barra;

        VH(View v) {
            super(v);
            titulo = v.findViewById(R.id.txt_titulo);
            periodo = v.findViewById(R.id.txt_periodo);
            percentual = v.findViewById(R.id.txt_percentual);
            numeros = v.findViewById(R.id.txt_numeros);
            certificado = v.findViewById(R.id.txt_certificado);
            barra = v.findViewById(R.id.barra);
        }
    }
}
