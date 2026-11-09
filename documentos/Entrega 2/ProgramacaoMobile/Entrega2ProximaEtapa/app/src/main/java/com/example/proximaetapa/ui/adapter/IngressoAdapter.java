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
import com.example.proximaetapa.data.local.entity.InscricaoComEvento;
import com.example.proximaetapa.domain.IngressoQr;
import com.example.proximaetapa.util.CapaUtils;
import com.example.proximaetapa.util.DateUtils;

public class IngressoAdapter extends RecyclerView.Adapter<IngressoAdapter.VH> {

    public interface Listener {
        void aoAbrir(InscricaoComEvento item);

        void aoCancelar(InscricaoComEvento item);
    }

    private final List<InscricaoComEvento> itens = new ArrayList<>();
    private final Listener listener;

    public IngressoAdapter(Listener listener) {
        this.listener = listener;
    }

    public void setItens(List<InscricaoComEvento> novos) {
        Diff.aplicar(this, itens, novos, i -> i.inscricao.id,
                i -> Diff.assinatura(i.inscricao.sincronizado, i.inscricao.status,
                        i.evento == null ? "" : i.evento.titulo + i.evento.dataInicio + i.evento.local));
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        return new VH(LayoutInflater.from(parent.getContext()).inflate(R.layout.item_ingresso, parent, false));
    }

    @Override
    public void onBindViewHolder(@NonNull VH h, int position) {
        InscricaoComEvento it = itens.get(position);
        if (it.evento == null) return;
        float raio = 14 * h.itemView.getResources().getDisplayMetrics().density;
        CapaUtils.aplicar(h.capa, h.txtCapa, it.evento.instituicao, raio);
        h.titulo.setText(it.evento.titulo);
        h.quando.setText(DateUtils.periodo(it.evento.dataInicio, it.evento.dataFim));
        IngressoQr.Estado estado = IngressoQr.estado(it.inscricao, it.evento);
        String status = estado == IngressoQr.Estado.DISPONIVEL
                ? "Ingresso " + it.inscricao.codigoIngresso
                : h.itemView.getContext().getString(estado == IngressoQr.Estado.SINCRONIZANDO
                        ? R.string.ingresso_sincronizando : R.string.ingresso_indisponivel);
        h.status.setText(status);
        h.abrir.setOnClickListener(v -> listener.aoAbrir(it));
        h.cancelar.setOnClickListener(v -> listener.aoCancelar(it));
        h.abrir.setContentDescription("Abrir convite de " + it.evento.titulo);
        h.cancelar.setContentDescription("Cancelar inscrição em " + it.evento.titulo);
    }

    @Override
    public int getItemCount() {
        return itens.size();
    }

    static class VH extends RecyclerView.ViewHolder {
        final View capa, abrir, cancelar;
        final TextView txtCapa, titulo, quando, status;

        VH(View v) {
            super(v);
            capa = v.findViewById(R.id.capa);
            txtCapa = v.findViewById(R.id.txt_capa);
            titulo = v.findViewById(R.id.txt_titulo);
            quando = v.findViewById(R.id.txt_quando);
            status = v.findViewById(R.id.txt_status);
            abrir = v.findViewById(R.id.btn_abrir);
            cancelar = v.findViewById(R.id.btn_cancelar);
        }
    }
}
