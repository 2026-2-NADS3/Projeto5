package com.example.proximaetapa.data.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Transaction;

import java.util.List;

import com.example.proximaetapa.data.local.entity.Inscricao;
import com.example.proximaetapa.data.local.entity.InscricaoComEvento;

@Dao
public abstract class InscricaoDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    public abstract void salvar(Inscricao inscricao);

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    public abstract void salvarSeNaoExistir(List<Inscricao> inscricoes);

    @Query("DELETE FROM inscricoes WHERE alunoId = :alunoId AND sincronizado = 1")
    public abstract void apagarSincronizadas(long alunoId);

    @Transaction
    public void substituirSincronizadas(long alunoId, List<Inscricao> doServidor) {
        apagarSincronizadas(alunoId);
        salvarSeNaoExistir(doServidor);
    }

    @Transaction
    @Query("SELECT * FROM inscricoes WHERE alunoId = :alunoId AND status = 'ATIVA' ORDER BY dataInscricao DESC")
    public abstract LiveData<List<InscricaoComEvento>> observarAtivasComEvento(long alunoId);

    @Query("SELECT * FROM inscricoes WHERE alunoId = :alunoId AND status = 'ATIVA'")
    public abstract LiveData<List<Inscricao>> observarAtivas(long alunoId);

    @Transaction
    @Query("SELECT * FROM inscricoes WHERE id = :id")
    public abstract LiveData<InscricaoComEvento> observarComEvento(String id);

    @Query("SELECT * FROM inscricoes WHERE alunoId = :alunoId AND eventoId = :eventoId LIMIT 1")
    public abstract LiveData<Inscricao> observarPorEvento(long alunoId, long eventoId);

    @Query("SELECT * FROM inscricoes WHERE alunoId = :alunoId AND eventoId = :eventoId LIMIT 1")
    public abstract Inscricao buscarPorEvento(long alunoId, long eventoId);

    @Query("SELECT * FROM inscricoes WHERE id = :id")
    public abstract Inscricao buscar(String id);

    @Query("SELECT eventoId FROM inscricoes WHERE alunoId = :alunoId AND status = 'ATIVA'")
    public abstract List<Long> idsEventosAtivos(long alunoId);

    @Query("SELECT * FROM inscricoes WHERE sincronizado = 0")
    public abstract List<Inscricao> pendentes();

    @Query("UPDATE inscricoes SET sincronizado = 1 WHERE id = :id")
    public abstract void marcarSincronizada(String id);

    @Query("DELETE FROM inscricoes WHERE id = :id")
    public abstract void apagar(String id);

    @Transaction
    public void confirmar(Inscricao local, Inscricao doServidor) {
        if (doServidor == null || doServidor.id == null || doServidor.id.isEmpty()) {
            marcarSincronizada(local.id);
            return;
        }
        doServidor.alunoId = local.alunoId;
        if (doServidor.eventoId == 0) doServidor.eventoId = local.eventoId;
        if (doServidor.status == null) doServidor.status = local.status;
        if (doServidor.codigoIngresso == null) doServidor.codigoIngresso = local.codigoIngresso;
        doServidor.sincronizado = true;
        if (!doServidor.id.equals(local.id)) apagar(local.id);
        salvar(doServidor);
    }
}
