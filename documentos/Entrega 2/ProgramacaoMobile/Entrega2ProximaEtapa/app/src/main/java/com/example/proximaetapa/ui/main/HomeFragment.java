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
import androidx.recyclerview.widget.ItemTouchHelper;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.chip.ChipGroup;
import com.google.android.material.snackbar.Snackbar;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.example.proximaetapa.R;
import com.example.proximaetapa.data.local.entity.Evento;
import com.example.proximaetapa.data.local.entity.Inscricao;
import com.example.proximaetapa.data.local.entity.Notificacao;
import com.example.proximaetapa.data.local.entity.Presenca;
import com.example.proximaetapa.data.repository.AppRepository;
import com.example.proximaetapa.ui.adapter.CursoAdapter;
import com.example.proximaetapa.ui.adapter.NotificacaoAdapter;
import com.example.proximaetapa.ui.certificados.CertificadosActivity;
import com.example.proximaetapa.ui.evento.EventoDetalheActivity;
import com.example.proximaetapa.util.DateUtils;

public class HomeFragment extends Fragment {

    private AppRepository repo;
    private NotificacaoAdapter notificacaoAdapter;
    private CursoAdapter cursoAdapter;

    private List<Evento> eventos = new ArrayList<>();
    private Set<Long> inscritos = new HashSet<>();
    private Map<Long, Integer> presencasPorEvento = new HashMap<>();
    private boolean mostrarMeusCursos = false;
    private TextView txtSemCursos;

