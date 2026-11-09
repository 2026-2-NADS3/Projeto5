package com.example.proximaetapa.data.local.entity;

import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "alunos")
public class Aluno {

    @PrimaryKey
    public long id;

    public String nome;
    public String email;
    public String matricula;
    public String telefone;
    public String linkedin;
    public String endereco;
    public String cidade;
    public String escola;
    public String interesses;

    public boolean perfilCompleto() {
        return preenchido(nome) && preenchido(cidade) && preenchido(escola)
                && preenchido(linkedin) && preenchido(interesses);
    }

    public String primeiroNome() {
        if (nome == null || nome.trim().isEmpty()) return "";
        return nome.trim().split("\\s+")[0];
    }

    public String iniciais() {
        if (nome == null || nome.trim().isEmpty()) return "?";
        String[] p = nome.trim().split("\\s+");
        String s = p[0].substring(0, 1);
        if (p.length > 1) s += p[p.length - 1].substring(0, 1);
        return s.toUpperCase();
    }

    private static boolean preenchido(String s) {
        return s != null && !s.trim().isEmpty();
    }
}
