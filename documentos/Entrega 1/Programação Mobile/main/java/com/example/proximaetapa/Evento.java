package com.example.proximaetapa;

/**
 * Classe de modelo (POJO) que representa um evento/atividade da agenda do
 * aluno (tela Calendário), seguindo o mesmo padrão de Livro.java/Pet.java
 * visto em aula.
 *
 * Além dos textos (tema, local e horário), a classe guarda o horário em
 * números inteiros (hora e minuto de início/fim) e calcula a partir deles
 * a carga horária do evento em horas — o "dado numérico" exigido na função
 * principal desta etapa (Agenda individual do estudante).
 */
public class Evento {

    private String tema;
    private String local;
    private int horaInicio;
    private int minutoInicio;
    private int horaFim;
    private int minutoFim;

    public Evento(String tema, String local, int horaInicio, int minutoInicio, int horaFim, int minutoFim) {
        this.tema = tema;
        this.local = local;
        this.horaInicio = horaInicio;
        this.minutoInicio = minutoInicio;
        this.horaFim = horaFim;
        this.minutoFim = minutoFim;
    }

    public String getTema() {
        return tema;
    }

    public String getLocal() {
        return local;
    }

    /**
     * Monta o texto "13:00 às 17:30" a partir dos números guardados na classe.
     */
    public String getHorarioFormatado() {
        return formatarHora(horaInicio, minutoInicio) + " às " + formatarHora(horaFim, minutoFim);
    }

    private String formatarHora(int hora, int minuto) {
        // Deixa o minuto sempre com dois dígitos, ex: 5 -> "05"
        String minutoTexto = (minuto < 10) ? "0" + minuto : String.valueOf(minuto);
        return hora + ":" + minutoTexto;
    }

    /**
     * Dado numérico do evento: calcula a carga horária (em horas) a partir
     * dos horários de início e fim, ex: 13:00 às 17:30 = 4.5 horas.
     */
    public double getCargaHorariaEmHoras() {
        int minutosTotais = (horaFim * 60 + minutoFim) - (horaInicio * 60 + minutoInicio);
        return minutosTotais / 60.0;
    }
}
