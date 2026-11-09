package com.example.proximaetapa.data.local.entity;

import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "bolsas")
public class Bolsa {

    @PrimaryKey
    public long id;

    public String nome;
    public String instituicao;
    public String descricao;
    public String requisitos;
    public String duracao;
    public String prazo;
    public String link;
    public boolean internacional;
    public boolean destaque;
}
