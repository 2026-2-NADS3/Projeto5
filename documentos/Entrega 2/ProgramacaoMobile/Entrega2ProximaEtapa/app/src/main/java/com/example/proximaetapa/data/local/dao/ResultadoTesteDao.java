package com.example.proximaetapa.data.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import java.util.List;

import com.example.proximaetapa.data.local.entity.ResultadoTeste;

@Dao
public interface ResultadoTesteDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void salvar(ResultadoTeste resultado);

    @Query("SELECT * FROM resultados_teste WHERE alunoId = :alunoId ORDER BY data DESC")
    LiveData<List<ResultadoTeste>> observarTodos(long alunoId);

    @Query("SELECT * FROM resultados_teste WHERE id = :id")
    LiveData<ResultadoTeste> observar(String id);

    @Query("SELECT COUNT(DISTINCT tipo) FROM resultados_teste WHERE alunoId = :alunoId")
    int contarTiposConcluidos(long alunoId);

    @Query("SELECT * FROM resultados_teste WHERE sincronizado = 0")
    List<ResultadoTeste> pendentes();

    @Query("UPDATE resultados_teste SET sincronizado = 1 WHERE id = :id")
    void marcarSincronizado(String id);
}
