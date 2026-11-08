import { useOne, type HttpError } from "@refinedev/core";
import { ArrowLeft, Lock, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { TextareaField } from "../../components/ui/form/Field";
import { useAcaoAdmin } from "../../hooks/useAcaoAdmin";
import { formatarDataHora } from "../../lib/datas";
import { LIMITE_RESPOSTA, podeResponder } from "../../regras/comunicacao";
import type { Duvida } from "../../types/dominio";
import { ROTULO_STATUS_DUVIDA } from "./rotulos";
import styles from "./Comunicacao.module.css";

/** Conversa de uma dúvida (tela 9.10): histórico, campo de resposta e botão para fechar. */
export function DuvidaPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [resposta, setResposta] = useState("");
  const [erro, setErro] = useState<string | undefined>();
  const [confirmandoFechar, setConfirmandoFechar] = useState(false);
  const [aviso, setAviso] = useState<{ tom: "success" | "danger"; texto: string } | null>(null);
  const { executar, executando } = useAcaoAdmin();

  const { result: duvida, query } = useOne<Duvida>({ resource: "duvidas", id });

  if (query.isLoading) return <p>Carregando dúvida...</p>;
  if (query.isError || !duvida) {
    return (
      <Alert tone="danger" title="Dúvida não encontrada">
        {query.error?.message ?? "Confira o endereço e tente de novo."}
      </Alert>
    );
  }

  const aberta = podeResponder(duvida.status);

  const responder = async (evento: FormEvent) => {
    evento.preventDefault();
    setAviso(null);
    if (!resposta.trim()) {
      setErro("Escreva a resposta.");
      return;
    }
    try {
      await executar("post", `/admin/duvidas/${duvida.id}/respostas`, { texto: resposta });
      setResposta("");
      setAviso({ tom: "success", texto: "Resposta enviada. O aluno é avisado no app." });
    } catch (falha) {
      setAviso({ tom: "danger", texto: (falha as HttpError).message ?? "Não foi possível enviar a resposta." });
    }
  };

  const fechar = async () => {
    setAviso(null);
    try {
      await executar("patch", `/admin/duvidas/${duvida.id}/fechar`);
      setAviso({ tom: "success", texto: "Dúvida fechada." });
    } catch (falha) {
      setAviso({ tom: "danger", texto: (falha as HttpError).message ?? "Não foi possível fechar a dúvida." });
    } finally {
      setConfirmandoFechar(false);
    }
  };

  const tom = duvida.status === "ABERTA" ? "danger" : duvida.status === "RESPONDIDA" ? "success" : "neutral";

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => navigate("/comunicacao?aba=abertas")} className={styles.voltar}>
        <ArrowLeft size={16} aria-hidden="true" />
        Dúvidas
      </Button>

      <Card accent={aberta ? "yellow" : "neutral"}>
        <div className={styles.cabecalho}>
          <div>
            <Badge tone={tom}>{ROTULO_STATUS_DUVIDA[duvida.status]}</Badge>
            <h1 className={styles.assunto}>{duvida.assunto}</h1>
            <p className={styles.autor}>
              <Link to={`/alunos/${duvida.aluno.id}`}>{duvida.aluno.nome}</Link> · {duvida.aluno.email}
            </p>
          </div>
          {aberta && (
            <Button variant="ghost" size="sm" onClick={() => setConfirmandoFechar(true)} disabled={executando}>
              <Lock size={14} aria-hidden="true" />
              Fechar dúvida
            </Button>
          )}
        </div>
      </Card>

      <ol className={styles.conversa} aria-label="Conversa">
        {duvida.mensagens.map((m) => (
          <li key={m.id} className={`${styles.fala} ${m.autor === "ADMIN" ? styles.falaEquipe : styles.falaAluno}`}>
            <span className={styles.falaAutor}>
              {m.autor === "ADMIN" ? "Equipe" : duvida.aluno.nome.split(" ")[0]} · {formatarDataHora(m.criadaEm)}
            </span>
            <p>{m.texto}</p>
          </li>
        ))}
      </ol>

      <div aria-live="polite">{aviso && <Alert tone={aviso.tom}>{aviso.texto}</Alert>}</div>

      {aberta ? (
        <form className={styles.resposta} onSubmit={responder} noValidate>
          <TextareaField
            label="Sua resposta"
            value={resposta}
            maxLength={LIMITE_RESPOSTA}
            rows={3}
            onChange={(e) => {
              setResposta(e.target.value);
              setErro(undefined);
            }}
            error={erro}
            hint="O aluno recebe a resposta no app."
          />
          <div className={styles.rodape}>
            <span />
            <Button type="submit" disabled={executando}>
              <Send size={16} aria-hidden="true" />
              Responder
            </Button>
          </div>
        </form>
      ) : (
        <Alert tone="info">Esta dúvida foi fechada. Se precisar, o aluno abre outra pelo app.</Alert>
      )}

      <ConfirmDialog
        open={confirmandoFechar}
        title="Fechar esta dúvida?"
        confirmLabel="Fechar dúvida"
        busy={executando}
        onConfirm={fechar}
        onCancel={() => setConfirmandoFechar(false)}
      >
        <p>Depois de fechada, a dúvida não recebe mais respostas. Se precisar, o aluno abre outra pelo app.</p>
      </ConfirmDialog>
    </>
  );
}
