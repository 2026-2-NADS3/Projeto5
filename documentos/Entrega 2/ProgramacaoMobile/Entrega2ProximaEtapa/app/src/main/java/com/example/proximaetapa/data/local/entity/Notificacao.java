package com.example.proximaetapa.data.local.entity;

import androidx.room.Entity;
import androidx.room.Index;
import androidx.room.PrimaryKey;

@Entity(tableName = "notificacoes", indices = {@Index("dataPublicacao")})
public class Notificacao {

    public static final String TIPO_PALESTRA = "PALESTRA";
    public static final String TIPO_EXTERNO = "EXTERNO";
    public static final String TIPO_CURSO = "CURSO";
    public static final String TIPO_CERTIFICADO = "CERTIFICADO";
    public static final String TIPO_AVISO = "AVISO";
    public static final String TIPO_AGENDA = "AGENDA";

    @PrimaryKey
    public long id;

    public String titulo;
    public String mensagem;
    public String tipo;
    public Long eventoId;
    public long dataPublicacao;
    public Long expiraEm;

    public boolean lida;
    public boolean removida;
    public boolean exibidaNoSistema;
}
