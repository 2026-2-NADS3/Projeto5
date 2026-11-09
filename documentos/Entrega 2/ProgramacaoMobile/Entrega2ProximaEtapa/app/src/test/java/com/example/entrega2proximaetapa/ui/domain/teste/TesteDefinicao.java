package com.example.proximaetapa.domain.teste;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class TesteDefinicao {

    public String id;
    public String titulo;
    public String subtitulo;
    public int duracaoMinutos;
    public String instrucao;
    public List<Pergunta> perguntas = new ArrayList<>();
    public Map<String, PerfilResultado> perfis = new LinkedHashMap<>();

    public static class Pergunta {
        public String texto;
        public List<Alternativa> alternativas = new ArrayList<>();
    }

    public static class Alternativa {
        public String texto;
        public String dimensao;
        public int pontos;
    }

    public static class PerfilResultado {
        public String nome;
        public String descricao;
        public List<String> sugestoes = new ArrayList<>();
    }
}
