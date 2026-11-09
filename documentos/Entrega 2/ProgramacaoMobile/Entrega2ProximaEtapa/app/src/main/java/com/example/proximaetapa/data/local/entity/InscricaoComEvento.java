package com.example.proximaetapa.data.local.entity;

import androidx.room.Embedded;
import androidx.room.Relation;

public class InscricaoComEvento {

    @Embedded
    public Inscricao inscricao;

    @Relation(parentColumn = "eventoId", entityColumn = "id")
    public Evento evento;
}
