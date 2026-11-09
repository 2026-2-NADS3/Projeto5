package com.example.proximaetapa.ui.adapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.button.MaterialButton;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;

import com.example.proximaetapa.R;
import com.example.proximaetapa.data.local.entity.Evento;
import com.example.proximaetapa.domain.ResumoParticipacao;
import com.example.proximaetapa.util.CapaUtils;
import com.example.proximaetapa.util.DateUtils;

public class CursoAdapter extends RecyclerView.Adapter<CursoAdapter.VH> {

    public interface Listener {
        void aoAbrir(Evento evento);
    }

    private static final class Linha {
        final Evento evento;
        final boolean inscrito;
        final int presencas;

        Linha(Evento evento, boolean inscrito, int presencas) {
            this.evento = evento;
            this.inscrito = inscrito;
            this.presencas = presencas;
        }
    }

    private final List<Linha> itens = new ArrayList<>();
    private final Listener listener;

    public CursoAdapter(Listener listener) {
        this.listener = listener;
    }

    public void setItens(List<Evento> eventos, Set<Long> idsInscritos, Map<Long, Integer> presencasPorEvento) {
        List<Linha> novas = new ArrayList<>();
        if (eventos != null) {
            for (Evento e : eventos) {
                Integer p = presencasPorEvento == null ? null : presencasPorEvento.get(e.id);
                novas.add(new Linha(e, idsInscritos != null && idsInscritos.contains(e.id), p == null ? 0 : p));
            }
        }
        Diff.aplicar(this, itens, novas, l -> l.evento.id,
                l -> Diff.assinatura(l.evento.titulo, l.evento.descricao, l.evento.dataInicio,
                        l.evento.dataFim, l.evento.local, l.inscrito, l.presencas));
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        return new VH(LayoutInflater.from(parent.getContext()).inflate(R.layout.item_curso, parent, false));
    }

    @Override
    public void onBindViewHolder(@NonNull VH h, int position) {
        Linha l = itens.get(position);
        Evento e = l.evento;
        Context ctx = h.itemView.getContext();
        CapaUtils.aplicarFoto(h.imgCapa, h.txtCapa, e.instituicao);
        h.titulo.setText(e.titulo);
        h.descricao.setText(e.descricao);
        h.barra.setBackgroundColor(CapaUtils.corDaCategoria(e.categoria));

        long agora = System.currentTimeMillis();
        if (l.inscrito && e.dataInicio <= agora) {
            ResumoParticipacao r = ResumoParticipacao.calcular(e.dataInicio, e.dataFim,
                    e.totalEncontros, l.presencas, agora, TimeZone.getDefault());
            h.meta.setText(ctx.getString(R.string.curso_meta_participacao,
                    DateUtils.data(e.dataInicio), r.percentual, r.presencas, r.totalEncontros));
        } else {
            h.meta.setText(ctx.getString(R.string.curso_meta,
                    DateUtils.data(e.dataInicio), e.totalEncontros, e.cargaHoraria));
        }

        h.acao.setText(l.inscrito ? R.string.inscrito_ver : R.string.inscreva_se);
        h.acao.setOnClickListener(v -> listener.aoAbrir(e));
        h.itemView.setOnClickListener(v -> listener.aoAbrir(e));
    }

    @Override
    public int getItemCount() {
        return itens.size();
    }

    static class VH extends RecyclerView.ViewHolder {
        final ImageView imgCapa;
        final View barra;
        final TextView txtCapa, titulo, descricao, meta;
        final MaterialButton acao;

        VH(View v) {
            super(v);
            imgCapa = v.findViewById(R.id.img_capa);
            txtCapa = v.findViewById(R.id.txt_capa);
            titulo = v.findViewById(R.id.txt_titulo);
            descricao = v.findViewById(R.id.txt_descricao);
            meta = v.findViewById(R.id.txt_meta);
            barra = v.findViewById(R.id.barra_categoria);
            acao = v.findViewById(R.id.btn_acao);
        }
    }
}
