package com.example.proximaetapa.util;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.example.proximaetapa.R;
import com.example.proximaetapa.ui.main.MainActivity;

public final class NotificationHelper {

    public static final String CANAL_AVISOS = "avisos_proxima_etapa";

    private NotificationHelper() {
    }

    public static void criarCanais(Context ctx) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel canal = new NotificationChannel(CANAL_AVISOS,
                    ctx.getString(R.string.canal_notificacao_nome),
                    NotificationManager.IMPORTANCE_DEFAULT);
            canal.setDescription(ctx.getString(R.string.canal_notificacao_desc));
            NotificationManager nm = ctx.getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(canal);
        }
    }

    public static boolean podeNotificar(Context ctx) {
        if (!Preferencias.notificacoesAtivas(ctx)) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS)
                    == PackageManager.PERMISSION_GRANTED;
        }
        return true;
    }

    @SuppressLint("MissingPermission")
    public static void mostrar(Context ctx, int id, String titulo, String texto) {
        if (!podeNotificar(ctx)) return;

        Intent abrir = new Intent(ctx, MainActivity.class);
        abrir.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(ctx, id, abrir,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CANAL_AVISOS)
                .setSmallIcon(R.drawable.ic_notificacoes)
                .setColor(ContextCompat.getColor(ctx, R.color.pe_roxo))
                .setContentTitle(titulo)
                .setContentText(texto)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(texto))
                .setAutoCancel(true)
                .setContentIntent(pi)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT);

        try {
            NotificationManagerCompat.from(ctx).notify(id, b.build());
        } catch (SecurityException ignored) {
        }
    }
}
