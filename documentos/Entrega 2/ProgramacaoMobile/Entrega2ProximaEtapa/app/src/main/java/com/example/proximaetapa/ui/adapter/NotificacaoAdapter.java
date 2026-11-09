package com.example.proximaetapa.ui.adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.button.MaterialButton;

import java.util.ArrayList;
import java.util.List;

import com.example.proximaetapa.R;
import com.example.proximaetapa.data.local.entity.Notificacao;
import com.example.proximaetapa.util.DateUtils;

public class NotificacaoAdapter extends RecyclerView.Adapter<NotificacaoAdapter.VH> {

    public interface Listener {
        void aoAbrir(Notificacao n);
    }

    private final List<Notificacao> itens = new ArrayList<>();
    private final Listener listener;

    public NotificacaoAdapter(Listener listener) {
        this.listener = listener;
    }

    public void setItens(List<Notificacao> novos) {
        Diff.aplicar(this, itens, novos, n -> n.id,
                n -> Diff.assinatura(n.titulo, n.mensagem, n.tipo, n.lida, n.dataPublicacao));
    }

    public Notificacao get(int posicao) {
        return itens.get(posicao);
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_notificacao, parent, false);
        return new VH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull VH h, int position) {
        Notificacao n = itens.get(position);
        h.titulo.setText(n.titulo);
        h.mensagem.setText(n.mensagem);
        h.data.setText(DateUtils.data(n.dataPublicacao));
        h.tipo.setText(rotuloTipo(n.tipo));
        h.barra.setVisibility(n.lida ? View.INVISIBLE : View.VISIBLE);

        String acao = textoAcao(n);
        if (acao == null) {
            h.acao.setVisibility(View.GONE);
        } else {
            h.acao.setVisibility(View.VISIBLE);
            h.acao.setText(acao);
            h.acao.setOnClickListener(v -> listener.aoAbrir(n));
        }
        h.itemView.setOnClickListener(v -> listener.aoAbrir(n));

        h.itemView.setContentDescription((n.lida ? "" : "Nova notificação. ") + n.titulo + ". " + n.mensagem);
    }

    @Override
    public int getItemCount() {
        return itens.size();
    }

    private static String rotuloTipo(String tipo) {
        if (tipo == null) return "AVISO";
        switch (tipo) {
            case Notificacao.TIPO_PALESTRA:
                return "PALESTRA";
            case Notificacao.TIPO_CURSO:
                return "CURSO";
            case Notificacao.TIPO_EXTERNO:
                return "VESTIBULAR";
            case Notificacao.TIPO_CERTIFICADO:
                return "CERTIFICADO";
            case Notificacao.TIPO_AGENDA:
                return "MUDANÇA NA AGENDA";
            default:
                return "AVISO";
        }
    }

    private static String textoAcao(Notificacao n) {
        if (Notificacao.TIPO_CERTIFICADO.equals(n.tipo)) return "Ver certificado";
        if (n.eventoId == null) return null;
        if (Notificacao.TIPO_EXTERNO.equals(n.tipo) || Notificacao.TIPO_AGENDA.equals(n.tipo)) return "Ver detalhes";
        return "Inscreva-se";
    }

    static class VH extends RecyclerView.ViewHolder {
        final TextView titulo, mensagem, data, tipo;
        final View barra;
        final MaterialButton acao;

        VH(View v) {
            super(v);
            titulo = v.findViewById(R.id.txt_titulo);
            mensagem = v.findViewById(R.id.txt_mensagem);
            data = v.findViewById(R.id.txt_data);
            tipo = v.findViewById(R.id.txt_tipo);
            barra = v.findViewById(R.id.barra_nao_lida);
            acao = v.findViewById(R.id.btn_acao);
        }
    }
}
