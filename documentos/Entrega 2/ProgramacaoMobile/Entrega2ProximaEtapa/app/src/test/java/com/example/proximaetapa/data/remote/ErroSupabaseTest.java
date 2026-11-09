package com.example.proximaetapa.data.remote;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import com.example.proximaetapa.data.remote.dto.Dtos;

public class ErroSupabaseTest {

    private static Dtos.ErroResponse auth(String error, String descricao, String msg, String codigo) {
        Dtos.ErroResponse e = new Dtos.ErroResponse();
        e.error = error;
        e.error_description = descricao;
        e.msg = msg;
        e.error_code = codigo;
        return e;
    }

    private static Dtos.ErroResponse rest(String code, String message) {
        Dtos.ErroResponse e = new Dtos.ErroResponse();
        e.code = code;
        e.message = message;
        return e;
    }

    @Test
    public void loginInvalidoNosDoisFormatosDoAuth() {
        assertEquals(ApiClient.MSG_LOGIN_INVALIDO, ApiClient.mensagemDeErro(400,
                auth("invalid_grant", "Invalid login credentials", null, null)));
        assertEquals(ApiClient.MSG_LOGIN_INVALIDO, ApiClient.mensagemDeErro(400,
                auth(null, null, "Invalid login credentials", "invalid_credentials")));
    }

    @Test
    public void emailJaCadastrado() {
        assertEquals(ApiClient.MSG_EMAIL_JA_CADASTRADO, ApiClient.mensagemDeErro(422,
                auth(null, null, "User already registered", "user_already_exists")));
    }

    @Test
    public void jwtExpiradoOu401ViramSessaoExpirada() {
        assertEquals(ApiClient.MSG_SESSAO_EXPIRADA, ApiClient.mensagemDeErro(401, rest("PGRST301", "JWT expired")));
        assertEquals(ApiClient.MSG_SESSAO_EXPIRADA, ApiClient.mensagemDeErro(401, null));
    }

    @Test
    public void regraDeNegocioDoBancoECampoErroAntigo() {
        assertEquals("Conclua os testes de perfil antes de se inscrever.", ApiClient.mensagemDeErro(400,
                rest("P0001", "Conclua os testes de perfil antes de se inscrever.")));
        Dtos.ErroResponse antigo = new Dtos.ErroResponse();
        antigo.erro = "Mensagem da API antiga";
        assertEquals("Mensagem da API antiga", ApiClient.mensagemDeErro(422, antigo));
    }
}
