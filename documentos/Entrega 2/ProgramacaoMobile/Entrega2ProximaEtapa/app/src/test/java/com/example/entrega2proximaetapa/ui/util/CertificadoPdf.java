package com.example.proximaetapa.util;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.graphics.pdf.PdfDocument;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import androidx.core.content.FileProvider;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

import com.example.proximaetapa.data.local.entity.Certificado;

public final class CertificadoPdf {

    private static final int LARGURA = 842;
    private static final int ALTURA = 595;

    private CertificadoPdf() {
    }

    private static PdfDocument montar(Certificado c, String nomeAluno) {
        PdfDocument doc = new PdfDocument();
        PdfDocument.Page pagina = doc.startPage(
                new PdfDocument.PageInfo.Builder(LARGURA, ALTURA, 1).create());
        Canvas cv = pagina.getCanvas();

        Paint fundo = new Paint();
        fundo.setColor(Color.WHITE);
        cv.drawRect(0, 0, LARGURA, ALTURA, fundo);

        Paint borda = new Paint(Paint.ANTI_ALIAS_FLAG);
        borda.setStyle(Paint.Style.STROKE);
        borda.setStrokeWidth(10);
        borda.setColor(Color.parseColor("#6F2FB2"));
        cv.drawRoundRect(new RectF(24, 24, LARGURA - 24, ALTURA - 24), 24, 24, borda);

        Paint faixa = new Paint();
        faixa.setColor(Color.parseColor("#51C600"));
        cv.drawRect(24, 110, LARGURA - 24, 116, faixa);

        Paint marca = texto(26, true, "#4A1080");
        cv.drawText("PRÓXIMA ETAPA", LARGURA / 2f, 85, marca);

        cv.drawText("CERTIFICADO DE PARTICIPAÇÃO", LARGURA / 2f, 175, texto(30, true, "#2C293D"));
        cv.drawText("Certificamos que", LARGURA / 2f, 230, texto(16, false, "#5B5770"));
        cv.drawText(nomeAluno, LARGURA / 2f, 280, texto(34, true, "#6F2FB2"));
        cv.drawText("concluiu o curso \"" + c.titulo + "\"", LARGURA / 2f, 330, texto(18, false, "#2C293D"));
        cv.drawText("oferecido em parceria com " + c.instituicao + ", com carga horária de "
                + c.cargaHoraria + " horas.", LARGURA / 2f, 360, texto(16, false, "#2C293D"));
        cv.drawText("Emitido em " + DateUtils.data(c.dataEmissao), LARGURA / 2f, 420,
                texto(14, false, "#5B5770"));
        cv.drawText("Código de validação: " + c.codigoValidacao, LARGURA / 2f, 520,
                texto(12, false, "#5B5770"));

        doc.finishPage(pagina);
        return doc;
    }

    private static Paint texto(float tamanho, boolean negrito, String cor) {
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setTextSize(tamanho);
        p.setColor(Color.parseColor(cor));
        p.setTextAlign(Paint.Align.CENTER);
        p.setTypeface(Typeface.create(Typeface.SANS_SERIF, negrito ? Typeface.BOLD : Typeface.NORMAL));
        return p;
    }

    private static String nomeArquivo(Certificado c) {
        return "certificado_" + c.id + "_" + c.titulo.replaceAll("[^A-Za-z0-9]+", "_") + ".pdf";
    }

    public static Uri gerarParaVisualizar(Context ctx, Certificado c, String nomeAluno) throws IOException {
        File pasta = ctx.getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS);
        if (pasta == null) pasta = ctx.getCacheDir();
        File arquivo = new File(pasta, nomeArquivo(c));
        PdfDocument doc = montar(c, nomeAluno);
        try (FileOutputStream out = new FileOutputStream(arquivo)) {
            doc.writeTo(out);
        } finally {
            doc.close();
        }
        return FileProvider.getUriForFile(ctx, ctx.getPackageName() + ".fileprovider", arquivo);
    }

    public static Uri baixar(Context ctx, Certificado c, String nomeAluno) throws IOException {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            return gerarParaVisualizar(ctx, c, nomeAluno);
        }
        ContentResolver cr = ctx.getContentResolver();
        ContentValues v = new ContentValues();
        v.put(MediaStore.Downloads.DISPLAY_NAME, nomeArquivo(c));
        v.put(MediaStore.Downloads.MIME_TYPE, "application/pdf");
        v.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/ProximaEtapa");
        Uri uri = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
        if (uri == null) throw new IOException("Não foi possível criar o arquivo em Downloads");
        PdfDocument doc = montar(c, nomeAluno);
        try (OutputStream out = cr.openOutputStream(uri)) {
            if (out == null) throw new IOException("Falha ao abrir o arquivo");
            doc.writeTo(out);
        } finally {
            doc.close();
        }
        return uri;
    }
}
