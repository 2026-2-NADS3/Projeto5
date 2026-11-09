package com.example.proximaetapa.domain;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class BadgeCalculatorTest {

    private static Badge buscar(List<Badge> lista, String nome) {
        for (Badge b : lista) if (b.nome.equals(nome)) return b;
        throw new AssertionError("Badge não encontrado: " + nome);
    }

    private static List<Badge> badges(String inst, int total, int certificados) {
        Map<String, Integer> t = new HashMap<>();
        t.put(inst, total);
        Map<String, Integer> c = new HashMap<>();
        c.put(inst, certificados);
        BadgeCalculator.Entrada e = new BadgeCalculator.Entrada();
        e.totalCursosPorInstituicao = t;
        e.concluidosPorInstituicao = c;
        return BadgeCalculator.calcular(e);
    }

    @Test
    public void niveisDaFecapSeguemQuantidadeDeCursos() {
        assertFalse(buscar(badges("FECAP", 7, 0), "FECAP Starter Pack").conquistado);
        assertTrue(buscar(badges("FECAP", 7, 1), "FECAP Starter Pack").conquistado);
        assertFalse(buscar(badges("FECAP", 7, 3), "FECAP na Trilha").conquistado);
        assertTrue(buscar(badges("FECAP", 7, 4), "FECAP na Trilha").conquistado);
        assertFalse(buscar(badges("FECAP", 7, 6), "Alvarista").conquistado);
        assertTrue(buscar(badges("FECAP", 7, 7), "Alvarista").conquistado);
    }

    @Test
    public void alvaristaExigeOsSeteCursosMesmoComMenosCursosListados() {
        List<Badge> l = badges("FECAP", 3, 3);
        assertFalse(buscar(l, "Alvarista").conquistado);
        assertFalse(buscar(l, "FECAP na Trilha").conquistado);
        assertFalse(buscar(badges("FECAP", 8, 7), "Alvarista").conquistado);
    }

    @Test
    public void demaisFaculdades() {
        assertTrue(buscar(badges("São Camilo", 3, 1), "Camilo Starter Pack").conquistado);
        assertFalse(buscar(badges("São Camilo", 3, 2), "Camilo Explorer").conquistado);
        assertTrue(buscar(badges("São Camilo", 3, 3), "Camilo Explorer").conquistado);
        assertTrue(buscar(badges("PUC", 3, 3), "Puquiano").conquistado);
        assertTrue(buscar(badges("ESPM", 3, 3), "Mente Criativa").conquistado);
        assertTrue(buscar(badges("Inteli", 1, 1), "Arquiteto do Futuro").conquistado);
        assertTrue(buscar(badges("FGV", 1, 1), "Estrategista FGV").conquistado);
        assertTrue(buscar(badges("FAAP", 1, 1), "Curador de Ideias").conquistado);
        assertTrue(buscar(badges("Insper", 1, 1), "Líder de Impacto").conquistado);
    }

    @Test
    public void nomeDaFaculdadeSemAcentoOuComSufixoConta() {
        assertTrue(buscar(badges("Sao Camilo", 3, 1), "Camilo Starter Pack").conquistado);
        assertTrue(buscar(badges("PUC-SP", 3, 3), "Puquiano").conquistado);
    }

    @Test
    public void semCertificadoNaoHaBadgeDeFaculdade() {
        for (Badge b : BadgeCalculator.calcular(new BadgeCalculator.Entrada())) {
            if (!Badge.GRUPO_JORNADA.equals(b.grupo)) assertFalse(b.nome, b.conquistado);
        }
    }

    @Test
    public void jornadaDoPerfilDefineNivelDoCartao() {
        BadgeCalculator.Entrada e = new BadgeCalculator.Entrada();
        e.perfilCompleto = true;
        e.testesConcluidos = 2;
        e.totalCertificados = 0;
        List<Badge> badges = BadgeCalculator.calcular(e);

        assertEquals("Etapa Bússola", BadgeCalculator.nivelJornada(badges));
        assertFalse(buscar(badges, "Próxima Etapa").conquistado);
    }
}
