package com.example.proximaetapa.data.remote.dto;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public final class Dtos {

    private Dtos() {
    }

    public static final Map<String, Object> VAZIO = Collections.emptyMap();

    public static class LoginRequest {
        public String email;
        public String password;

        public LoginRequest(String email, String senha) {
            this.email = email;
            this.password = senha;
        }
    }

    public static class RefreshRequest {
        public String refresh_token;

        public RefreshRequest(String refreshToken) {
            this.refresh_token = refreshToken;
        }
    }

    public static class CadastroRequest {
        public String nome;
        public String email;
        public String telefone;
        public String endereco;
        public String cidade;
        public String escola;
        public String senha;
    }

    public static class SignupRequest {
        public String email;
        public String password;
        public Map<String, String> data = new HashMap<>();

        public SignupRequest(CadastroRequest c) {
            email = c.email;
            password = c.senha;
            data.put("nome", c.nome);
            data.put("full_name", c.nome);
            data.put("telefone", c.telefone);
            data.put("endereco", c.endereco);
            data.put("cidade", c.cidade);
            data.put("escola", c.escola);
        }
    }

    public static class AuthResponse {
        public String access_token;
        public String refresh_token;
        public long expires_in;
        public long expires_at;
    }

    public static class RecuperarSenhaRequest {
        public String email;

        public RecuperarSenhaRequest(String email) {
            this.email = email;
        }
    }

    public static class NovaSenhaRequest {
        public String password;

        public NovaSenhaRequest(String novaSenha) {
            this.password = novaSenha;
        }
    }

    public static class Param<T> {
        public T p;

        public Param(T valor) {
            this.p = valor;
        }
    }

    public static class InscricaoRequest {
        public String id;
        public long eventoId;
        public long dataInscricao;
        public String codigoIngresso;

        public InscricaoRequest(String id, long eventoId, long dataInscricao, String codigoIngresso) {
            this.id = id;
            this.eventoId = eventoId;
            this.dataInscricao = dataInscricao;
            this.codigoIngresso = codigoIngresso;
        }
    }

    public static class CancelarRequest {
        public String p_id;

        public CancelarRequest(String id) {
            this.p_id = id;
        }
    }

    public static class MensagemResponse {
        public String mensagem;
    }

    public static class ErroResponse {
        public String message;
        public String code;
        public String details;
        public String hint;
        public String error;
        public String msg;
        public String error_description;
        public String error_code;
        public String erro;
    }
}
