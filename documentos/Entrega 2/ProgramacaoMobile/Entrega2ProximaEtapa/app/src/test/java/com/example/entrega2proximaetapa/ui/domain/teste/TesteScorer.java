package com.example.proximaetapa.domain.teste;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class TesteScorer {

    private TesteScorer() {
    }

    public static Map<String, Integer> pontuar(TesteDefinicao teste, int[] respostas) {
        Map<String, Integer> pontos = new LinkedHashMap<>();
        for (String dim : teste.perfis.keySet()) {
            pontos.put(dim, 0);
        }
        for (int i = 0; i < teste.perguntas.size() && i < respostas.length; i++) {
            int escolha = respostas[i];
            List<TesteDefinicao.Alternativa> alts = teste.perguntas.get(i).alternativas;
            if (escolha < 0 || escolha >= alts.size()) continue;
            TesteDefinicao.Alternativa a = alts.get(escolha);
            Integer atual = pontos.get(a.dimensao);
            pontos.put(a.dimensao, (atual == null ? 0 : atual) + a.pontos);
        }
        return pontos;
    }

    public static List<String> principais(Map<String, Integer> pontos, int n) {
        List<Map.Entry<String, Integer>> entradas = new ArrayList<>(pontos.entrySet());
        Collections.sort(entradas, (a, b) -> Integer.compare(b.getValue(), a.getValue()));
        List<String> resultado = new ArrayList<>();
        for (int i = 0; i < entradas.size() && i < n; i++) {
            resultado.add(entradas.get(i).getKey());
        }
        return resultado;
    }

    public static boolean completo(int[] respostas) {
        for (int r : respostas) {
            if (r < 0) return false;
        }
        return true;
    }
}
