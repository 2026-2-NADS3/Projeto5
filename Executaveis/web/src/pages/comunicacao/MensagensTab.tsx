import { useCustom, useList, type HttpError } from "@refinedev/core";
import { Send } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DataTable, type Coluna } from "../../components/ui/DataTable";
import { InputField, SelectField, TextareaField } from "../../components/ui/form/Field";
import { useAcaoAdmin } from "../../hooks/useAcaoAdmin";
import { formatarDataHora, situacaoDaPalestra } from "../../lib/datas";
import { LIMITE_CORPO, LIMITE_TITULO, validarMensagem } from "../../regras/comunicacao";
import type { ContagemDestinatarios, LetraDisc, Mensagem, MensagemPayload, PalestraDetalhada, Segmento } from "../../types/dominio";
import { ROTULO_DISC } from "../alunos/rotulos";
import { rotuloDaPalestra, rotuloDoSegmento } from "./rotulos";
import styles from "./Comunicacao.module.css";

/**
 * Mensagens segmentadas (tela 9.10): o aluno recebe como notificação no app.
 * Antes de enviar, a confirmação mostra quantos alunos vão receber.
 */
const VAZIA: MensagemPayload = { titulo: "", corpo: "", segmento: "TODOS", palestraId: null, letraDisc: null };

