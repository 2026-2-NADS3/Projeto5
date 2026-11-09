package com.example.proximaetapa.domain;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class BadgeCalculator {

    static final int TODOS = -1;

    private static final class Regra {
        final String instituicao;
        final String chave;
        final int totalDocumento;
        final int[] limites;
        final String[] nomes;

        Regra(String instituicao, int totalDocumento, int[] limites, String[] nomes) {
            this.instituicao = instituicao;
            this.chave = normalizar(instituicao);
            this.totalDocumento = totalDocumento;
            this.limites = limites;
            this.nomes = nomes;
        }
    }

    private static final Regra[] REGRAS = {
            new Regra("FECAP", 7, new int[]{1, 4, TODOS},
                    new String[]{"FECAP Starter Pack", "FECAP na Trilha", "Alvarista"}),
            new Regra("São Camilo", 3, new int[]{1, TODOS},
                    new String[]{"Camilo Starter Pack", "Camilo Explorer"}),
            new Regra("PUC", 3, new int[]{1, TODOS},
                    new String[]{"PUC em Formação", "Puquiano"}),
            new Regra("ESPM", 3, new int[]{1, TODOS},
                    new String[]{"ESPM em Criação", "Mente Criativa"}),
            new Regra("Inteli", 1, new int[]{TODOS}, new String[]{"Arquiteto do Futuro"}),
            new Regra("FGV", 1, new int[]{TODOS}, new String[]{"Estrategista FGV"}),
            new Regra("FAAP", 1, new int[]{TODOS}, new String[]{"Curador de Ideias"}),
            new Regra("Insper", 1, new int[]{TODOS}, new String[]{"Líder de Impacto"})
    };

    public static final class Entrada {
        public Map<String, Integer> totalCursosPorInstituicao = Collections.emptyMap();
        public Map<String, Integer> concluidosPorInstituicao = Collections.emptyMap();
        public boolean perfilCompleto;
        public int testesConcluidos;
        public int totalTestes = 2;
        public int totalCertificados;
    }

    private BadgeCalculator() {
    }

    public static List<Badge> calcular(Entrada e) {
        List<Badge> lista = new ArrayList<>();

        lista.add(new Badge("Etapa Zero", "Entrou no app da Próxima Etapa",
                Badge.GRUPO_JORNADA, true));
        lista.add(new Badge("Etapa Identidade", "Completou o perfil",
                Badge.GRUPO_JORNADA, e.perfilCompleto));
        lista.add(new Badge("Etapa Bússola", "Fez todos os testes de perfil",
                Badge.GRUPO_JORNADA, e.testesConcluidos >= e.totalTestes));
        lista.add(new Badge("Próxima Etapa", "Recebeu o primeiro certificado",
                Badge.GRUPO_JORNADA, e.totalCertificados >= 1));

        for (Regra r : REGRAS) {
            int total = Math.max(r.totalDocumento, somar(e.totalCursosPorInstituicao, r.chave));
            int concluidos = somar(e.concluidosPorInstituicao, r.chave);
            for (int i = 0; i < r.limites.length; i++) {
                int limite = r.limites[i] == TODOS ? total : r.limites[i];
                boolean ok = limite > 0 && concluidos >= limite;
                String desc = r.limites[i] == TODOS
                        ? "Concluiu todos os cursos da " + r.instituicao
                        : "Concluiu " + limite + (limite == 1 ? " curso" : " cursos") + " da " + r.instituicao;
                lista.add(new Badge(r.nomes[i], desc, r.instituicao, ok));
            }
        }
        return lista;
    }

    public static String nivelJornada(List<Badge> badges) {
        String nivel = "Etapa Zero";
        for (Badge b : badges) {
            if (Badge.GRUPO_JORNADA.equals(b.grupo) && b.conquistado) {
                nivel = b.nome;
            }
        }
        return nivel;
    }

    public static int contarConquistados(List<Badge> badges) {
        int n = 0;
        for (Badge b : badges) {
            if (b.conquistado) n++;
        }
        return n;
    }

    private static int somar(Map<String, Integer> mapa, String chave) {
        if (mapa == null) return 0;
        int soma = 0;
        for (Map.Entry<String, Integer> e : mapa.entrySet()) {
            if (e.getValue() != null && chave.equals(normalizar(e.getKey()))) soma += e.getValue();
        }
        return soma;
    }

    static String normalizar(String nome) {
        if (nome == null) return "";
        String s = Normalizer.normalize(nome, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .trim();
        if (s.contains("camilo")) return "sao camilo";
        if (s.startsWith("puc")) return "puc";
        return s;
    }
}
