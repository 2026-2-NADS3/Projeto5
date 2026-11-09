package com.example.proximaetapa.ui.main;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.os.Build;
import android.os.Bundle;
import android.view.MenuItem;
import android.view.View;
import android.widget.TextView;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.view.GravityCompat;
import androidx.drawerlayout.widget.DrawerLayout;
import androidx.fragment.app.Fragment;

import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.navigation.NavigationView;
import com.google.android.material.snackbar.Snackbar;

import com.example.proximaetapa.R;
import com.example.proximaetapa.data.repository.AppRepository;
import com.example.proximaetapa.sync.SyncWorker;
import com.example.proximaetapa.ui.SessaoGuard;
import com.example.proximaetapa.ui.auth.LoginActivity;
import com.example.proximaetapa.ui.certificados.CertificadosActivity;
import com.example.proximaetapa.ui.chat.ChatActivity;
import com.example.proximaetapa.ui.config.ConfiguracoesActivity;
import com.example.proximaetapa.ui.ingressos.MeusIngressosActivity;
import com.example.proximaetapa.ui.perfil.EditarPerfilActivity;
import com.example.proximaetapa.ui.testes.TestesActivity;
import com.example.proximaetapa.util.NetworkUtils;
import com.example.proximaetapa.util.Preferencias;
import com.example.proximaetapa.util.SessionManager;

public class MainActivity extends AppCompatActivity {

    public static final String EXTRA_ABA = "aba";

    private DrawerLayout drawer;
    private BottomNavigationView bottomNav;
    private TextView txtOffline;
    private ConnectivityManager.NetworkCallback callbackRede;

    private final ActivityResultLauncher<String> pedirPermissaoNotificacao =
            registerForActivityResult(new ActivityResultContracts.RequestPermission(), concedida -> {
            });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        SessionManager sessao = SessionManager.get(this);
        if (!sessao.estaLogado()) {
            startActivity(new Intent(this, LoginActivity.class));
            finish();
            return;
        }
        setContentView(R.layout.activity_main);

        drawer = findViewById(R.id.drawer_layout);
        bottomNav = findViewById(R.id.bottom_nav);
        txtOffline = findViewById(R.id.txt_offline);
        NavigationView navView = findViewById(R.id.nav_view);

        findViewById(R.id.btn_menu).setOnClickListener(v -> drawer.openDrawer(GravityCompat.START));
        findViewById(R.id.btn_sync).setOnClickListener(v -> sincronizar(true));
        findViewById(R.id.fab_chat).setOnClickListener(v ->
                startActivity(new Intent(this, ChatActivity.class)));

        bottomNav.setOnItemSelectedListener(item -> {
            mostrarFragment(item.getItemId());
            return true;
        });
        navView.setNavigationItemSelectedListener(this::aoEscolherMenu);

        View header = navView.getHeaderView(0);
        TextView txtSaudacao = findViewById(R.id.txt_saudacao);
        AppRepository.get(this).aluno().observe(this, aluno -> {
            if (aluno == null) return;
            txtSaudacao.setText(getString(R.string.saudacao, aluno.primeiroNome()));
            ((TextView) header.findViewById(R.id.txt_header_nome)).setText(aluno.nome);
            ((TextView) header.findViewById(R.id.txt_header_email)).setText(aluno.email);
            ((TextView) header.findViewById(R.id.txt_header_iniciais)).setText(aluno.iniciais());
        });

