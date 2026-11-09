package com.example.proximaetapa.domain;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class ChatbotFaqTest {

    private static void assertContem(String pergunta, String trecho) {
        String resposta = ChatbotFaq.responder(pergunta);
        assertTrue("Pergunta: \"" + pergunta + "\"\nResposta: " + resposta, resposta.contains(trecho));
    }

    @Test
    public void sugestoesDoChat() {
        assertContem("Como registro minha presença?", "QR Code do ingresso");
        assertContem("Quando sai meu certificado?", "75%");
        assertContem("Como funcionam as bolsas?", "aba Bolsas");
        assertContem("Posso cancelar uma inscrição?", "72h");
        assertContem("O que são os testes de perfil?", "DISC");
    }

    @Test
    public void naoConfundePedacoDePalavraComSaudacao() {
        // "foi", "depois" e "oito" contêm "oi", mas não são saudação
        assertContem("meu evento foi cancelado?", "72h");
        assertEquals(ChatbotFaq.RESPOSTA_PADRAO, ChatbotFaq.responder("depois de oito dias"));
    }

    @Test
    public void editarPerfilNaoViraTesteDePerfil() {
        assertContem("como edito meu perfil?", "Editar perfil");
        assertContem("quero mudar meu telefone", "Editar perfil");
    }

    @Test
    public void assuntosNovos() {
        assertContem("como apago minha conta", "Apagar minha conta");
        assertContem("apagar aviso", "arraste");
        assertContem("esqueci a senha", "Esqueci minha senha");
        assertContem("quantas faltas eu tenho", "Participação nos cursos");
        assertContem("quando é o ENEM?", "Acessar site oficial");
        assertContem("como ativo o modo escuro", "Tema escuro");
        assertContem("o que são badges", "Ver badges");
        assertContem("check-in abre que horas", "1h antes");
    }

    @Test
    public void saudacaoEAgradecimento() {
        assertEquals(ChatbotFaq.RESPOSTA_SAUDACAO, ChatbotFaq.responder("Oi!"));
        assertEquals(ChatbotFaq.RESPOSTA_SAUDACAO, ChatbotFaq.responder("Bom dia"));
        assertEquals(ChatbotFaq.RESPOSTA_AGRADECIMENTO, ChatbotFaq.responder("valeu!"));
    }

    @Test
    public void perguntaDesconhecida() {
        assertEquals(ChatbotFaq.RESPOSTA_PADRAO, ChatbotFaq.responder("qual a capital da França?"));
    }
}
