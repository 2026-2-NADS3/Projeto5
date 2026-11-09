package com.example.proximaetapa.data.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Transaction;

import java.util.List;

import com.example.proximaetapa.data.local.entity.Evento;

@Dao
public abstract class EventoDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    public abstract void salvarTodos(List<Evento> eventos);

    @Query("DELETE FROM eventos")
    public abstract void apagarTodos();

    @Transaction
    public void substituirTodos(List<Evento> eventos) {
        apagarTodos();
        salvarTodos(eventos);
    }

    @Query("SELECT * FROM eventos ORDER BY dataInicio")
    public abstract LiveData<List<Evento>> observarTodos();

    @Query("SELECT * FROM eventos WHERE id = :id")
    public abstract LiveData<Evento> observar(long id);

    @Query("SELECT * FROM eventos WHERE id = :id")
    public abstract Evento buscar(long id);

    @Query("SELECT * FROM eventos")
    public abstract List<Evento> listarTodos();
}
