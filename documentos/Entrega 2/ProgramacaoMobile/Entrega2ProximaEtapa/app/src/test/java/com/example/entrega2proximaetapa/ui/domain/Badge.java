package com.example.proximaetapa.domain;

public class Badge {

    public static final String GRUPO_JORNADA = "Jornada";

    public final String nome;
    public final String descricao;
    public final String grupo;
    public final boolean conquistado;

    public Badge(String nome, String descricao, String grupo, boolean conquistado) {
        this.nome = nome;
        this.descricao = descricao;
        this.grupo = grupo;
        this.conquistado = conquistado;
    }
}
