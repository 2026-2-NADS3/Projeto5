import { useLogin } from "@refinedev/core";
import { useState, type FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";
import { TextField } from "../../components/ui/TextField";
import styles from "./LoginPage.module.css";

/** Tela 9.1 — login do administrador. */
export function LoginPage() {
  const { mutate: entrar, isPending } = useLogin();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setErro(null);
    entrar(
      { email, password: senha },
      {
        onSuccess: (resultado) => {
          if (!resultado.success) setErro(resultado.error?.message ?? "Não foi possível entrar.");
        },
      },
    );
  };

  return (
    <div className={styles.page}>
      <section className={styles.marca} aria-label="Próxima Etapa">
        <span className={styles.sticker}>
          <Logo size="lg" />
        </span>
        <div className={styles.marcaTexto}>
          <p className={styles.eyebrow}>Painel da equipe</p>
          <p className={styles.slogan}>Palestras, presença e certificados dos alunos em um só lugar.</p>
        </div>
        {/* A seta em zigue-zague do logo: o caminho até a próxima etapa. */}
        <svg className={styles.seta} viewBox="0 0 320 120" aria-hidden="true">
          <path
            d="M10 20 C 60 10, 70 60, 120 55 S 170 100, 230 90 L 270 86"
            fill="none"
            stroke="currentColor"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path d="M262 62 L 306 84 L 266 112 Z" fill="currentColor" />
        </svg>
      </section>

      <section className={styles.formArea}>
        <form className={styles.form} onSubmit={enviar} noValidate>
          <div>
            <h1 className={styles.title}>Entrar</h1>
            <p className={styles.subtitle}>Use o e-mail e a senha da sua conta de administrador.</p>
          </div>

          <TextField
            label="E-mail"
            type="email"
            name="email"
            autoComplete="username"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Senha"
            type="password"
            name="senha"
            autoComplete="current-password"
            placeholder="Sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />

          {erro && (
            <p className={styles.error} role="alert">
              {erro}
            </p>
          )}

          <Button type="submit" fullWidth disabled={isPending || !email || !senha}>
            {isPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </section>
    </div>
  );
}
