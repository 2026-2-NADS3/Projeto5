package com.example.proximaetapa.domain;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import java.util.Calendar;
import java.util.TimeZone;

public class ResumoParticipacaoTest {

    private static final TimeZone SP = TimeZone.getTimeZone("America/Sao_Paulo");

    private static long data(int dia, int hora) {
        Calendar c = Calendar.getInstance(SP);
        c.clear();
        c.set(2026, Calendar.NOVEMBER, dia, hora, 0, 0);
        return c.getTimeInMillis();
    }

    @Test
    public void contaFaltaSomenteDeEncontrosQueJaPassaram() {
        ResumoParticipacao r = ResumoParticipacao.calcular(data(10, 14), data(13, 17), 4, 1, data(12, 15), SP);
        assertEquals(1, r.presencas);
        assertEquals(1, r.faltas);
        assertEquals(2, r.futuros);
        assertEquals(50, r.percentual);
        assertFalse(r.elegivelCertificado);
        assertEquals(2, r.faltamParaCertificado);
    }

    @Test
    public void cursoConcluidoComPresencaMinimaLiberaCertificado() {
        ResumoParticipacao r = ResumoParticipacao.calcular(data(1, 14), data(4, 17), 4, 3, data(20, 10), SP);
        assertEquals(3, r.presencas);
        assertEquals(1, r.faltas);
        assertEquals(0, r.futuros);
        assertEquals(75, r.percentual);
        assertTrue(r.elegivelCertificado);
    }
}
