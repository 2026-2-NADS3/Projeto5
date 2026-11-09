package com.example.proximaetapa.domain;

import java.util.Calendar;
import java.util.TimeZone;

public final class ParticipacaoCalculator {

    public static final int PERCENTUAL_MINIMO_CERTIFICADO = 75;

    private ParticipacaoCalculator() {
    }

    public static int percentual(int presencas, int encontros) {
        if (encontros <= 0) return 0;
        int p = Math.round(presencas * 100f / encontros);
        return Math.max(0, Math.min(100, p));
    }

    public static boolean elegivelCertificado(int presencas, int totalEncontros) {
        return totalEncontros > 0 && presencas * 100 >= PERCENTUAL_MINIMO_CERTIFICADO * totalEncontros;
    }

    public static int presencasFaltantes(int presencas, int totalEncontros) {
        int necessarias = (int) Math.ceil(totalEncontros * PERCENTUAL_MINIMO_CERTIFICADO / 100.0);
        return Math.max(0, necessarias - presencas);
    }

    public static int encontrosOcorridos(long inicio, long fim, int totalEncontros, long agora,
                                         TimeZone fuso) {
        if (agora < inicio || totalEncontros <= 0) return 0;
        long limite = Math.min(agora, fim);
        int dias = diasEntre(inicio, limite, fuso) + 1;
        return Math.max(0, Math.min(totalEncontros, dias));
    }

    public static int diasEntre(long de, long ate, TimeZone fuso) {
        Calendar a = inicioDoDia(de, fuso);
        Calendar b = inicioDoDia(ate, fuso);
        long diff = b.getTimeInMillis() - a.getTimeInMillis();
        return (int) Math.round(diff / (24.0 * 60 * 60 * 1000));
    }

    private static Calendar inicioDoDia(long millis, TimeZone fuso) {
        Calendar c = Calendar.getInstance(fuso);
        c.setTimeInMillis(millis);
        c.set(Calendar.HOUR_OF_DAY, 0);
        c.set(Calendar.MINUTE, 0);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        return c;
    }
}
