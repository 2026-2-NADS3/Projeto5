package com.example.proximaetapa.data.local.entity;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.Index;
import androidx.room.PrimaryKey;

@Entity(tableName = "presencas",
        indices = {@Index(value = {"alunoId", "eventoId", "dataEncontro"}, unique = true)})
public class Presenca {

    @PrimaryKey
    @NonNull
    public String id = "";

    public long alunoId;
    public long eventoId;
    public String dataEncontro;
    public long registradoEm;
    public String origem;
}
