package com.example.proximaetapa.util;

import android.graphics.Bitmap;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.journeyapps.barcodescanner.BarcodeEncoder;

public final class QrUtils {

    private QrUtils() {
    }

    public static Bitmap gerar(String conteudo, int tamanhoPx) {
        try {
            return new BarcodeEncoder().encodeBitmap(conteudo, BarcodeFormat.QR_CODE,
                    tamanhoPx, tamanhoPx);
        } catch (WriterException e) {
            return null;
        }
    }
}
