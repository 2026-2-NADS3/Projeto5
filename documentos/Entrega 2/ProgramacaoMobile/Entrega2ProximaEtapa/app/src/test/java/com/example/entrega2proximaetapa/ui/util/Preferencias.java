package com.example.proximaetapa.util;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.appcompat.app.AppCompatDelegate;

public final class Preferencias {

    private static final String ARQUIVO = "pe_config";
    private static final String K_TEMA_ESCURO = "tema_escuro";
    private static final String K_NOTIFICACOES = "notificacoes";
    private static final String K_BALAO_VISTO = "balao_proxia_visto";

    private Preferencias() {
    }

    private static SharedPreferences prefs(Context ctx) {
        return ctx.getApplicationContext().getSharedPreferences(ARQUIVO, Context.MODE_PRIVATE);
    }

    public static boolean temaEscuro(Context ctx) {
        return prefs(ctx).getBoolean(K_TEMA_ESCURO, false);
    }

    public static void setTemaEscuro(Context ctx, boolean escuro) {
        prefs(ctx).edit().putBoolean(K_TEMA_ESCURO, escuro).apply();
        aplicarTema(ctx);
    }

    public static void aplicarTema(Context ctx) {
        AppCompatDelegate.setDefaultNightMode(temaEscuro(ctx)
                ? AppCompatDelegate.MODE_NIGHT_YES
                : AppCompatDelegate.MODE_NIGHT_NO);
    }

    public static boolean notificacoesAtivas(Context ctx) {
        return prefs(ctx).getBoolean(K_NOTIFICACOES, true);
    }

    public static void setNotificacoesAtivas(Context ctx, boolean ativas) {
        prefs(ctx).edit().putBoolean(K_NOTIFICACOES, ativas).apply();
    }

    public static boolean balaoProxiaVisto(Context ctx) {
        return prefs(ctx).getBoolean(K_BALAO_VISTO, false);
    }

    public static void setBalaoProxiaVisto(Context ctx) {
        prefs(ctx).edit().putBoolean(K_BALAO_VISTO, true).apply();
    }
}
