package com.example.proximaetapa.util;

import android.app.Activity;
import android.graphics.Rect;
import android.view.View;
import android.view.ViewGroup;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public final class TecladoUtils {

    private TecladoUtils() {
    }

    /**
     * No Android 15+ (edge-to-edge) o adjustResize não encolhe mais a tela quando o teclado abre.
     * Este método faz a tela raiz (o ScrollView do layout) ganhar um espaço embaixo do tamanho do
     * teclado (ou da barra de navegação), assim dá para rolar até o último campo e o botão.
     * O campo em foco também rola sozinho para ficar visível.
     *
     * Chame logo depois do setContentView(...).
     */
    public static void ajustarAoTeclado(Activity activity) {
        View raiz = ((ViewGroup) activity.findViewById(android.R.id.content)).getChildAt(0);
        ViewCompat.setOnApplyWindowInsetsListener(raiz, (v, insets) -> {
            Insets barras = insets.getInsets(WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout());
            Insets teclado = insets.getInsets(WindowInsetsCompat.Type.ime());
            v.setPadding(barras.left, barras.top, barras.right, Math.max(barras.bottom, teclado.bottom));

            View foco = activity.getCurrentFocus();
            if (teclado.bottom > 0 && foco != null) {
                foco.post(() -> {
                    Rect area = new Rect();
                    foco.getDrawingRect(area);
                    foco.requestRectangleOnScreen(area);
                });
            }
            return WindowInsetsCompat.CONSUMED;
        });
    }
}
