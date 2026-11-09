package com.example.proximaetapa.data.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Transaction;

import java.util.List;

import com.example.proximaetapa.data.local.entity.Certificado;

@Dao
public abstract class CertificadoDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    public abstract void salvarTodos(List<Certificado> certificados);

    @Query("DELETE FROM certificados WHERE alunoId = :alunoId")
    public abstract void apagarDoAluno(long alunoId);

    @Transaction
    public void substituir(long alunoId, List<Certificado> certificados) {
        apagarDoAluno(alunoId);
        salvarTodos(certificados);
    }

    @Query("SELECT * FROM certificados WHERE alunoId = :alunoId ORDER BY dataEmissao DESC")
    public abstract LiveData<List<Certificado>> observar(long alunoId);
}
