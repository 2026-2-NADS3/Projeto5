package com.example.proximaetapa.domain;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Respostas da ProxIA (FAQ local, sem internet).
 *
 * Como funciona:
 * 1. A pergunta vira uma lista de palavras (sem acento e em minúsculas).
 * 2. Cada assunto tem palavras-chave. "cancel*" (com asterisco) casa com qualquer palavra que
 *    COMECE com "cancel" (cancelar, cancelamento...). Sem asterisco, a palavra tem que ser igual.
 *    Chaves com espaço ("bom dia") procuram a frase inteira.
 * 3. Ganha o assunto com mais chaves encontradas. Empate: vence o que vem primeiro na lista.
 *
 * Para ensinar algo novo à ProxIA, basta adicionar um assunto em TOPICOS.
 */
public final class ChatbotFaq {

    private ChatbotFaq() {
    }

    private static final class Topico {
        final String resposta;
        final String[] chaves;

        Topico(String resposta, String... chaves) {
            this.resposta = resposta;
            this.chaves = chaves;
        }
    }

    // A ordem importa no desempate: assuntos mais específicos vêm antes.
    private static final Topico[] TOPICOS = {
            new Topico("Você pode cancelar a inscrição em Menu > Meus ingressos, no botão \"Cancelar inscrição\" "
                    + "do evento, até 72h antes do início. Atenção: aceitar o convite e não comparecer "
                    + "suspende novas inscrições por 3 meses.",
                    "cancel*", "desist*", "suspen*", "nao vou poder", "nao posso ir"),

            new Topico("O certificado é liberado quando você tem pelo menos 75% de presença nos encontros do "
                    + "curso, e sai ao fim do curso. Ele fica em Menu > Meus certificados: os cursos em verde já "
                    + "podem ser visualizados, baixados (vão para Downloads/ProximaEtapa) ou compartilhados. "
                    + "Os outros mostram quantas presenças ainda faltam.",
                    "certificad*", "diploma*", "pdf"),

            new Topico("Sua presença é registrada pelo QR Code do ingresso: abra Menu > Meus ingressos, toque em "
                    + "\"Abrir convite\" e depois toque no convite para virar e ver o QR Code. Apresente o QR na "
                    + "entrada de cada encontro. O check-in abre 1h antes do início e vai até 1h depois do fim. "
                    + "Se o QR ainda não aparecer, conecte-se à internet para a inscrição ser confirmada.",
                    "presen*", "checkin", "check*", "qr", "qrcode", "ingress*", "convit*", "entrada", "registr*"),

            new Topico("Para acompanhar suas presenças e faltas, abra Menu > Meus ingressos e veja "
                    + "\"Participação nos cursos\". A falta só conta depois que o encontro passa. Você precisa "
                    + "de pelo menos 75% de presença para liberar o certificado.",
                    "falt*", "particip*", "porcent*", "percent*", "frequen*"),

            new Topico("Para se inscrever, vá na tela inicial, em \"Próximas Etapas do seu aprendizado\" > "
                    + "\"Próximos cursos\", toque no card do evento e depois em \"Inscreva-se\". Seu convite com "
                    + "QR Code fica em Menu > Meus ingressos. Alguns cursos só aceitam inscrição de quem já fez "
                    + "os dois testes de perfil.",
                    "inscri*", "inscrev*", "palestr*", "curso*", "vaga*", "evento*"),

            new Topico("Os testes de perfil ficam em Menu > Testes de perfil. São dois: o comportamental (DISC) e o "
                    + "vocacional (RIASEC). No fim você vê seu resultado e cursos sugeridos, e pode refazer quando "
                    + "quiser. Eles servem para orientação de carreira, não são diagnóstico psicológico, e "
                    + "liberam o curso de Soft skills.",
                    "teste*", "disc", "riasec", "vocacion*", "comportament*", "carreira",
                    "teste de perfil", "testes de perfil"),

            new Topico("Para mudar seus dados (nome, telefone, LinkedIn, endereço, escola e interesses), vá em "
                    + "Menu > Editar perfil e toque em Salvar.",
                    "edit*", "alter* dados", "perfil", "linkedin", "telefone", "endere*", "escola", "interess*",
                    "nome", "dados"),

            new Topico("Os badges são conquistas da sua jornada: você ganha completando o perfil, fazendo os testes "
                    + "e concluindo cursos com certificado. Para ver todos, abra a aba Perfil e toque em "
                    + "\"Ver badges\".",
                    "badge*", "conquist*", "medalh*", "nivel", "jornada"),

            new Topico("Para trocar a senha, vá em Menu > Configurações > Alterar senha. Se você esqueceu a senha, "
                    + "toque em \"Esqueci minha senha\" na tela de login e siga o link que chega no seu e-mail.",
                    "senha*", "esqueci"),

            new Topico("Os avisos aparecem na aba Notificações. Para apagar um aviso, arraste-o para o lado. "
                    + "Para ligar ou desligar os avisos no celular, vá em Menu > Configurações > Notificações.",
                    "aviso*", "notifica*"),

            new Topico("Para apagar sua conta, vá em Menu > Configurações > Apagar minha conta. Todos os seus dados "
                    + "são apagados da Próxima Etapa e isso não pode ser desfeito. O app segue a LGPD: mostra "
                    + "somente os seus dados.",
                    "apag* conta", "apag* minha conta", "exclu* conta", "exclu* minha conta",
                    "delet* conta", "delet* minha conta", "exclu*", "delet*", "lgpd", "privacidad*"),

            new Topico("Na aba Bolsas (ícone de livro) você encontra as bolsas em destaque e as bolsas "
                    + "internacionais. Toque em uma bolsa para ver requisitos, prazo e o link oficial de "
                    + "inscrição, que acontece no site da instituição.",
                    "bolsa*", "intercamb*", "prouni", "fies", "exterior", "internaciona*"),

            new Topico("Prazos de ENEM, vestibulares e outros eventos externos aparecem no Calendário. Toque no "
                    + "evento e em \"Acessar site oficial\": a inscrição é feita no site oficial, fora do app.",
                    "enem", "vestibul*", "fuvest", "sisu", "unicamp", "prova*"),

            new Topico("Na aba Calendário você vê, semana a semana, os eventos em que está inscrito(a) e os "
                    + "vestibulares e eventos externos. No detalhe de um evento dá para tocar em \"Adicionar à "
                    + "agenda do celular\".",
                    "calendar*", "agenda*", "semana*", "quando"),

            new Topico("O app funciona mesmo sem internet, mostrando os dados salvos no celular. O que você fizer "
                    + "offline é enviado quando a conexão voltar. Para atualizar na hora, vá em Menu > "
                    + "Configurações > Sincronizar agora.",
                    "sincroni*", "sync", "offline", "internet", "atualiz*", "conexao"),

            new Topico("Para mudar entre tema claro e escuro, vá em Menu > Configurações > Tema escuro.",
                    "tema", "escuro", "noturno", "dark"),

            new Topico("Para sair da conta, abra o Menu e toque em Sair. Os dados salvos no celular são apagados, "
                    + "e você pode entrar de novo quando quiser.",
                    "sair", "logout", "deslog*"),
    };

