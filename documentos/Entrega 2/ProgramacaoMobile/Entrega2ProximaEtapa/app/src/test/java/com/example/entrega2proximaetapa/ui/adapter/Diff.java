package com.example.proximaetapa.ui.adapter;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;

final class Diff {

    private Diff() {
    }

    static <T> void aplicar(RecyclerView.Adapter<?> adapter, List<T> atual, List<T> nova,
                            Function<T, Object> id, Function<T, Object> conteudo) {
        final List<T> antiga = new ArrayList<>(atual);
        final List<T> novaLista = nova == null ? new ArrayList<>() : nova;
        DiffUtil.DiffResult r = DiffUtil.calculateDiff(new DiffUtil.Callback() {
            @Override
            public int getOldListSize() {
                return antiga.size();
            }

            @Override
            public int getNewListSize() {
                return novaLista.size();
            }

            @Override
            public boolean areItemsTheSame(int o, int n) {
                return Objects.equals(id.apply(antiga.get(o)), id.apply(novaLista.get(n)));
            }

            @Override
            public boolean areContentsTheSame(int o, int n) {
                return Objects.equals(conteudo.apply(antiga.get(o)), conteudo.apply(novaLista.get(n)));
            }
        });
        atual.clear();
        atual.addAll(novaLista);
        r.dispatchUpdatesTo(adapter);
    }

    @NonNull
    static String assinatura(Object... campos) {
        StringBuilder sb = new StringBuilder();
        for (Object c : campos) sb.append(c).append('|');
        return sb.toString();
    }
}