    private View cardProximo;
    private TextView txtProximoTitulo, txtProximoInfo, txtProximoMes, txtProximoDia, txtSemAvisos;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_home, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View v, @Nullable Bundle savedInstanceState) {
        repo = AppRepository.get(requireContext());

        cardProximo = v.findViewById(R.id.card_proximo);
        txtProximoTitulo = v.findViewById(R.id.txt_proximo_titulo);
        txtProximoInfo = v.findViewById(R.id.txt_proximo_info);
        txtProximoMes = v.findViewById(R.id.txt_proximo_mes);
        txtProximoDia = v.findViewById(R.id.txt_proximo_dia);
        txtSemAvisos = v.findViewById(R.id.txt_sem_avisos);
        txtSemCursos = v.findViewById(R.id.txt_sem_cursos);

        ChipGroup filtro = v.findViewById(R.id.chips_filtro_cursos);
        filtro.setOnCheckedStateChangeListener((grupo, ids) -> {
            mostrarMeusCursos = ids.contains(R.id.chip_meus_cursos);
            atualizar();
        });

        View.OnClickListener irAgenda = x -> ((MainActivity) requireActivity()).irParaAba(R.id.nav_agenda);
        cardProximo.setOnClickListener(irAgenda);
        v.findViewById(R.id.btn_proximo).setOnClickListener(irAgenda);

        RecyclerView rvNotificacoes = v.findViewById(R.id.rv_notificacoes);
        rvNotificacoes.setLayoutManager(new GridLayoutManager(requireContext(), 1));
        notificacaoAdapter = new NotificacaoAdapter(this::abrirNotificacao);
        rvNotificacoes.setAdapter(notificacaoAdapter);
        configurarArrastarParaApagar(rvNotificacoes);

        RecyclerView rvCursos = v.findViewById(R.id.rv_cursos);
        rvCursos.setLayoutManager(new GridLayoutManager(requireContext(), 1));
        cursoAdapter = new CursoAdapter(this::abrirEvento);
        rvCursos.setAdapter(cursoAdapter);

        repo.notificacoes().observe(getViewLifecycleOwner(), lista -> {
            notificacaoAdapter.setItens(lista);
            txtSemAvisos.setVisibility(lista == null || lista.isEmpty() ? View.VISIBLE : View.GONE);
        });
        repo.eventos().observe(getViewLifecycleOwner(), lista -> {
            eventos = lista == null ? new ArrayList<>() : lista;
            atualizar();
        });
        repo.inscricoesAtivas().observe(getViewLifecycleOwner(), lista -> {
            inscritos = new HashSet<>();
            if (lista != null) for (Inscricao i : lista) inscritos.add(i.eventoId);
            atualizar();
        });
        repo.presencas().observe(getViewLifecycleOwner(), lista -> {
            presencasPorEvento = new HashMap<>();
            if (lista != null) {
                for (Presenca p : lista) {
                    Integer n = presencasPorEvento.get(p.eventoId);
                    presencasPorEvento.put(p.eventoId, n == null ? 1 : n + 1);
                }
            }
            atualizar();
        });
    }

    private void atualizar() {
        long agora = System.currentTimeMillis();
        List<Evento> cursosFuturos = new ArrayList<>();
        List<Evento> meusCursos = new ArrayList<>();
        Evento proximo = null;

        for (Evento e : eventos) {
            boolean inscrito = inscritos.contains(e.id);
            if (inscrito && !e.isExterno()) meusCursos.add(e);
            if (e.jaTerminou(agora)) continue;
            if (!e.isExterno()) cursosFuturos.add(e);
            if (inscrito && (proximo == null || e.dataInicio < proximo.dataInicio)) {
                proximo = e;
            }
        }
        Collections.reverse(meusCursos);
        List<Evento> lista = mostrarMeusCursos ? meusCursos : cursosFuturos;
        cursoAdapter.setItens(lista, inscritos, presencasPorEvento);
        txtSemCursos.setVisibility(lista.isEmpty() ? View.VISIBLE : View.GONE);
        txtSemCursos.setText(mostrarMeusCursos ? R.string.sem_meus_cursos : R.string.sem_cursos_disponiveis);

        if (proximo == null) {
            txtProximoTitulo.setText(R.string.home_sem_proximo);
            txtProximoInfo.setText(R.string.home_sem_proximo_dica);
            txtProximoMes.setText("");
            txtProximoDia.setText("–");
        } else {
            String quando = DateUtils.mesmoDia(proximo.dataInicio, agora)
                    ? getString(R.string.hoje_horario, DateUtils.intervaloHoras(proximo.dataInicio, proximo.dataFim))
                    : DateUtils.periodo(proximo.dataInicio, proximo.dataFim);
            txtProximoTitulo.setText(proximo.titulo);
            txtProximoInfo.setText(quando + "\n" + proximo.local);
            txtProximoMes.setText(DateUtils.nomeMes(proximo.dataInicio));
            txtProximoDia.setText(DateUtils.diaDoMes(proximo.dataInicio));
            cardProximo.setContentDescription(getString(R.string.home_esta_chegando) + " "
                    + proximo.titulo + ", " + quando);
        }
    }

    private void abrirNotificacao(Notificacao n) {
        repo.marcarNotificacaoLida(n.id);
        if (Notificacao.TIPO_CERTIFICADO.equals(n.tipo)) {
            startActivity(new Intent(requireContext(), CertificadosActivity.class));
        } else if (n.eventoId != null) {
            abrirEventoPorId(n.eventoId);
        }
    }

    private void abrirEvento(Evento e) {
        abrirEventoPorId(e.id);
    }

    private void abrirEventoPorId(long id) {
        Intent i = new Intent(requireContext(), EventoDetalheActivity.class);
        i.putExtra(EventoDetalheActivity.EXTRA_EVENTO_ID, id);
        startActivity(i);
    }

    private void configurarArrastarParaApagar(RecyclerView rv) {
        ItemTouchHelper.SimpleCallback cb = new ItemTouchHelper.SimpleCallback(0,
                ItemTouchHelper.LEFT | ItemTouchHelper.RIGHT) {
            @Override
            public boolean onMove(@NonNull RecyclerView r, @NonNull RecyclerView.ViewHolder a,
                                  @NonNull RecyclerView.ViewHolder b) {
                return false;
            }

            @Override
            public void onSwiped(@NonNull RecyclerView.ViewHolder vh, int direction) {
                int pos = vh.getBindingAdapterPosition();
                if (pos == RecyclerView.NO_POSITION) return;
                Notificacao n = notificacaoAdapter.get(pos);
                repo.definirNotificacaoRemovida(n.id, true);
                Snackbar.make(rv, R.string.notificacao_apagada, Snackbar.LENGTH_LONG)
                        .setAnchorView(requireActivity().findViewById(R.id.card_nav))
                        .setAction(R.string.desfazer, x -> repo.definirNotificacaoRemovida(n.id, false))
                        .show();
            }
        };
        new ItemTouchHelper(cb).attachToRecyclerView(rv);
    }
}
