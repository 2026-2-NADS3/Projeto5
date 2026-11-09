package com.example.proximaetapa.ui.chat;

import android.os.Bundle;
import android.view.inputmethod.EditorInfo;
import android.widget.EditText;

import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;

import com.example.proximaetapa.R;
import com.example.proximaetapa.data.repository.AppRepository;
import com.example.proximaetapa.ui.BaseActivity;
import com.example.proximaetapa.ui.adapter.MensagemAdapter;
import com.example.proximaetapa.util.SessionManager;

public class ChatActivity extends BaseActivity {

    private AppRepository repo;
    private EditText edtMensagem;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_chat);
        configurarToolbar(R.string.proxia);
        repo = AppRepository.get(this);

        RecyclerView rv = findViewById(R.id.rv_mensagens);
        rv.setLayoutManager(new GridLayoutManager(this, 1));
        MensagemAdapter adapter = new MensagemAdapter();
        rv.setAdapter(adapter);

        repo.mensagensChat().observe(this, lista -> {
            adapter.setItens(lista);
            if (adapter.getItemCount() > 0) rv.scrollToPosition(adapter.getItemCount() - 1);
        });

        String nome = SessionManager.get(this).getNome();
        repo.garantirSaudacao(nome.isEmpty() ? "" : nome.split("\\s+")[0]);

        edtMensagem = findViewById(R.id.edt_mensagem);
        findViewById(R.id.btn_enviar).setOnClickListener(v -> enviar(edtMensagem.getText().toString()));
        edtMensagem.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_SEND) {
                enviar(edtMensagem.getText().toString());
                return true;
            }
            return false;
        });

        ChipGroup sugestoes = findViewById(R.id.chips_sugestoes);
        for (String pergunta : getResources().getStringArray(R.array.chat_sugestoes)) {
            Chip c = new Chip(this);
            c.setText(pergunta);
            c.setOnClickListener(v -> enviar(pergunta));
            sugestoes.addView(c);
        }
    }

    private void enviar(String texto) {
        String t = texto == null ? "" : texto.trim();
        if (t.isEmpty()) return;
        repo.enviarMensagemChat(t);
        edtMensagem.setText("");
    }
}
