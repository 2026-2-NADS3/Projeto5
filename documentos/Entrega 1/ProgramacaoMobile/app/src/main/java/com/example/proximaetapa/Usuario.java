package com.example.proximaetapa;

public class Usuario {

    private String nome;
    private String email;
    private String escola;

    public Usuario(String nome, String email, String escola) {
        this.nome = nome;
        this.email = email;
        this.escola = escola;
    }

    public String getNome() {
        return nome;
    }

    public String getEmail() {
        return email;
    }

    public String getEscola() {
        return escola;
    }
}
