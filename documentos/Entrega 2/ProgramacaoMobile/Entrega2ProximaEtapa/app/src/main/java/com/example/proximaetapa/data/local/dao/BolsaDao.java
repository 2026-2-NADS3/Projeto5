package com.example.proximaetapa.data.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Transaction;

import java.util.List;

import com.example.proximaetapa.data.local.entity.Bolsa;

@Dao
public abstract class BolsaDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    public abstract void salvarTodas(List<Bolsa> bolsas);

    @Query("DELETE FROM bolsas")
    public abstract void apagarTodas();

    @Transaction
    public void substituirTodas(List<Bolsa> bolsas) {
        apagarTodas();
        salvarTodas(bolsas);
    }

    @Query("SELECT * FROM bolsas WHERE destaque = 1 ORDER BY nome")
    public abstract LiveData<List<Bolsa>> observarDestaques();

    @Query("SELECT * FROM bolsas WHERE internacional = 1 ORDER BY nome")
    public abstract LiveData<List<Bolsa>> observarInternacionais();

    @Query("SELECT * FROM bolsas WHERE id = :id")
    public abstract LiveData<Bolsa> observar(long id);
}
