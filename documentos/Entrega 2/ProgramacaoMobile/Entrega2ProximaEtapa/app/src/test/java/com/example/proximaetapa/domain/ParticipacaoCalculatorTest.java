package com.example.proximaetapa.domain;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import java.util.Calendar;
import java.util.TimeZone;

public class ParticipacaoCalculatorTest {

    private static final TimeZone SP = TimeZone.getTimeZone("America/Sao_Paulo");

    @Test
    public void calculaPercentualDePresenca() {
        assertEquals(75, ParticipacaoCalculator.percentual(3, 4));
        assertEquals(0, ParticipacaoCalculator.percentual(0, 0));
        assertEquals(100, ParticipacaoCalculator.percentual(5, 4));
    }

    @Test
    public void certificadoExigeSetentaECincoPorCento() {
        assertTrue(ParticipacaoCalculator.elegivelCertificado(3, 4));
        assertFalse(ParticipacaoCalculator.elegivelCertificado(2, 4));
        assertTrue(ParticipacaoCalculator.elegivelCertificado(1, 1));
        assertEquals(1, ParticipacaoCalculator.presencasFaltantes(2, 4));
        assertEquals(0, ParticipacaoCalculator.presencasFaltantes(4, 4));
    }

    @Test
    public void contaEncontrosQueJaAconteceram() {
        Calendar c = Calendar.getInstance(SP);
        c.set(2026, Calendar.NOVEMBER, 10, 14, 0, 0);
        long inicio = c.getTimeInMillis();
        c.set(2026, Calendar.NOVEMBER, 13, 17, 0, 0);
        long fim = c.getTimeInMillis();
        c.set(2026, Calendar.NOVEMBER, 11, 20, 0, 0);
        long agora = c.getTimeInMillis();

        assertEquals(2, ParticipacaoCalculator.encontrosOcorridos(inicio, fim, 4, agora, SP));
        assertEquals(0, ParticipacaoCalculator.encontrosOcorridos(inicio, fim, 4, inicio - 1000, SP));
        assertEquals(4, ParticipacaoCalculator.encontrosOcorridos(inicio, fim, 4, fim + 86_400_000L * 10, SP));
    }
}
