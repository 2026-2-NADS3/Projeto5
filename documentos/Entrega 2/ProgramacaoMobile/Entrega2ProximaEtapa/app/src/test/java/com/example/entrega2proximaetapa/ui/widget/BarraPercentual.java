package com.example.proximaetapa.ui.widget;

import android.view.View;

import androidx.constraintlayout.widget.ConstraintLayout;

public final class BarraPercentual {

    private BarraPercentual() {
    }

    public static void definir(View preenchimento, int percentual) {
        int p = Math.max(0, Math.min(100, percentual));
        if (p == 0) {
            preenchimento.setVisibility(View.INVISIBLE);
            return;
        }
        preenchimento.setVisibility(View.VISIBLE);
        ConstraintLayout.LayoutParams lp = (ConstraintLayout.LayoutParams) preenchimento.getLayoutParams();
        lp.matchConstraintPercentWidth = p / 100f;
        preenchimento.setLayoutParams(lp);
    }
}
