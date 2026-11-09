package com.example.proximaetapa.domain;

import java.text.Normalizer;
import java.util.Locale;

public final class ChatbotFaq {

    private ChatbotFaq() {
    }

    public static String responder(String mensagem) {
        String msg = semAcento(mensagem);
        if (contem(msg, "certificado")) {
            return "Seu certificado é liberado quando você participa de pelo menos 75% dos encontros "
                    + "do curso. Depois disso ele aparece em Menu > Meus certificados, pronto para baixar.";
        }
        if (contem(msg, "presenca", "qr", "check")) {
            return "Para registrar presença, abra o convite em Menu > Meus ingressos, toque em "
                    + "\"Registrar presença\" e aponte a câmera para o QR Code mostrado no evento. "
                    + "Se a câmera não funcionar, use \"Digitar código do evento\". Sem internet? "
                    + "A presença fica salva e é enviada quando a conexão voltar.";
        }
        if (contem(msg, "bolsa", "prouni", "fies", "intercambio")) {
            return "Na aba Bolsas (ícone de livro) você encontra bolsas nacionais e internacionais, "
                    + "com requisitos, prazos e o link oficial de inscrição.";
        }
        if (contem(msg, "inscri", "palestra", "vaga")) {
            return "Para se inscrever, toque no card da palestra na tela inicial e depois em "
                    + "\"Inscreva-se\". Seu convite fica guardado em Menu > Meus ingressos.";
        }
        if (contem(msg, "cancel")) {
            return "Você pode cancelar a inscrição em Meus ingressos até 72h antes do evento. "
                    + "Lembre-se: aceitar o convite e não comparecer suspende novas inscrições por 3 meses.";
        }
        if (contem(msg, "teste", "perfil", "disc", "riasec", "vocacional")) {
            return "Os testes de perfil (DISC e vocacional RIASEC) ficam em Menu > Testes de perfil. "
                    + "Eles ajudam na orientação de carreira e não são um diagnóstico psicológico.";
        }
        if (contem(msg, "senha")) {
            return "Para trocar a senha, vá em Menu > Configurações > Alterar senha. "
                    + "Se esqueceu, use \"Esqueci minha senha\" na tela de login.";
        }
        if (contem(msg, "enem", "vestibular", "fuvest", "sisu")) {
            return "Os prazos de ENEM, vestibulares e Sisu aparecem na tela inicial e no calendário "
                    + "(em verde). Toque no card para abrir o site oficial.";
        }
        if (contem(msg, "oi", "ola", "bom dia", "boa tarde", "boa noite")) {
            return "Oi! Eu sou a ProxIA. Posso te ajudar com inscrições, presença por QR Code, "
                    + "certificados, bolsas e testes de perfil. O que você precisa?";
        }
        return "Ainda não sei responder isso, mas a equipe da Próxima Etapa pode te ajudar! "
                + "Tente perguntar sobre inscrições, presença, certificados, bolsas ou testes de perfil.";
    }

    static String semAcento(String s) {
        if (s == null) return "";
        String n = Normalizer.normalize(s, Normalizer.Form.NFD);
        return n.replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT);
    }

    private static boolean contem(String texto, String... palavras) {
        for (String p : palavras) {
            if (texto.contains(p)) return true;
        }
        return false;
    }
}
