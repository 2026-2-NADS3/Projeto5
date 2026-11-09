package com.example.proximaetapa.data.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.Query;

import java.util.List;

import com.example.proximaetapa.data.local.entity.MensagemChat;

@Dao
public interface MensagemChatDao {

    @Insert
    void inserir(MensagemChat mensagem);

    @Query("SELECT * FROM mensagens_chat ORDER BY data, id")
    LiveData<List<MensagemChat>> observarTodas();

    @Query("SELECT COUNT(*) FROM mensagens_chat")
    int contar();
}
