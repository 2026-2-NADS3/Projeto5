package com.example.proximaetapa.data.local.entity;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.Index;
import androidx.room.PrimaryKey;

@Entity(tableName = "resultados_teste", indices = {@Index("alunoId")})
public class ResultadoTeste {

    @PrimaryKey
    @NonNull
    public String id = "";

    public long alunoId;
    public String tipo;
    public String codigo;
    public String perfil;
    public String pontuacoesJson;
    public long data;
    public boolean sincronizado;
}
