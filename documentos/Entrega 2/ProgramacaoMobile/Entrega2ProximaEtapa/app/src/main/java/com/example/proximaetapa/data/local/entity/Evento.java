package com.example.proximaetapa.data.local.entity;

import androidx.room.Entity;
import androidx.room.Index;
import androidx.room.PrimaryKey;

@Entity(tableName = "eventos", indices = {@Index("dataInicio")})
public class Evento {

    public static final String TIPO_CURSO = "CURSO";
    public static final String TIPO_PALESTRA = "PALESTRA";
    public static final String TIPO_EXTERNO = "EXTERNO";

    @PrimaryKey
    public long id;

    public String titulo;
    public String descricao;
    public String instituicao;
    public String local;
    public String tipo;
    public String categoria;
    public long dataInicio;
    public long dataFim;
    public int cargaHoraria;
    public int totalEncontros;
    public String linkExterno;
    public boolean requerTestes;

    public boolean isExterno() {
        return TIPO_EXTERNO.equals(tipo);
    }

    public boolean isCurso() {
        return TIPO_CURSO.equals(tipo);
    }

    public boolean jaTerminou(long agora) {
        return dataFim < agora;
    }
}
