package com.example.proximaetapa;

import android.app.Application;

import com.example.proximaetapa.util.NotificationHelper;
import com.example.proximaetapa.util.Preferencias;

public class App extends Application {

    @Override
    public void onCreate() {
        super.onCreate();
        Preferencias.aplicarTema(this);
        NotificationHelper.criarCanais(this);
    }
}
