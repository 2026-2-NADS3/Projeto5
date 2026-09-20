package com.example.proximaetapa;

/**
 * Classe de modelo (POJO) que representa o aluno da Próxima Etapa.
 *
 * Segue o mesmo padrão usado em aula para classes como Livro.java e Pet.java:
 * atributos privados + construtor + métodos getters. Ela guarda os dados
 * digitados nas telas de Cadastro/Login para serem exibidos na tela de Perfil.
 */
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
