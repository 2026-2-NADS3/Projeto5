package com.example.proximaetapa.ui.main;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;

import com.example.proximaetapa.R;
import com.example.proximaetapa.data.local.entity.Aluno;
import com.example.proximaetapa.data.local.entity.Certificado;
import com.example.proximaetapa.data.local.entity.Evento;
import com.example.proximaetapa.data.local.entity.Inscricao;
import com.example.proximaetapa.data.local.entity.Presenca;
import com.example.proximaetapa.data.local.entity.ResultadoTeste;
import com.example.proximaetapa.data.repository.AppRepository;
import com.example.proximaetapa.domain.Badge;
import com.example.proximaetapa.domain.BadgeCalculator;
import com.example.proximaetapa.domain.ResumoParticipacao;
import com.example.proximaetapa.ui.perfil.EditarPerfilActivity;
import com.example.proximaetapa.ui.testes.TestesActivity;
import com.example.proximaetapa.ui.widget.BarChartView;
import com.example.proximaetapa.ui.widget.DonutChartView;
import com.example.proximaetapa.util.DateUtils;
import com.example.proximaetapa.util.QrUtils;

public class PerfilFragment extends Fragment {

    private Aluno aluno;
    private List<Evento> eventos = new ArrayList<>();
    private List<Inscricao> inscricoes = new ArrayList<>();
    private List<Presenca> presencas = new ArrayList<>();
    private List<Certificado> certificados = new ArrayList<>();
    private List<ResultadoTeste> resultados = new ArrayList<>();
    private List<Badge> badges = new ArrayList<>();

