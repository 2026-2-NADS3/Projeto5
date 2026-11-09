package com.example.proximaetapa.data.repository;

import android.content.Context;
import android.util.Log;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Reader;
import java.io.Writer;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import com.example.proximaetapa.domain.teste.TesteDefinicao;

public final class TesteRepository {

    private static final String TAG = "TesteRepository";
    private static final String CACHE = "testes_cache.json";
    private static final Type TIPO_LISTA = new TypeToken<List<TesteDefinicao>>() {
    }.getType();

    private static List<TesteDefinicao> cache;

    private TesteRepository() {
    }

    public static synchronized List<TesteDefinicao> todos(Context ctx) {
        if (cache == null) {
            cache = lerArquivoLocal(ctx);
            if (cache == null) cache = lerDoApp(ctx);
            if (cache == null) cache = new ArrayList<>();
        }
        return cache;
    }

    public static TesteDefinicao buscar(Context ctx, String id) {
        for (TesteDefinicao t : todos(ctx)) {
            if (t.id.equals(id)) return t;
        }
        return null;
    }

    public static synchronized void salvar(Context ctx, List<TesteDefinicao> doServidor) {
        if (doServidor == null || doServidor.isEmpty()) return;
        File f = new File(ctx.getApplicationContext().getFilesDir(), CACHE);
        try (Writer w = new OutputStreamWriter(new FileOutputStream(f), StandardCharsets.UTF_8)) {
            new Gson().toJson(doServidor, TIPO_LISTA, w);
            cache = doServidor;
        } catch (Exception e) {
            Log.w(TAG, "Não foi possível salvar os testes localmente", e);
        }
    }

    private static List<TesteDefinicao> lerArquivoLocal(Context ctx) {
        File f = new File(ctx.getApplicationContext().getFilesDir(), CACHE);
        if (!f.exists()) return null;
        try (Reader r = new InputStreamReader(new FileInputStream(f), StandardCharsets.UTF_8)) {
            return new Gson().fromJson(r, TIPO_LISTA);
        } catch (Exception e) {
            Log.w(TAG, "Cache de testes inválido", e);
            return null;
        }
    }

    private static List<TesteDefinicao> lerDoApp(Context ctx) {
        try (InputStream in = ctx.getAssets().open("testes.json");
             Reader r = new InputStreamReader(in, StandardCharsets.UTF_8)) {
            return new Gson().fromJson(r, TIPO_LISTA);
        } catch (Exception e) {
            Log.w(TAG, "testes.json não encontrado", e);
            return null;
        }
    }
}