        if (savedInstanceState == null) {
            int aba = getIntent().getIntExtra(EXTRA_ABA, R.id.nav_home);
            bottomNav.setSelectedItemId(aba);
        }

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (drawer.isDrawerOpen(GravityCompat.START)) {
                    drawer.closeDrawer(GravityCompat.START);
                } else if (bottomNav.getSelectedItemId() != R.id.nav_home) {
                    bottomNav.setSelectedItemId(R.id.nav_home);
                } else {
                    finish();
                }
            }
        });

        SessaoGuard.observar(this);

        mostrarBalaoProxia();
        pedirPermissaoDeNotificacao();
        SyncWorker.agendarPeriodica(this);
        sincronizar(false);
    }

    private void mostrarFragment(int itemId) {
        Fragment f;
        if (itemId == R.id.nav_bolsas) {
            f = new BolsasFragment();
        } else if (itemId == R.id.nav_agenda) {
            f = new CalendarioFragment();
        } else if (itemId == R.id.nav_perfil) {
            f = new PerfilFragment();
        } else {
            f = new HomeFragment();
        }
        getSupportFragmentManager().beginTransaction()
                .setReorderingAllowed(true)
                .replace(R.id.fragment_container, f)
                .commit();
    }

    public void irParaAba(int itemId) {
        bottomNav.setSelectedItemId(itemId);
    }

    private boolean aoEscolherMenu(@NonNull MenuItem item) {
        int id = item.getItemId();
        drawer.closeDrawer(GravityCompat.START);
        if (id == R.id.menu_configuracoes) {
            startActivity(new Intent(this, ConfiguracoesActivity.class));
        } else if (id == R.id.menu_ingressos) {
            startActivity(new Intent(this, MeusIngressosActivity.class));
        } else if (id == R.id.menu_testes) {
            startActivity(new Intent(this, TestesActivity.class));
        } else if (id == R.id.menu_certificados) {
            startActivity(new Intent(this, CertificadosActivity.class));
        } else if (id == R.id.menu_editar_perfil) {
            startActivity(new Intent(this, EditarPerfilActivity.class));
        } else if (id == R.id.menu_ajuda) {
            startActivity(new Intent(this, ChatActivity.class));
        } else if (id == R.id.menu_sair) {
            confirmarLogout();
        }
        return true;
    }

    private void confirmarLogout() {
        new MaterialAlertDialogBuilder(this)
                .setTitle(R.string.sair_titulo)
                .setMessage(R.string.sair_mensagem)
                .setNegativeButton(R.string.cancelar, null)
                .setPositiveButton(R.string.sair, (d, w) ->
                        AppRepository.get(this).logout(() -> {
                            Intent i = new Intent(this, LoginActivity.class);
                            i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                            startActivity(i);
                        }))
                .show();
    }

    private void sincronizar(boolean avisar) {
        AppRepository.get(this).sincronizar(new AppRepository.Callback<String>() {
            @Override
            public void sucesso(String msg) {
                if (avisar) Snackbar.make(bottomNav, msg, Snackbar.LENGTH_SHORT).setAnchorView(R.id.card_nav).show();
            }

            @Override
            public void erro(String msg) {
                if (avisar) Snackbar.make(bottomNav, msg, Snackbar.LENGTH_LONG).setAnchorView(R.id.card_nav).show();
            }
        });
    }

    private void mostrarBalaoProxia() {
        if (Preferencias.balaoProxiaVisto(this)) return;
        View balao = findViewById(R.id.txt_balao_proxia);
        balao.setVisibility(View.VISIBLE);
        balao.setOnClickListener(v -> balao.setVisibility(View.GONE));
        balao.postDelayed(() -> balao.setVisibility(View.GONE), 6000);
        Preferencias.setBalaoProxiaVisto(this);
    }

    private void pedirPermissaoDeNotificacao() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            pedirPermissaoNotificacao.launch(Manifest.permission.POST_NOTIFICATIONS);
        }
    }

    @Override
    protected void onStart() {
        super.onStart();
        if (txtOffline == null) return;
        atualizarAvisoOffline();
        ConnectivityManager cm = getSystemService(ConnectivityManager.class);
        callbackRede = new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(@NonNull Network network) {
                runOnUiThread(() -> {
                    atualizarAvisoOffline();
                    sincronizar(false);
                });
            }

            @Override
            public void onLost(@NonNull Network network) {
                txtOffline.postDelayed(MainActivity.this::atualizarAvisoOffline, 800);
            }
        };
        if (cm != null) cm.registerDefaultNetworkCallback(callbackRede);
    }

    @Override
    protected void onStop() {
        super.onStop();
        ConnectivityManager cm = getSystemService(ConnectivityManager.class);
        if (cm != null && callbackRede != null) {
            try {
                cm.unregisterNetworkCallback(callbackRede);
            } catch (IllegalArgumentException ignored) {
            }
        }
        callbackRede = null;
    }

    private void atualizarAvisoOffline() {
        txtOffline.setVisibility(NetworkUtils.estaOnline(this) ? View.GONE : View.VISIBLE);
    }
}
