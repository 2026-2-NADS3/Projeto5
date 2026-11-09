package com.example.proximaetapa.ui.main;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.RecyclerView;

import com.example.proximaetapa.R;
import com.example.proximaetapa.data.local.entity.Bolsa;
import com.example.proximaetapa.data.repository.AppRepository;
import com.example.proximaetapa.ui.adapter.BolsaAdapter;
import com.example.proximaetapa.ui.evento.EventoDetalheActivity;

public class BolsasFragment extends Fragment {

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_bolsas, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View v, @Nullable Bundle savedInstanceState) {
        AppRepository repo = AppRepository.get(requireContext());
        View vazio = v.findViewById(R.id.txt_sem_bolsas);

        BolsaAdapter destaque = new BolsaAdapter(this::abrir);
        BolsaAdapter internacionais = new BolsaAdapter(this::abrir);
        ((RecyclerView) v.findViewById(R.id.rv_destaque)).setAdapter(destaque);
        ((RecyclerView) v.findViewById(R.id.rv_internacionais)).setAdapter(internacionais);

        repo.bolsasDestaque().observe(getViewLifecycleOwner(), lista -> {
            destaque.setItens(lista);
            vazio.setVisibility(lista == null || lista.isEmpty() ? View.VISIBLE : View.GONE);
        });
        repo.bolsasInternacionais().observe(getViewLifecycleOwner(), internacionais::setItens);
    }

    private void abrir(Bolsa b) {
        Intent i = new Intent(requireContext(), EventoDetalheActivity.class);
        i.putExtra(EventoDetalheActivity.EXTRA_BOLSA_ID, b.id);
        startActivity(i);
    }
}
