package com.example.proximaetapa.domain;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;

import com.example.proximaetapa.data.local.entity.Evento;
import com.example.proximaetapa.domain.CheckinValidator.Situacao;

public class CheckinValidatorTest {

    private static final ZoneId SP = ZoneId.of("America/Sao_Paulo");

    private static long ms(int dia, int hora, int min) {
        return LocalDateTime.of(2026, 11, dia, hora, min).atZone(SP).toInstant().toEpochMilli();
    }

    private static Clock relogio(int dia, int hora, int min) {
        return Clock.fixed(LocalDateTime.of(2026, 11, dia, hora, min).atZone(SP).toInstant(), SP);
    }

    private static Evento evento(String tipo, long inicio, long fim) {
        Evento e = new Evento();
        e.id = 21;
        e.tipo = tipo;
        e.dataInicio = inicio;
        e.dataFim = fim;
        return e;
    }

    private static final Evento PALESTRA = evento(Evento.TIPO_PALESTRA, ms(10, 19, 0), ms(10, 22, 0));
    private static final Evento CURSO_2_DIAS = evento(Evento.TIPO_CURSO, ms(10, 19, 0), ms(11, 22, 0));

    private static CheckinValidator.Resultado avaliar(Evento e, int dia, int hora, int min) {
        return new CheckinValidator(relogio(dia, hora, min)).avaliar(e);
    }

    @Test
    public void cinquentaECincoMinutosAntesDoInicioEstaNoHorario() {
        assertEquals(Situacao.NO_HORARIO, avaliar(PALESTRA, 10, 18, 5).situacao);
    }

    @Test
    public void umaHoraEMeiaAntesAindaNaoAbriuEInformaOHorario() {
        CheckinValidator.Resultado r = avaliar(PALESTRA, 10, 17, 30);
        assertEquals(Situacao.ANTES_DO_HORARIO, r.situacao);
        assertEquals(LocalTime.of(18, 0), r.abreAs());
    }

    @Test
    public void cinquentaECincoMinutosDepoisDoFimEstaNoHorario() {
        assertEquals(Situacao.NO_HORARIO, avaliar(PALESTRA, 10, 22, 55).situacao);
    }

    @Test
    public void depoisDaToleranciaNoMesmoDiaEncerrou() {
        CheckinValidator.Resultado r = avaliar(PALESTRA, 10, 23, 30);
        assertEquals(Situacao.ENCERRADO_HOJE, r.situacao);
        assertEquals(LocalTime.of(23, 0), r.fechaAs());
    }

    @Test
    public void tresDaManhaDoDiaSeguinteNaoEstaNoHorario() {
        Situacao s = avaliar(PALESTRA, 11, 3, 0).situacao;
        assertTrue(s == Situacao.FORA_DO_PERIODO || s == Situacao.ENCERRADO_HOJE);
    }

    @Test
    public void cursoDeDoisDiasSegundoDiaNoHorario() {
        assertEquals(Situacao.NO_HORARIO, avaliar(CURSO_2_DIAS, 11, 19, 30).situacao);
        assertEquals(Situacao.ANTES_DO_HORARIO, avaliar(CURSO_2_DIAS, 11, 3, 0).situacao);
    }

    @Test
    public void cursoDeDoisDiasDiaDepoisDoFimEstaForaDoPeriodo() {
        CheckinValidator.Resultado r = avaliar(CURSO_2_DIAS, 12, 19, 30);
        assertEquals(Situacao.FORA_DO_PERIODO, r.situacao);
        assertNull(r.janela);
        assertEquals(Situacao.FORA_DO_PERIODO, avaliar(CURSO_2_DIAS, 9, 19, 30).situacao);
    }

    @Test
    public void encontroQuePassaDaMeiaNoiteFechaNoDiaSeguinte() {
        Evento noturno = evento(Evento.TIPO_PALESTRA, ms(10, 22, 0), ms(11, 1, 0));
        assertEquals(Situacao.NO_HORARIO, avaliar(noturno, 11, 1, 45).situacao);
        assertEquals(Situacao.FORA_DO_PERIODO, avaliar(noturno, 11, 22, 30).situacao);
    }

    @Test
    public void eventoExternoNaoTemCheckin() {
        Evento enem = evento(Evento.TIPO_EXTERNO, ms(10, 13, 0), ms(10, 18, 0));
        assertEquals(Situacao.EVENTO_EXTERNO, avaliar(enem, 10, 14, 0).situacao);
    }
}
