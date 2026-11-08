import type { AuthProvider } from "@refinedev/core";
import { supabase } from "../lib/supabase";

/**
 * Login do painel pelo Supabase Auth.
 *
 * Só entra quem tem o papel 'admin' em public.user_roles (função has_role do banco).
 * Um aluno com conta no app que tentar entrar aqui é desconectado na hora.
 */

interface CredenciaisLogin {
  email?: string;
  password?: string;
}

const LOGIN_INVALIDO = { name: "Login inválido", message: "E-mail ou senha incorretos." };
const SEM_PERMISSAO = { name: "Sem permissão", message: "Esta conta não tem acesso ao painel da equipe." };

async function ehAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  return !error && data === true;
}

export const authProvider: AuthProvider = {
  login: async ({ email, password }: CredenciaisLogin) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email?.trim().toLowerCase() ?? "",
      password: password ?? "",
    });
    // Mensagem genérica: não revela se o erro foi no e-mail ou na senha.
    if (error || !data.user) return { success: false, error: LOGIN_INVALIDO };

    if (!(await ehAdmin(data.user.id))) {
      await supabase.auth.signOut();
      return { success: false, error: SEM_PERMISSAO };
    }
    return { success: true, redirectTo: "/" };
  },

  logout: async () => {
    await supabase.auth.signOut();
    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session ? { authenticated: true } : { authenticated: false, redirectTo: "/login" };
  },

  getIdentity: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const nome = (data.user.user_metadata?.full_name as string | undefined) ?? data.user.email ?? "Administrador";
    return { id: data.user.id, nome, email: data.user.email ?? "", papel: "ADMIN" };
  },

  getPermissions: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session ? "ADMIN" : null;
  },

  onError: async (error: { statusCode?: number; status?: number }) => {
    const status = error?.statusCode ?? error?.status;
    return status === 401 ? { logout: true, redirectTo: "/login" } : {};
  },
};
