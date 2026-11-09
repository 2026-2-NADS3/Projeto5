package com.example.proximaetapa.domain;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import com.example.proximaetapa.data.local.entity.Evento;

public final class CheckinValidator {

    public enum Situacao {
        NO_HORARIO,
        ANTES_DO_HORARIO,
        ENCERRADO_HOJE,
        FORA_DO_PERIODO,
        EVENTO_EXTERNO
    }

    public static final class Janela {
        public final ZonedDateTime abre;
        public final ZonedDateTime fecha;

        Janela(ZonedDateTime abre, ZonedDateTime fecha) {
            this.abre = abre;
            this.fecha = fecha;
        }

        boolean contem(ZonedDateTime t) {
            return !t.isBefore(abre) && !t.isAfter(fecha);
        }
    }

    public static final class Resultado {
        public final Situacao situacao;
        public final Janela janela;

        Resultado(Situacao situacao, Janela janela) {
            this.situacao = situacao;
            this.janela = janela;
        }

        public LocalTime abreAs() {
            return janela == null ? null : janela.abre.toLocalTime();
        }

        public LocalTime fechaAs() {
            return janela == null ? null : janela.fecha.toLocalTime();
        }
    }

    public static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");
    public static final Duration TOLERANCIA = Duration.ofHours(1);

    private final Clock clock;

    public CheckinValidator(Clock clock) {
        this.clock = clock;
    }

    public Resultado avaliar(Evento evento) {
        return avaliar(evento.tipo, evento.dataInicio, evento.dataFim);
    }

    public Resultado avaliar(String tipo, long dataInicio, long dataFim) {
        if (Evento.TIPO_EXTERNO.equals(tipo)) return new Resultado(Situacao.EVENTO_EXTERNO, null);

        ZonedDateTime agora = ZonedDateTime.now(clock).withZoneSameInstant(FUSO);
        ZonedDateTime inicio = Instant.ofEpochMilli(dataInicio).atZone(FUSO);
        ZonedDateTime fim = Instant.ofEpochMilli(dataFim).atZone(FUSO);

        LocalTime horaInicio = inicio.toLocalTime();
        LocalTime horaFim = fim.toLocalTime();
        boolean viraDia = !horaFim.isAfter(horaInicio);

        LocalDate primeiroDia = inicio.toLocalDate();
        LocalDate ultimoDia = fim.toLocalDate();
        if (viraDia && ultimoDia.isAfter(primeiroDia)) ultimoDia = ultimoDia.minusDays(1);

        LocalDate hoje = agora.toLocalDate();
        for (LocalDate d : new LocalDate[]{hoje.minusDays(1), hoje, hoje.plusDays(1)}) {
            if (ehDiaDoEvento(d, primeiroDia, ultimoDia)) {
                Janela j = janela(d, horaInicio, horaFim, viraDia);
                if (j.contem(agora)) return new Resultado(Situacao.NO_HORARIO, j);
            }
        }

        if (ehDiaDoEvento(hoje, primeiroDia, ultimoDia)) {
            Janela j = janela(hoje, horaInicio, horaFim, viraDia);
            return new Resultado(agora.isBefore(j.abre)
                    ? Situacao.ANTES_DO_HORARIO
                    : Situacao.ENCERRADO_HOJE, j);
        }
        return new Resultado(Situacao.FORA_DO_PERIODO, null);
    }

    private static boolean ehDiaDoEvento(LocalDate d, LocalDate primeiro, LocalDate ultimo) {
        return !d.isBefore(primeiro) && !d.isAfter(ultimo);
    }

    private static Janela janela(LocalDate dia, LocalTime horaInicio, LocalTime horaFim, boolean viraDia) {
        ZonedDateTime abre = dia.atTime(horaInicio).atZone(FUSO).minus(TOLERANCIA);
        LocalDate diaFim = viraDia ? dia.plusDays(1) : dia;
        ZonedDateTime fecha = diaFim.atTime(horaFim).atZone(FUSO).plus(TOLERANCIA);
        return new Janela(abre, fecha);
    }
}
