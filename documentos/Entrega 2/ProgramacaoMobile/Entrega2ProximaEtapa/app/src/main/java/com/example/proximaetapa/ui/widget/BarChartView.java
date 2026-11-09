package com.example.proximaetapa.ui.widget;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.util.AttributeSet;
import android.view.View;

import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;

import java.util.ArrayList;
import java.util.List;

import com.example.proximaetapa.R;

public class BarChartView extends View {

    private final List<String> rotulos = new ArrayList<>();
    private final List<Float> valores = new ArrayList<>();
    private final Paint barra = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint texto = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint valorTexto = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF ret = new RectF();
    private final float dp;

    public BarChartView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        dp = getResources().getDisplayMetrics().density;
        barra.setColor(ContextCompat.getColor(context, R.color.pe_roxo));
        texto.setColor(ContextCompat.getColor(context, R.color.pe_texto_sec));
        texto.setTextSize(11 * getResources().getDisplayMetrics().scaledDensity);
        texto.setTextAlign(Paint.Align.CENTER);
        valorTexto.setColor(ContextCompat.getColor(context, R.color.pe_texto));
        valorTexto.setTextSize(12 * getResources().getDisplayMetrics().scaledDensity);
        valorTexto.setTextAlign(Paint.Align.CENTER);
        valorTexto.setFakeBoldText(true);
    }

    public void setDados(List<String> rotulos, List<Float> valores) {
        this.rotulos.clear();
        this.rotulos.addAll(rotulos);
        this.valores.clear();
        this.valores.addAll(valores);
        StringBuilder sb = new StringBuilder("Gráfico de horas certificadas por instituição: ");
        for (int i = 0; i < rotulos.size(); i++) {
            sb.append(rotulos.get(i)).append(' ').append(Math.round(valores.get(i))).append(" horas; ");
        }
        setContentDescription(sb.toString());
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        if (valores.isEmpty()) return;
        float max = 0;
        for (Float v : valores) max = Math.max(max, v);
        if (max <= 0) max = 1;

        float largura = getWidth() - getPaddingLeft() - getPaddingRight();
        float altura = getHeight() - getPaddingTop() - getPaddingBottom();
        float areaRotulo = 22 * dp;
        float areaValor = 18 * dp;
        float alturaUtil = altura - areaRotulo - areaValor;
        int n = valores.size();
        float espaco = 10 * dp;
        float larguraBarra = (largura - espaco * (n - 1)) / n;

        for (int i = 0; i < n; i++) {
            float x = getPaddingLeft() + i * (larguraBarra + espaco);
            float h = alturaUtil * (valores.get(i) / max);
            float base = getPaddingTop() + areaValor + alturaUtil;
            ret.set(x, base - h, x + larguraBarra, base);
            canvas.drawRoundRect(ret, 10 * dp, 10 * dp, barra);
            canvas.drawText(String.valueOf(Math.round(valores.get(i))) + "h",
                    x + larguraBarra / 2, base - h - 5 * dp, valorTexto);
            canvas.drawText(rotulos.get(i), x + larguraBarra / 2,
                    base + 15 * dp, texto);
        }
    }
}
