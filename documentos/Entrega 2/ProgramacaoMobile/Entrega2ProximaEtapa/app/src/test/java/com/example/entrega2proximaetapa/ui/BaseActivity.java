package com.example.proximaetapa.ui;

import android.os.Bundle;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.appbar.MaterialToolbar;

import com.example.proximaetapa.R;

public abstract class BaseActivity extends AppCompatActivity {

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        SessaoGuard.observar(this);
    }

    protected void configurarToolbar(CharSequence titulo) {
        MaterialToolbar toolbar = findViewById(R.id.toolbar);
        if (toolbar == null) return;
        toolbar.setTitle(titulo);
        toolbar.setNavigationOnClickListener(v -> getOnBackPressedDispatcher().onBackPressed());
    }

    protected void configurarToolbar(int tituloRes) {
        configurarToolbar(getString(tituloRes));
    }
}
