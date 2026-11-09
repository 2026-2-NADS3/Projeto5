package com.example.proximaetapa.ui.widget;

import android.text.method.HideReturnsTransformationMethod;
import android.text.method.PasswordTransformationMethod;
import android.widget.EditText;
import android.widget.ImageButton;

import com.example.proximaetapa.R;

public final class CampoSenha {

    private CampoSenha() {
    }

    public static void configurar(EditText campo, ImageButton botao) {
        atualizar(campo, botao, false);
        botao.setOnClickListener(v -> {
            boolean estaOculta = campo.getTransformationMethod() instanceof PasswordTransformationMethod;
            atualizar(campo, botao, estaOculta);
        });
    }

    private static void atualizar(EditText campo, ImageButton botao, boolean mostrar) {
        int cursor = campo.getSelectionEnd();
        campo.setTransformationMethod(mostrar
                ? HideReturnsTransformationMethod.getInstance()
                : PasswordTransformationMethod.getInstance());
        if (cursor >= 0) campo.setSelection(Math.min(cursor, campo.length()));
        botao.setImageResource(mostrar ? R.drawable.ic_olho_off : R.drawable.ic_olho);
        botao.setContentDescription(campo.getContext().getString(
                mostrar ? R.string.ocultar_senha : R.string.mostrar_senha));
    }
}
