import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente único do Supabase usado pelo painel.
 *
 * Só usa a chave PÚBLICA (publishable/anon). Quem pode ver o quê é decidido
 * pelas regras RLS do banco (supabase/painel_admin.sql): só quem tem o papel
 * 'admin' em user_roles enxerga os dados de todos os alunos.
 */
const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

/** O que falta no .env para o painel conseguir falar com o banco (vazio = tudo certo). */
export const problemasDeConfiguracao: string[] = [
  ...(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)
    ? ["VITE_SUPABASE_URL deve ser a Project URL, no formato https://<projeto>.supabase.co"]
    : []),
  ...(!chave ? ["VITE_SUPABASE_ANON_KEY está vazia (use a chave publishable ou anon public)"] : []),
  ...(chave.startsWith("sb_secret_") || chave.includes("service_role")
    ? ["VITE_SUPABASE_ANON_KEY tem uma chave SECRETA. Ela iria para o navegador: use a publishable/anon"]
    : []),
];

export const supabaseConfigurado = problemasDeConfiguracao.length === 0;

/** Só existe quando a configuração está correta; main.tsx mostra o erro antes de qualquer tela usar. */
export const supabase: SupabaseClient = supabaseConfigurado
  ? createClient(url, chave, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "proxima-etapa:supabase-auth" } })
  : (null as unknown as SupabaseClient);
