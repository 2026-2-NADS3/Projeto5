package com.example.proximaetapa.ui;

import android.content.Context;
import android.content.Intent;

import androidx.appcompat.app.AppCompatActivity;

import com.example.proximaetapa.R;
import com.example.proximaetapa.data.repository.AppRepository;
import com.example.proximaetapa.ui.auth.LoginActivity;
import com.example.proximaetapa.util.SessionManager;

public final class SessaoGuard {

    private SessaoGuard() {
    }

    public static void observar(AppCompatActivity activity) {
        SessionManager sessao = SessionManager.get(activity);
        Context app = activity.getApplicationContext();
        sessao.sessaoExpirada().observe(activity, expirou -> {
            if (!Boolean.TRUE.equals(expirou)) return;
            sessao.limparAvisoSessaoExpirada();
            AppRepository.get(app).encerrarSessaoExpirada(() -> {
                Intent i = new Intent(app, LoginActivity.class);
                i.putExtra(LoginActivity.EXTRA_AVISO, app.getString(R.string.sessao_expirada));
                i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                app.startActivity(i);
            });
        });
    }
}
