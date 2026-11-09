package com.example.proximaetapa.ui.adapter;

import android.content.res.ColorStateList;
import android.graphics.Typeface;
import android.text.SpannableStringBuilder;
import android.text.Spanned;
import android.text.style.StyleSpan;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.card.MaterialCardView;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import com.example.proximaetapa.R;
import com.example.proximaetapa.data.local.entity.Evento;
import com.example.proximaetapa.util.DateUtils;

public class DiaAgendaAdapter extends RecyclerView.Adapter<DiaAgendaAdapter.VH> {

    public static class Dia {
        public final long meiaNoite;
        public final List<Evento> eventos = new ArrayList<>();
        public final List<Boolean> inscrito = new ArrayList<>();

        public Dia(long meiaNoite) {
            this.meiaNoite = meiaNoite;
        }
    }

    public interface Listener {
        void aoAbrir(Evento evento);
    }

    private final List<Dia> dias = new ArrayList<>();
    private final Listener listener;
    private final RecyclerView.RecycledViewPool poolEventos = new RecyclerView.RecycledViewPool();

    public DiaAgendaAdapter(Listener listener) {
        this.listener = listener;
    }

    public void setDias(List<Dia> novos) {
        dias.clear();
        dias.addAll(novos);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        VH vh = new VH(LayoutInflater.from(parent.getContext()).inflate(R.layout.item_dia_agenda, parent, false));
        vh.rvEventos.setRecycledViewPool(poolEventos);
        vh.rvEventos.setAdapter(vh.eventosAdapter);
        return vh;
    }

    @Override
    public void onBindViewHolder(@NonNull VH h, int position) {
        Dia dia = dias.get(position);
        boolean hoje = DateUtils.mesmoDia(dia.meiaNoite, System.currentTimeMillis());

        h.txtDia.setText(DateUtils.diaDoMes(dia.meiaNoite));
        h.txtDiaSemana.setText(new SimpleDateFormat("EEE", DateUtils.PT_BR).format(new Date(dia.meiaNoite)));
        h.txtDia.setTypeface(null, hoje ? Typeface.BOLD : Typeface.NORMAL);
        h.colunaDia.setBackgroundResource(hoje ? R.drawable.bg_dia_hoje : 0);
        h.eventosAdapter.setDia(dia);

        h.itemView.setContentDescription(DateUtils.diaSemanaCurto(dia.meiaNoite)
                + (hoje ? ", hoje" : "") + ", " + dia.eventos.size() + " eventos");
    }

    @Override
    public int getItemCount() {
        return dias.size();
    }

    class VH extends RecyclerView.ViewHolder {
        final TextView txtDia, txtDiaSemana;
        final View colunaDia;
        final RecyclerView rvEventos;
        final EventosDoDiaAdapter eventosAdapter = new EventosDoDiaAdapter();

        VH(View v) {
            super(v);
            txtDia = v.findViewById(R.id.txt_dia);
            txtDiaSemana = v.findViewById(R.id.txt_dia_semana);
            colunaDia = v.findViewById(R.id.coluna_dia);
            rvEventos = v.findViewById(R.id.rv_eventos);
        }
    }

    class EventosDoDiaAdapter extends RecyclerView.Adapter<EventosDoDiaAdapter.EventoVH> {

        private Dia dia;

        void setDia(Dia d) {
            dia = d;
            notifyDataSetChanged();
        }

        @NonNull
        @Override
        public EventoVH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            return new EventoVH(LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_evento_agenda, parent, false));
        }

        @Override
        public void onBindViewHolder(@NonNull EventoVH h, int position) {
            Evento e = dia.eventos.get(position);
            boolean inscrito = dia.inscrito.get(position);
            int cor = ContextCompat.getColor(h.itemView.getContext(),
                    e.isExterno() && !inscrito ? R.color.pe_verde_texto : R.color.pe_roxo_vivo);
            h.card.setCardBackgroundColor(ColorStateList.valueOf(cor));

            SpannableStringBuilder sb = new SpannableStringBuilder();
            negrito(sb, "TEMA: ");
            sb.append(e.titulo).append('\n');
            negrito(sb, "HORÁRIO: ");
            sb.append(DateUtils.intervaloHoras(e.dataInicio, e.dataFim)).append('\n');
            negrito(sb, "LOCAL: ");
            sb.append(e.local);
            h.texto.setText(sb);

            h.card.setOnClickListener(v -> listener.aoAbrir(e));
        }

        @Override
        public int getItemCount() {
            return dia == null ? 0 : dia.eventos.size();
        }

        class EventoVH extends RecyclerView.ViewHolder {
            final MaterialCardView card;
            final TextView texto;

            EventoVH(View v) {
                super(v);
                card = v.findViewById(R.id.card);
                texto = v.findViewById(R.id.txt_evento);
            }
        }
    }

    private static void negrito(SpannableStringBuilder sb, String texto) {
        int ini = sb.length();
        sb.append(texto);
        sb.setSpan(new StyleSpan(Typeface.BOLD), ini, sb.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
    }
}