export function MensagensTab() {
  const [dados, setDados] = useState<MensagemPayload>(VAZIA);
  const [erros, setErros] = useState<ReturnType<typeof validarMensagem>>({});
  const [confirmando, setConfirmando] = useState(false);
  const [aviso, setAviso] = useState<{ tom: "success" | "danger"; texto: string } | null>(null);
  const { executar, executando } = useAcaoAdmin();

  const { result: historico, query: historicoQuery } = useList<Mensagem>({ resource: "mensagens", pagination: { mode: "off" } });
  const { result: palestras } = useList<PalestraDetalhada>({ resource: "palestras", pagination: { mode: "off" } });

  // Palestras que ainda vão acontecer primeiro (as mais prováveis de receber aviso).
  const opcoesPalestra = useMemo(() => {
    const abertas = palestras.data.filter((p) => situacaoDaPalestra(p.inicio, p.listaEncerrada) !== "ENCERRADA");
    const encerradas = palestras.data.filter((p) => situacaoDaPalestra(p.inicio, p.listaEncerrada) === "ENCERRADA");
    return {
      abertas: abertas.sort((a, b) => a.inicio.localeCompare(b.inicio)),
      encerradas: encerradas.sort((a, b) => b.inicio.localeCompare(a.inicio)),
    };
  }, [palestras.data]);

  const segmentoCompleto =
    dados.segmento === "TODOS" || (dados.segmento === "PALESTRA" ? Boolean(dados.palestraId) : Boolean(dados.letraDisc));
  const { result: contagem, query: contagemQuery } = useCustom<ContagemDestinatarios>({
    url: "/admin/mensagens/destinatarios",
    method: "get",
    config: { query: { segmento: dados.segmento, palestraId: dados.palestraId ?? "", letraDisc: dados.letraDisc ?? "" } },
    queryOptions: { enabled: segmentoCompleto },
  });
  // Enquanto recalcula, não mostra o número do segmento anterior.
  const destinatarios = segmentoCompleto && contagemQuery.isSuccess && !contagemQuery.isFetching ? contagem.data.total : null;

  const alterar = (mudanca: Partial<MensagemPayload>) => {
    setDados((atual) => ({ ...atual, ...mudanca }));
    setErros({});
  };

  const revisar = (evento: FormEvent) => {
    evento.preventDefault();
    setAviso(null);
    const problemas = validarMensagem(dados);
    setErros(problemas);
    if (Object.keys(problemas).length === 0) setConfirmando(true);
  };

  const enviar = async () => {
    try {
      const enviada = (await executar("post", "/admin/mensagens", { ...dados })) as unknown as Mensagem;
      setAviso({ tom: "success", texto: `Mensagem enviada para ${enviada.destinatarios} aluno(s).` });
      setDados(VAZIA);
    } catch (falha) {
      setAviso({ tom: "danger", texto: (falha as HttpError).message ?? "Não foi possível enviar a mensagem." });
    } finally {
      setConfirmando(false);
    }
  };

  const colunas: Coluna<Mensagem>[] = [
    { key: "data", header: "Enviada em", render: (m) => formatarDataHora(m.enviadaEm) },
    {
      key: "mensagem",
      header: "Mensagem",
      render: (m) => (
        <span className={styles.mensagem}>
          <strong>{m.titulo}</strong>
          <span>{m.corpo}</span>
        </span>
      ),
    },
    { key: "para", header: "Para", render: (m) => rotuloDoSegmento(m, palestras.data) },
    { key: "destinatarios", header: "Alunos", align: "right", render: (m) => m.destinatarios },
  ];

  return (
    <div className={styles.aba}>
      <form className={styles.formulario} onSubmit={revisar} noValidate>
        <h2 className={styles.titulo}>Nova mensagem</h2>
        <InputField
          label="Título"
          value={dados.titulo}
          maxLength={LIMITE_TITULO}
          onChange={(e) => alterar({ titulo: e.target.value })}
          error={erros.titulo}
          hint={`${dados.titulo.length}/${LIMITE_TITULO} · aparece na notificação do app`}
        />
        <TextareaField
          label="Mensagem"
          value={dados.corpo}
          maxLength={LIMITE_CORPO}
          rows={4}
          onChange={(e) => alterar({ corpo: e.target.value })}
          error={erros.corpo}
          hint={`${dados.corpo.length}/${LIMITE_CORPO}`}
        />

        <div className={styles.segmento}>
          <SelectField
            label="Para quem"
            value={dados.segmento}
            onChange={(e) => alterar({ segmento: e.target.value as Segmento, palestraId: null, letraDisc: null })}
          >
            <option value="TODOS">Todos os alunos</option>
            <option value="PALESTRA">Inscritos de uma palestra</option>
            <option value="DISC">Alunos de um perfil DISC</option>
          </SelectField>

          {dados.segmento === "PALESTRA" && (
            <SelectField
              label="Palestra"
              value={dados.palestraId ?? ""}
              onChange={(e) => alterar({ palestraId: e.target.value || null })}
              error={erros.palestraId}
              hint="Confirmados e lista de espera"
            >
              <option value="">Escolha a palestra</option>
              <optgroup label="Próximas">
                {opcoesPalestra.abertas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {rotuloDaPalestra(p)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Encerradas">
                {opcoesPalestra.encerradas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {rotuloDaPalestra(p)}
                  </option>
                ))}
              </optgroup>
            </SelectField>
          )}

          {dados.segmento === "DISC" && (
            <SelectField
              label="Perfil DISC"
              value={dados.letraDisc ?? ""}
              onChange={(e) => alterar({ letraDisc: (e.target.value || null) as LetraDisc | null })}
              error={erros.letraDisc}
            >
              <option value="">Escolha a letra</option>
              {(Object.keys(ROTULO_DISC) as LetraDisc[]).map((letra) => (
                <option key={letra} value={letra}>
                  {letra} · {ROTULO_DISC[letra]}
                </option>
              ))}
            </SelectField>
          )}
        </div>

        <div className={styles.rodape}>
          <p className={styles.alcance} aria-live="polite">
            {segmentoCompleto && destinatarios === null ? "Contando destinatários..." : ""}
            {destinatarios === null ? "" : `Vai para ${destinatarios} aluno(s).`}
          </p>
          <Button type="submit" disabled={executando}>
            <Send size={16} aria-hidden="true" />
            Revisar e enviar
          </Button>
        </div>
      </form>

      <div aria-live="polite">{aviso && <Alert tone={aviso.tom}>{aviso.texto}</Alert>}</div>

      <section className={styles.secao}>
        <h2 className={styles.titulo}>Enviadas</h2>
        {historicoQuery.isError ? (
          <Alert tone="danger" title="Não foi possível carregar o histórico">
            {historicoQuery.error?.message}
          </Alert>
        ) : (
          <DataTable
            caption="Mensagens enviadas"
            columns={colunas}
            rows={historico.data}
            rowKey={(m) => m.id}
            loading={historicoQuery.isLoading}
            emptyMessage="Nenhuma mensagem enviada ainda."
          />
        )}
      </section>

      <ConfirmDialog
        open={confirmando}
        title={destinatarios === null ? "Enviar a mensagem?" : `Enviar para ${destinatarios} aluno(s)?`}
        confirmLabel="Enviar mensagem"
        busy={executando || destinatarios === null}
        onConfirm={enviar}
        onCancel={() => setConfirmando(false)}
      >
        <p>
          <strong>{dados.titulo.trim()}</strong>
        </p>
        <p>
          Para: {rotuloDoSegmento(dados, palestras.data)}. Os alunos recebem uma notificação no app. Depois de enviada, a
          mensagem não pode ser apagada.
        </p>
      </ConfirmDialog>
    </div>
  );
}
