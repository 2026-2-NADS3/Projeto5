-- =============================================================================
-- Painel administrativo (admin-web) — preparação do banco Supabase
--
-- Rodar UMA vez em: Supabase > SQL Editor > New query > colar tudo > Run.
-- Pode rodar de novo sem problema (tudo é "if not exists" / "drop ... if exists").
--
-- Só ACRESCENTA coisas. Nenhuma tabela, coluna ou regra usada pelo app Android
-- é alterada ou apagada, então o app continua funcionando igual.
-- =============================================================================

-- 1) Colunas novas em eventos -------------------------------------------------
--    vagas: limite de inscrições (null = sem limite definido ainda)
--    lista_encerrada: o admin clicou "Encerrar lista" (gera faltas, fecha o check-in)
alter table public.eventos add column if not exists vagas integer check (vagas is null or vagas > 0);
alter table public.eventos add column if not exists lista_encerrada boolean not null default false;

-- Presença marcada à mão pelo admin (a origem continua 'LEITOR', valor que o app já conhece).
alter table public.presencas add column if not exists registro_manual boolean not null default false;

-- 2) Faltas e bloqueios (regra 4.1: 2 pontos = 30 dias sem novas inscrições) ---
create table if not exists public.bloqueios (
  id         uuid primary key default gen_random_uuid(),
  aluno_id   bigint not null references public.alunos(id) on delete cascade,
  inicio     timestamptz not null default now(),
  fim        timestamptz not null,
  cancelado  boolean not null default false
);

create table if not exists public.faltas (
  id          uuid primary key default gen_random_uuid(),
  aluno_id    bigint not null references public.alunos(id) on delete cascade,
  evento_id   bigint not null references public.eventos(id) on delete cascade,
  justificada boolean not null default false,
  bloqueio_id uuid references public.bloqueios(id) on delete set null,
  criada_em   timestamptz not null default now(),
  unique (aluno_id, evento_id)
);

create index if not exists faltas_aluno_idx on public.faltas (aluno_id);
create index if not exists bloqueios_aluno_idx on public.bloqueios (aluno_id);

alter table public.faltas enable row level security;
alter table public.bloqueios enable row level security;
grant select, insert, update, delete on public.faltas, public.bloqueios to authenticated;

-- O aluno (app) pode LER as próprias faltas e bloqueios.
drop policy if exists "aluno_le_proprias_faltas" on public.faltas;
create policy "aluno_le_proprias_faltas" on public.faltas for select to authenticated
  using (aluno_id in (select a.id from public.alunos a where a.user_id = auth.uid()));

drop policy if exists "aluno_le_proprios_bloqueios" on public.bloqueios;
create policy "aluno_le_proprios_bloqueios" on public.bloqueios for select to authenticated
  using (aluno_id in (select a.id from public.alunos a where a.user_id = auth.uid()));

-- 3) Acesso do ADMIN (RLS) ------------------------------------------------------
--    Hoje cada aluno só enxerga os próprios dados. eventos, notificacoes, testes_perfil e
--    user_roles JÁ têm regra de admin; aqui entram as tabelas que ainda não têm.
--    As regras que já existem para os alunos continuam valendo.
do $$
declare
  t text;
begin
  foreach t in array array[
    'alunos', 'inscricoes', 'presencas', 'certificados', 'resultados_teste', 'faltas', 'bloqueios'
  ] loop
    execute format('drop policy if exists "admin_painel_tudo" on public.%I', t);
    execute format(
      'create policy "admin_painel_tudo" on public.%I for all to authenticated
         using (public.has_role((select auth.uid()), ''admin''))
         with check (public.has_role((select auth.uid()), ''admin''))', t);
  end loop;
end $$;

-- 4) Usuário admin do painel ---------------------------------------------------
--    O usuário admin@proximaetapa.test já foi criado no Supabase Auth. O gatilho
--    handle_new_user o cadastrou como 'student' (e um teste criou uma linha em alunos);
--    aqui ele vira admin.
--    Para tornar OUTRA conta admin, rode este bloco trocando o e-mail.
do $$
declare
  v_email text := 'admin@proximaetapa.test';
  v_user  uuid;
begin
  select id into v_user from auth.users where lower(email) = lower(v_email);
  if v_user is null then
    raise notice 'Usuário % não encontrado em auth.users.', v_email;
    return;
  end if;

  insert into public.user_roles (user_id, role)
  select v_user, 'admin'
  where not exists (select 1 from public.user_roles where user_id = v_user and role = 'admin');

  delete from public.user_roles where user_id = v_user and role = 'student';

  -- Admin não é aluno: remove só se ele não tiver nada ligado (inscrição, presença...).
  delete from public.alunos a
  where a.user_id = v_user
    and not exists (select 1 from public.inscricoes i where i.aluno_id = a.id)
    and not exists (select 1 from public.presencas p where p.aluno_id = a.id)
    and not exists (select 1 from public.resultados_teste r where r.aluno_id = a.id);
end $$;

-- Pronto. Conferência rápida (deve mostrar 'admin'):
select u.email, r.role
from public.user_roles r join auth.users u on u.id = r.user_id
where r.role = 'admin';