    private View raiz;
    private String qrGerado;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_perfil, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View v, @Nullable Bundle savedInstanceState) {
        raiz = v;
        AppRepository repo = AppRepository.get(requireContext());

        v.findViewById(R.id.btn_testes).setOnClickListener(x ->
                startActivity(new Intent(requireContext(), TestesActivity.class)));
        v.findViewById(R.id.btn_editar_perfil).setOnClickListener(x ->
                startActivity(new Intent(requireContext(), EditarPerfilActivity.class)));
        v.findViewById(R.id.btn_ver_badges).setOnClickListener(x -> mostrarTodosBadges());
        v.findViewById(R.id.card_digital).setOnClickListener(x -> mostrarQrGrande());
        v.findViewById(R.id.txt_linkedin).setOnClickListener(x -> abrirLinkedin());

        repo.aluno().observe(getViewLifecycleOwner(), a -> {
            aluno = a;
            atualizar();
        });
        repo.eventos().observe(getViewLifecycleOwner(), l -> {
            eventos = l == null ? new ArrayList<>() : l;
            atualizar();
        });
        repo.inscricoesAtivas().observe(getViewLifecycleOwner(), l -> {
            inscricoes = l == null ? new ArrayList<>() : l;
            atualizar();
        });
        repo.presencas().observe(getViewLifecycleOwner(), l -> {
            presencas = l == null ? new ArrayList<>() : l;
            atualizar();
        });
        repo.certificados().observe(getViewLifecycleOwner(), l -> {
            certificados = l == null ? new ArrayList<>() : l;
            atualizar();
        });
        repo.resultadosTeste().observe(getViewLifecycleOwner(), l -> {
            resultados = l == null ? new ArrayList<>() : l;
            atualizar();
        });
    }

    private void atualizar() {
        if (aluno == null || raiz == null) return;

        texto(R.id.txt_avatar, aluno.iniciais());
        texto(R.id.txt_nome, aluno.nome);
        TextView linkedin = raiz.findViewById(R.id.txt_linkedin);
        boolean temLinkedin = aluno.linkedin != null && !aluno.linkedin.trim().isEmpty();
        linkedin.setText(temLinkedin ? aluno.linkedin : getString(R.string.perfil_sem_linkedin));

        BadgeCalculator.Entrada entrada = new BadgeCalculator.Entrada();
        Map<String, Integer> totalPorInst = new HashMap<>();
        for (Evento e : eventos) {
            if (e.isCurso()) incrementar(totalPorInst, e.instituicao);
        }
        Map<String, Integer> concluidosPorInst = new HashMap<>();
        for (Certificado c : certificados) incrementar(concluidosPorInst, c.instituicao);
        entrada.totalCursosPorInstituicao = totalPorInst;
        entrada.concluidosPorInstituicao = concluidosPorInst;
        entrada.perfilCompleto = aluno.perfilCompleto();
        entrada.testesConcluidos = tiposDeTesteFeitos().size();
        entrada.totalCertificados = certificados.size();
        badges = BadgeCalculator.calcular(entrada);
        desenharBadges();

        texto(R.id.txt_card_nome, aluno.nome);
        texto(R.id.txt_card_matricula, getString(R.string.cartao_matricula, aluno.matricula));
        texto(R.id.txt_card_nivel, BadgeCalculator.nivelJornada(badges));
        if (!conteudoQrAluno().equals(qrGerado)) {
            Bitmap qr = QrUtils.gerar(conteudoQrAluno(), 300);
            if (qr != null) ((ImageView) raiz.findViewById(R.id.img_card_qr)).setImageBitmap(qr);
            qrGerado = conteudoQrAluno();
        }

        int horas = 0;
        for (Certificado c : certificados) horas += c.cargaHoraria;
        texto(R.id.txt_num_cursos, String.valueOf(certificados.size()));
        texto(R.id.txt_num_horas, horas + "h");
        texto(R.id.txt_num_badges, String.valueOf(BadgeCalculator.contarConquistados(badges)));
        raiz.findViewById(R.id.txt_num_cursos).setContentDescription(certificados.size() + " cursos concluídos");
        raiz.findViewById(R.id.txt_num_horas).setContentDescription(horas + " horas certificadas");
        raiz.findViewById(R.id.txt_num_badges).setContentDescription(
                BadgeCalculator.contarConquistados(badges) + " badges conquistados");

        atualizarGraficoHoras();
        atualizarGraficoPresenca();

        texto(R.id.txt_resultado_testes, resumoTestes());

        ChipGroup chips = raiz.findViewById(R.id.chips_interesses);
        chips.removeAllViews();
        if (aluno.interesses != null && !aluno.interesses.trim().isEmpty()) {
            for (String tag : aluno.interesses.split(",")) {
                Chip c = new Chip(requireContext());
                c.setText(tag.trim());
                c.setClickable(false);
                chips.addView(c);
            }
        } else {
            Chip c = new Chip(requireContext());
            c.setText(R.string.perfil_sem_interesses);
            c.setClickable(false);
            chips.addView(c);
        }
    }

    private void atualizarGraficoHoras() {
        Map<String, Integer> horasPorInst = new HashMap<>();
        for (Certificado c : certificados) {
            Integer h = horasPorInst.get(c.instituicao);
            horasPorInst.put(c.instituicao, (h == null ? 0 : h) + c.cargaHoraria);
        }
        List<Map.Entry<String, Integer>> lista = new ArrayList<>(horasPorInst.entrySet());
        Collections.sort(lista, (a, b) -> Integer.compare(b.getValue(), a.getValue()));
        List<String> rotulos = new ArrayList<>();
        List<Float> valores = new ArrayList<>();
        for (int i = 0; i < lista.size() && i < 5; i++) {
            rotulos.add(lista.get(i).getKey());
            valores.add((float) lista.get(i).getValue());
        }
        ((BarChartView) raiz.findViewById(R.id.grafico_barras)).setDados(rotulos, valores);
    }

    private void atualizarGraficoPresenca() {
        long agora = System.currentTimeMillis();
        Map<Long, Integer> presPorEvento = new HashMap<>();
        for (Presenca p : presencas) incrementar(presPorEvento, p.eventoId);

        Set<Long> idsInscritos = new HashSet<>();
        for (Inscricao i : inscricoes) idsInscritos.add(i.eventoId);

        int totalPres = 0, totalFaltas = 0, totalFuturos = 0;
        for (Evento e : eventos) {
            if (!idsInscritos.contains(e.id) || e.isExterno()) continue;
            Integer p = presPorEvento.get(e.id);
            ResumoParticipacao r = ResumoParticipacao.calcular(e.dataInicio, e.dataFim,
                    e.totalEncontros, p == null ? 0 : p, agora, TimeZone.getDefault());
            totalPres += r.presencas;
            totalFaltas += r.faltas;
            totalFuturos += r.futuros;
        }
        ((DonutChartView) raiz.findViewById(R.id.grafico_rosca)).setDados(totalPres, totalFaltas, totalFuturos);
        texto(R.id.txt_leg_presencas, getResources().getQuantityString(R.plurals.presencas, totalPres, totalPres));
        texto(R.id.txt_leg_faltas, getResources().getQuantityString(R.plurals.faltas, totalFaltas, totalFaltas));
        texto(R.id.txt_leg_futuros, getResources().getQuantityString(R.plurals.futuros, totalFuturos, totalFuturos));
    }

    private void desenharBadges() {
        TextView[] vagas = {
                raiz.findViewById(R.id.badge_1),
                raiz.findViewById(R.id.badge_2),
                raiz.findViewById(R.id.badge_3)
        };
        int usados = 0;
        for (int i = badges.size() - 1; i >= 0 && usados < vagas.length; i--) {
            Badge b = badges.get(i);
            if (!b.conquistado) continue;
            vagas[usados].setText(iniciais(b.nome));
            vagas[usados].setContentDescription("Badge " + b.nome);
            vagas[usados].setVisibility(View.VISIBLE);
            usados++;
        }
        for (int i = usados; i < vagas.length; i++) vagas[i].setVisibility(View.GONE);
    }

    private void mostrarTodosBadges() {
        if (badges.isEmpty()) return;
        String[] linhas = new String[badges.size()];
        for (int i = 0; i < badges.size(); i++) {
            Badge b = badges.get(i);
            linhas[i] = (b.conquistado ? "✓ " : "🔒 ") + b.nome + " (" + b.grupo + ")\n   " + b.descricao;
        }
        new MaterialAlertDialogBuilder(requireContext())
                .setTitle(getString(R.string.badges_titulo, BadgeCalculator.contarConquistados(badges), badges.size()))
                .setItems(linhas, null)
                .setPositiveButton(R.string.ok, null)
                .show();
    }

    private void mostrarQrGrande() {
        if (aluno == null) return;
        ImageView img = new ImageView(requireContext());
        int pad = (int) (24 * getResources().getDisplayMetrics().density);
        img.setPadding(pad, pad, pad, pad);
        img.setAdjustViewBounds(true);
        img.setContentDescription(getString(R.string.cartao_qr_desc));
        Bitmap qr = QrUtils.gerar(conteudoQrAluno(), 720);
        if (qr != null) img.setImageBitmap(qr);
        new MaterialAlertDialogBuilder(requireContext())
                .setTitle(aluno.nome)
                .setMessage(getString(R.string.cartao_matricula, aluno.matricula))
                .setView(img)
                .setPositiveButton(R.string.fechar, null)
                .show();
    }

    private void abrirLinkedin() {
        if (aluno == null || aluno.linkedin == null || aluno.linkedin.trim().isEmpty()) {
            startActivity(new Intent(requireContext(), EditarPerfilActivity.class));
            return;
        }
        String url = aluno.linkedin.trim();
        if (!url.startsWith("http")) url = "https://" + url;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        } catch (ActivityNotFoundException ignored) {
        }
    }

    private String conteudoQrAluno() {
        return "PE:ALUNO:" + aluno.matricula;
    }

    private Set<String> tiposDeTesteFeitos() {
        Set<String> tipos = new HashSet<>();
        for (ResultadoTeste r : resultados) tipos.add(r.tipo);
        return tipos;
    }

    private String resumoTestes() {
        ResultadoTeste disc = null, riasec = null;
        for (ResultadoTeste r : resultados) {
            if ("DISC".equals(r.tipo) && disc == null) disc = r;
            if ("RIASEC".equals(r.tipo) && riasec == null) riasec = r;
        }
        if (disc == null && riasec == null) return getString(R.string.perfil_sem_testes);
        StringBuilder sb = new StringBuilder();
        sb.append(getString(R.string.perfil_disc, disc == null ? getString(R.string.pendente) : disc.perfil));
        sb.append('\n');
        sb.append(getString(R.string.perfil_riasec, riasec == null ? getString(R.string.pendente) : riasec.perfil));
        return sb.toString();
    }

    private void texto(int id, CharSequence valor) {
        ((TextView) raiz.findViewById(id)).setText(valor);
    }

    private static <K> void incrementar(Map<K, Integer> mapa, K chave) {
        Integer n = mapa.get(chave);
        mapa.put(chave, n == null ? 1 : n + 1);
    }

    private static String iniciais(String nome) {
        String[] p = nome.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < p.length && sb.length() < 2; i++) {
            if (!p[i].isEmpty() && Character.isLetter(p[i].charAt(0))) sb.append(p[i].charAt(0));
        }
        return sb.toString().toUpperCase(DateUtils.PT_BR);
    }
}
