package com.example.proximaetapa.data.local;

import android.content.Context;

import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;

import com.example.proximaetapa.data.local.dao.AlunoDao;
import com.example.proximaetapa.data.local.dao.BolsaDao;
import com.example.proximaetapa.data.local.dao.CertificadoDao;
import com.example.proximaetapa.data.local.dao.EventoDao;
import com.example.proximaetapa.data.local.dao.InscricaoDao;
import com.example.proximaetapa.data.local.dao.MensagemChatDao;
import com.example.proximaetapa.data.local.dao.NotificacaoDao;
import com.example.proximaetapa.data.local.dao.PresencaDao;
import com.example.proximaetapa.data.local.dao.ResultadoTesteDao;
import com.example.proximaetapa.data.local.entity.Aluno;
import com.example.proximaetapa.data.local.entity.Bolsa;
import com.example.proximaetapa.data.local.entity.Certificado;
import com.example.proximaetapa.data.local.entity.Evento;
import com.example.proximaetapa.data.local.entity.Inscricao;
import com.example.proximaetapa.data.local.entity.MensagemChat;
import com.example.proximaetapa.data.local.entity.Notificacao;
import com.example.proximaetapa.data.local.entity.Presenca;
import com.example.proximaetapa.data.local.entity.ResultadoTeste;

@Database(
        entities = {
                Aluno.class, Evento.class, Inscricao.class, Presenca.class, Certificado.class,
                Notificacao.class, Bolsa.class, ResultadoTeste.class, MensagemChat.class
        },
        version = 5,
        exportSchema = false)
public abstract class AppDatabase extends RoomDatabase {

    private static volatile AppDatabase instancia;

    public abstract AlunoDao alunoDao();

    public abstract EventoDao eventoDao();

    public abstract InscricaoDao inscricaoDao();

    public abstract PresencaDao presencaDao();

    public abstract CertificadoDao certificadoDao();

    public abstract NotificacaoDao notificacaoDao();

    public abstract BolsaDao bolsaDao();

    public abstract ResultadoTesteDao resultadoTesteDao();

    public abstract MensagemChatDao mensagemChatDao();

    public static AppDatabase get(Context context) {
        if (instancia == null) {
            synchronized (AppDatabase.class) {
                if (instancia == null) {
                    instancia = Room.databaseBuilder(context.getApplicationContext(),
                                    AppDatabase.class, "proxima_etapa.db")
                            .fallbackToDestructiveMigration()
                            .build();
                }
            }
        }
        return instancia;
    }
}
