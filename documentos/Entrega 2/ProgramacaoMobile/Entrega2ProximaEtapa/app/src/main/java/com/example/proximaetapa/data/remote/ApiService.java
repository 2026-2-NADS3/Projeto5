package com.example.proximaetapa.data.remote;

import java.util.List;
import java.util.Map;

import com.example.proximaetapa.data.local.entity.Aluno;
import com.example.proximaetapa.data.local.entity.Bolsa;
import com.example.proximaetapa.data.local.entity.Certificado;
import com.example.proximaetapa.data.local.entity.Evento;
import com.example.proximaetapa.data.local.entity.Inscricao;
import com.example.proximaetapa.data.local.entity.Notificacao;
import com.example.proximaetapa.data.local.entity.Presenca;
import com.example.proximaetapa.data.local.entity.ResultadoTeste;
import com.example.proximaetapa.data.remote.dto.Dtos;
import com.example.proximaetapa.domain.teste.TesteDefinicao;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Query;

public interface ApiService {

    @POST("auth/v1/token?grant_type=password")
    Call<Dtos.AuthResponse> login(@Body Dtos.LoginRequest corpo);

    @POST("auth/v1/signup")
    Call<Dtos.AuthResponse> cadastrar(@Body Dtos.SignupRequest corpo);

    @POST("auth/v1/recover")
    Call<Void> recuperarSenha(@Query("redirect_to") String redirecionarPara,
                              @Body Dtos.RecuperarSenhaRequest corpo);

    @PUT("auth/v1/user")
    Call<Void> alterarSenha(@Body Dtos.NovaSenhaRequest corpo);

    @POST("auth/v1/logout")
    Call<Void> logout();

    @POST("rest/v1/rpc/meu_perfil")
    Call<Aluno> meuPerfil(@Body Map<String, Object> vazio);

    @POST("rest/v1/rpc/atualizar_perfil")
    Call<Aluno> atualizarPerfil(@Body Dtos.Param<Aluno> corpo);

    @POST("rest/v1/rpc/excluir_conta")
    Call<Dtos.MensagemResponse> excluirConta(@Body Map<String, Object> vazio);

    @POST("rest/v1/rpc/listar_eventos")
    Call<List<Evento>> eventos(@Body Map<String, Object> vazio);

    @POST("rest/v1/rpc/minhas_inscricoes")
    Call<List<Inscricao>> inscricoes(@Body Map<String, Object> vazio);

    @POST("rest/v1/rpc/inscrever")
    Call<Inscricao> inscrever(@Body Dtos.Param<Dtos.InscricaoRequest> corpo);

    @POST("rest/v1/rpc/cancelar_inscricao")
    Call<Dtos.MensagemResponse> cancelarInscricao(@Body Dtos.CancelarRequest corpo);

    @POST("rest/v1/rpc/minhas_presencas")
    Call<List<Presenca>> presencas(@Body Map<String, Object> vazio);

    @POST("rest/v1/rpc/meus_certificados")
    Call<List<Certificado>> certificados(@Body Map<String, Object> vazio);

    @POST("rest/v1/rpc/listar_bolsas")
    Call<List<Bolsa>> bolsas(@Body Map<String, Object> vazio);

    @POST("rest/v1/rpc/listar_notificacoes")
    Call<List<Notificacao>> notificacoes(@Body Map<String, Object> vazio);

    @POST("rest/v1/rpc/listar_testes")
    Call<List<TesteDefinicao>> testes(@Body Map<String, Object> vazio);

    @POST("rest/v1/rpc/salvar_resultado_teste")
    Call<ResultadoTeste> enviarResultado(@Body Dtos.Param<ResultadoTeste> corpo);
}
