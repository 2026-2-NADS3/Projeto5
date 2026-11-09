package com.example.proximaetapa.ui.main;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.button.MaterialButton;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.example.proximaetapa.R;
import com.example.proximaetapa.data.local.entity.Evento;
import com.example.proximaetapa.data.local.entity.Inscricao;
import com.example.proximaetapa.data.repository.AppRepository;
import com.example.proximaetapa.ui.adapter.DiaAgendaAdapter;
import com.example.proximaetapa.ui.evento.EventoDetalheActivity;
import com.example.proximaetapa.util.DateUtils;

public class CalendarioFragment extends Fragment {

    private static final String ESTADO_SEMANA = "semana";

    private Calendar inicioSemana;
    private TextView txtSemana;
    private MaterialButton btnHoje;
    private DiaAgendaAdapter adapter;

    private List<Evento> eventos = new ArrayList<>();
    private Set<Long> inscritos = new HashSet<>();

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_calendario, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View v, @Nullable Bundle savedInstanceState) {
        long base = savedInstanceState != null
                ? savedInstanceState.getLong(ESTADO_SEMANA, System.currentTimeMillis())
                : System.currentTimeMillis();
        inicioSemana = DateUtils.inicioDaSemana(base);

        txtSemana = v.findViewById(R.id.txt_semana);
        btnHoje = v.findViewById(R.id.btn_hoje);
        adapter = new DiaAgendaAdapter(this::abrir);
        ((RecyclerView) v.findViewById(R.id.rv_dias)).setAdapter(adapter);

        v.findViewById(R.id.btn_semana_anterior).setOnClickListener(x -> mudarSemana(-1));
        v.findViewById(R.id.btn_proxima_semana).setOnClickListener(x -> mudarSemana(1));
        btnHoje.setOnClickListener(x -> {
            inicioSemana = DateUtils.inicioDaSemana(System.currentTimeMillis());
            montarSemana();
        });
        btnHoje.setContentDescription(getString(R.string.voltar_para_hoje));

        AppRepository repo = AppRepository.get(requireContext());
        repo.eventos().observe(getViewLifecycleOwner(), lista -> {
            eventos = lista == null ? new ArrayList<>() : lista;
            montarSemana();
        });
        repo.inscricoesAtivas().observe(getViewLifecycleOwner(), lista -> {
            inscritos = new HashSet<>();
            if (lista != null) for (Inscricao i : lista) inscritos.add(i.eventoId);
            montarSemana();
        });
        montarSemana();
    }

    @Override
    public void onSaveInstanceState(@NonNull Bundle outState) {
        super.onSaveInstanceState(outState);
        if (inicioSemana != null) outState.putLong(ESTADO_SEMANA, inicioSemana.getTimeInMillis());
    }

    private void mudarSemana(int delta) {
        inicioSemana.add(Calendar.WEEK_OF_YEAR, delta);
        montarSemana();
    }

    private void montarSemana() {
        txtSemana.setText(DateUtils.rotuloSemana(inicioSemana));
        btnHoje.setText(String.valueOf(inicioSemana.get(Calendar.YEAR)));

        List<DiaAgendaAdapter.Dia> dias = new ArrayList<>();
        Calendar dia = (Calendar) inicioSemana.clone();
        for (int i = 0; i < 7; i++) {
            DiaAgendaAdapter.Dia d = new DiaAgendaAdapter.Dia(dia.getTimeInMillis());
            for (Evento e : eventos) {
                boolean inscrito = inscritos.contains(e.id);
                if (!inscrito && !e.isExterno()) continue;
                if (DateUtils.diaDentroDoEvento(d.meiaNoite, e.dataInicio, e.dataFim)) {
                    d.eventos.add(e);
                    d.inscrito.add(inscrito);
                }
            }
            dias.add(d);
            dia.add(Calendar.DAY_OF_MONTH, 1);
        }
        adapter.setDias(dias);
    }

    private void abrir(Evento e) {
        Intent i = new Intent(requireContext(), EventoDetalheActivity.class);
        i.putExtra(EventoDetalheActivity.EXTRA_EVENTO_ID, e.id);
        startActivity(i);
    }
}
