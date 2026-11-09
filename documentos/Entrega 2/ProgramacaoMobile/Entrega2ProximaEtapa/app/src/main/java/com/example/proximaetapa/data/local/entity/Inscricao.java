package com.example.proximaetapa.data.local.entity;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.Index;
import androidx.room.PrimaryKey;

@Entity(tableName = "inscricoes",
        indices = {@Index(value = {"alunoId", "eventoId"}, unique = true)})
public class Inscricao {

    public static final String ATIVA = "ATIVA";
    public static final String CANCELADA = "CANCELADA";

    @PrimaryKey
    @NonNull
    public String id = "";

    public long alunoId;
    public long eventoId;
    public long dataInscricao;
    public String status;
    public String codigoIngresso;
    public boolean sincronizado;
}
