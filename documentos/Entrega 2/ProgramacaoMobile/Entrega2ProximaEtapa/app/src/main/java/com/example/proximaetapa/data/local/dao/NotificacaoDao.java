package com.example.proximaetapa.data.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import java.util.List;

import com.example.proximaetapa.data.local.entity.Notificacao;

@Dao
public interface NotificacaoDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void salvarTodas(List<Notificacao> notificacoes);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void salvar(Notificacao notificacao);

    @Query("SELECT * FROM notificacoes")
    List<Notificacao> listarTodas();

    @Query("SELECT * FROM notificacoes WHERE removida = 0 AND (expiraEm IS NULL OR expiraEm > :agora) "
            + "ORDER BY dataPublicacao DESC")
    LiveData<List<Notificacao>> observarAtivas(long agora);

    @Query("UPDATE notificacoes SET lida = 1 WHERE id = :id")
    void marcarLida(long id);

    @Query("UPDATE notificacoes SET removida = :removida WHERE id = :id")
    void definirRemovida(long id, boolean removida);
}
