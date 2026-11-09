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
import com.example.proximaetapa.data.local.entity.MensagemChat;

public class MensagemAdapter extends RecyclerView.Adapter<MensagemAdapter.VH> {

    private static final int TIPO_USUARIO = 1;
    private static final int TIPO_BOT = 2;

    private final List<MensagemChat> itens = new ArrayList<>();

    public void setItens(List<MensagemChat> novas) {
        Diff.aplicar(this, itens, novas, m -> m.id, m -> m.texto);
    }

    @Override
    public int getItemViewType(int position) {
        return itens.get(position).doUsuario ? TIPO_USUARIO : TIPO_BOT;
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        int layout = viewType == TIPO_USUARIO ? R.layout.item_msg_usuario : R.layout.item_msg_bot;
        return new VH(LayoutInflater.from(parent.getContext()).inflate(layout, parent, false));
    }

    @Override
    public void onBindViewHolder(@NonNull VH h, int position) {
        MensagemChat m = itens.get(position);
        h.texto.setText(m.texto);
        h.itemView.setContentDescription((m.doUsuario ? "Você: " : "ProxIA: ") + m.texto);
    }

    @Override
    public int getItemCount() {
        return itens.size();
    }

    static class VH extends RecyclerView.ViewHolder {
        final TextView texto;

        VH(View v) {
            super(v);
            texto = v.findViewById(R.id.txt_msg);
        }
    }
}
