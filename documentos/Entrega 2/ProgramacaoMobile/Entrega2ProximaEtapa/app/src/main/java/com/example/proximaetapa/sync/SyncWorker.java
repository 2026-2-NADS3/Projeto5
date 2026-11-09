package com.example.proximaetapa.sync;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.work.BackoffPolicy;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import java.util.concurrent.TimeUnit;

public class SyncWorker extends Worker {

    private static final String UNICA_PERIODICA = "sync_periodica";
    private static final String UNICA_PENDENTES = "sync_pendentes";

    public SyncWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        SyncManager.Resultado r = new SyncManager(getApplicationContext()).sincronizar();
        return r.ok ? Result.success() : Result.retry();
    }

    private static Constraints comInternet() {
        return new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();
    }

    public static void agendarPeriodica(Context ctx) {
        PeriodicWorkRequest req = new PeriodicWorkRequest.Builder(SyncWorker.class, 15, TimeUnit.MINUTES)
                .setConstraints(comInternet())
                .build();
        WorkManager.getInstance(ctx).enqueueUniquePeriodicWork(UNICA_PERIODICA,
                ExistingPeriodicWorkPolicy.KEEP, req);
    }

    public static void sincronizarQuandoOnline(Context ctx) {
        OneTimeWorkRequest req = new OneTimeWorkRequest.Builder(SyncWorker.class)
                .setConstraints(comInternet())
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
                .build();
        WorkManager.getInstance(ctx).enqueueUniqueWork(UNICA_PENDENTES,
                ExistingWorkPolicy.REPLACE, req);
    }

    public static void cancelarTudo(Context ctx) {
        WorkManager.getInstance(ctx).cancelAllWork();
    }
}
