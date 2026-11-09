package com.example.proximaetapa.domain;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import java.util.List;
import java.util.Map;

import com.example.proximaetapa.domain.teste.TesteDefinicao;
import com.example.proximaetapa.domain.teste.TesteScorer;

public class TesteScorerTest {

    private static TesteDefinicao testeDeExemplo() {
        TesteDefinicao t = new TesteDefinicao();
        t.id = "DISC";
        for (String d : new String[]{"D", "I", "S", "C"}) {
            t.perfis.put(d, new TesteDefinicao.PerfilResultado());
        }
        for (int p = 0; p < 3; p++) {
            TesteDefinicao.Pergunta q = new TesteDefinicao.Pergunta();
            for (String d : new String[]{"D", "I", "S", "C"}) {
                TesteDefinicao.Alternativa a = new TesteDefinicao.Alternativa();
                a.dimensao = d;
                a.pontos = 1;
                q.alternativas.add(a);
            }
            t.perguntas.add(q);
        }
        return t;
    }

    @Test
    public void somaPontosPorDimensaoEEscolheAPrincipal() {
        TesteDefinicao t = testeDeExemplo();
        Map<String, Integer> pontos = TesteScorer.pontuar(t, new int[]{1, 1, 3});
        assertEquals(Integer.valueOf(2), pontos.get("I"));
        assertEquals(Integer.valueOf(1), pontos.get("C"));
        assertEquals(Integer.valueOf(0), pontos.get("D"));

        List<String> top = TesteScorer.principais(pontos, 2);
        assertEquals("I", top.get(0));
        assertEquals("C", top.get(1));
    }

    @Test
    public void detectaQuestionarioIncompleto() {
        assertFalse(TesteScorer.completo(new int[]{0, -1, 2}));
        assertTrue(TesteScorer.completo(new int[]{0, 1, 2}));
    }
}
