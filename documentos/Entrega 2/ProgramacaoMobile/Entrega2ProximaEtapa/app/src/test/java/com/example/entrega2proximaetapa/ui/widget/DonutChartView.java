package com.example.proximaetapa.ui.widget;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.util.AttributeSet;
import android.view.View;

import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;

import com.example.proximaetapa.R;

public class DonutChartView extends View {

    private final Paint fatia = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint centro = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint legenda = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF arco = new RectF();
    private final float dp;

    private int presencas;
    private int faltas;
    private int futuros;
    private final int corPresenca;
    private final int corFalta;
    private final int corFuturo;
    private final int corVazio;

    public DonutChartView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        dp = getResources().getDisplayMetrics().density;
        corPresenca = ContextCompat.getColor(context, R.color.pe_verde_texto);
        corFalta = ContextCompat.getColor(context, R.color.pe_coral);
        corFuturo = ContextCompat.getColor(context, R.color.pe_amarelo);
        corVazio = ContextCompat.getColor(context, R.color.pe_borda);
        fatia.setStyle(Paint.Style.STROKE);
        fatia.setStrokeWidth(26 * dp);
        centro.setTextAlign(Paint.Align.CENTER);
        centro.setColor(ContextCompat.getColor(context, R.color.pe_texto));
        centro.setTextSize(24 * getResources().getDisplayMetrics().scaledDensity);
        centro.setFakeBoldText(true);
        legenda.setTextAlign(Paint.Align.CENTER);
        legenda.setColor(ContextCompat.getColor(context, R.color.pe_texto_sec));
        legenda.setTextSize(11 * getResources().getDisplayMetrics().scaledDensity);
    }

    public void setDados(int presencas, int faltas, int futuros) {
        this.presencas = presencas;
        this.faltas = faltas;
        this.futuros = futuros;
        setContentDescription("Participação: " + presencas + " presenças, " + faltas
                + " faltas e " + futuros + " encontros futuros. " + percentual() + " por cento de presença.");
        invalidate();
    }

    private int percentual() {
        int base = presencas + faltas;
        return base == 0 ? 0 : Math.round(presencas * 100f / base);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        float tamanho = Math.min(getWidth(), getHeight());
        float margem = fatia.getStrokeWidth() / 2 + 2 * dp;
        float cx = getWidth() / 2f;
        float cy = getHeight() / 2f;
        arco.set(cx - tamanho / 2 + margem, cy - tamanho / 2 + margem,
                cx + tamanho / 2 - margem, cy + tamanho / 2 - margem);

        int total = presencas + faltas + futuros;
        if (total == 0) {
            fatia.setColor(corVazio);
            canvas.drawArc(arco, 0, 360, false, fatia);
        } else {
            float inicio = -90;
            int[] valores = {presencas, faltas, futuros};
            int[] cores = {corPresenca, corFalta, corFuturo};
            for (int i = 0; i < valores.length; i++) {
                float angulo = 360f * valores[i] / total;
                if (angulo <= 0) continue;
                fatia.setColor(cores[i]);
                canvas.drawArc(arco, inicio, angulo, false, fatia);
                inicio += angulo;
            }
        }
        canvas.drawText(percentual() + "%", cx, cy + 6 * dp, centro);
        canvas.drawText("presença", cx, cy + 24 * dp, legenda);
    }
}