    private static final Set<String> SAUDACOES = new HashSet<>(Arrays.asList(
            "oi", "ola", "opa", "eai", "hey", "salve", "oii", "oie"));
    private static final String[] SAUDACOES_FRASE = {"bom dia", "boa tarde", "boa noite", "e ai", "tudo bem"};
    private static final Set<String> AGRADECIMENTOS = new HashSet<>(Arrays.asList(
            "obrigado", "obrigada", "obg", "valeu", "vlw", "brigado", "brigada", "agradeco"));

    static final String RESPOSTA_SAUDACAO = "Oi! Eu sou a ProxIA. Posso te ajudar com inscrições, ingressos e "
            + "presença, certificados, bolsas, testes de perfil, calendário e configurações da conta. "
            + "O que você precisa?";
    static final String RESPOSTA_AGRADECIMENTO = "De nada! Se tiver mais alguma dúvida, é só perguntar. 💜";
    static final String RESPOSTA_PADRAO = "Ainda não sei responder isso. Tente perguntar sobre inscrições, "
            + "ingressos e presença, certificados, bolsas, testes de perfil, calendário ou configurações. "
            + "Se precisar, a equipe da Próxima Etapa também pode te ajudar!";

    public static String responder(String mensagem) {
        String[] palavras = palavras(mensagem);
        if (palavras.length == 0) return RESPOSTA_SAUDACAO;
        String frase = " " + String.join(" ", palavras) + " ";

        Topico melhor = null;
        int melhorPontos = 0;
        for (Topico t : TOPICOS) {
            int pontos = pontuar(t, palavras);
            if (pontos > melhorPontos) {
                melhor = t;
                melhorPontos = pontos;
            }
        }
        if (melhor != null) return melhor.resposta;

        for (String p : palavras) {
            if (AGRADECIMENTOS.contains(p)) return RESPOSTA_AGRADECIMENTO;
        }
        for (String p : palavras) {
            if (SAUDACOES.contains(p)) return RESPOSTA_SAUDACAO;
        }
        for (String s : SAUDACOES_FRASE) {
            if (frase.contains(" " + s + " ")) return RESPOSTA_SAUDACAO;
        }
        return RESPOSTA_PADRAO;
    }

    private static int pontuar(Topico t, String[] palavras) {
        int pontos = 0;
        for (String chave : t.chaves) {
            if (chave.contains(" ")) {
                if (casaFrase(chave, palavras)) pontos++;
            } else {
                for (String p : palavras) {
                    if (casa(chave, p)) {
                        pontos++;
                        break;
                    }
                }
            }
        }
        return pontos;
    }

    /** Frase de várias palavras, aceitando "*" em cada uma (ex.: "alter* dados"). */
    private static boolean casaFrase(String chave, String[] palavras) {
        String[] partes = chave.split(" ");
        for (int i = 0; i + partes.length <= palavras.length; i++) {
            boolean ok = true;
            for (int j = 0; j < partes.length && ok; j++) {
                ok = casa(partes[j], palavras[i + j]);
            }
            if (ok) return true;
        }
        return false;
    }

    private static boolean casa(String chave, String palavra) {
        if (chave.endsWith("*")) return palavra.startsWith(chave.substring(0, chave.length() - 1));
        return palavra.equals(chave);
    }

    static String[] palavras(String s) {
        String limpo = semAcento(s).replaceAll("check[\\s-]?in", "checkin")
                .replaceAll("qr[\\s-]?code", "qrcode")
                .replaceAll("[^a-z0-9]+", " ")
                .trim();
        return limpo.isEmpty() ? new String[0] : limpo.split(" ");
    }

    static String semAcento(String s) {
        if (s == null) return "";
        String n = Normalizer.normalize(s, Normalizer.Form.NFD);
        return n.replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT);
    }
}
