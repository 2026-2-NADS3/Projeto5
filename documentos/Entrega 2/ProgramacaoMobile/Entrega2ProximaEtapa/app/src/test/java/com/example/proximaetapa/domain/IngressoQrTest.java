package com.example.proximaetapa.domain;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;

import org.junit.Test;

import com.example.proximaetapa.data.local.entity.Evento;
import com.example.proximaetapa.data.local.entity.Inscricao;

public class IngressoQrTest {

    private static final String ID = "3f6c2a1e-8b4d-4c1a-9e2f-7a5b6c8d9e01";
    private static final String CODIGO = "PE-7KQ2MD";

    private static Inscricao inscricao(String status, boolean sincronizado) {
        Inscricao i = new Inscricao();
        i.id = ID;
        i.alunoId = 1;
        i.eventoId = 21;
        i.status = status;
        i.codigoIngresso = CODIGO;
        i.sincronizado = sincronizado;
        return i;
    }

    private static Evento evento(String tipo) {
        Evento e = new Evento();
        e.id = 21;
        e.tipo = tipo;
        return e;
    }

    @Test
    public void qrDaInscricaoAtivaConfirmadaTemOFormatoFixo() {
        String qr = IngressoQr.conteudo(inscricao(Inscricao.ATIVA, true), evento(Evento.TIPO_CURSO));
        assertEquals("PE:INGRESSO:" + ID + ":" + CODIGO, qr);
        assertEquals(IngressoQr.Estado.DISPONIVEL,
                IngressoQr.estado(inscricao(Inscricao.ATIVA, true), evento(Evento.TIPO_CURSO)));
    }

    @Test
    public void qrNaoLevaDadoPessoal() {
        String qr = IngressoQr.conteudo(inscricao(Inscricao.ATIVA, true), evento(Evento.TIPO_CURSO));
        assertEquals(4, qr.split(":").length);
        assertFalse(qr.contains("@"));
    }

    @Test
    public void naoGeraQrParaInscricaoCancelada() {
        Inscricao cancelada = inscricao(Inscricao.CANCELADA, true);
        assertNull(IngressoQr.conteudo(cancelada, evento(Evento.TIPO_CURSO)));
        assertEquals(IngressoQr.Estado.INDISPONIVEL, IngressoQr.estado(cancelada, evento(Evento.TIPO_CURSO)));
    }

    @Test
    public void naoGeraQrParaEventoExterno() {
        assertNull(IngressoQr.conteudo(inscricao(Inscricao.ATIVA, true), evento(Evento.TIPO_EXTERNO)));
    }

    @Test
    public void inscricaoOfflineFicaSincronizandoSemQr() {
        Inscricao offline = inscricao(Inscricao.ATIVA, false);
        assertNull(IngressoQr.conteudo(offline, evento(Evento.TIPO_PALESTRA)));
        assertEquals(IngressoQr.Estado.SINCRONIZANDO, IngressoQr.estado(offline, evento(Evento.TIPO_PALESTRA)));
    }
}
