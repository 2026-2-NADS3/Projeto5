import { useCreate, useList, useOne, useUpdate, type HttpError } from "@refinedev/core";
import { ArrowLeft } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { InputField, SelectField, TextareaField } from "../../components/ui/form/Field";
import { PageHeader } from "../../components/ui/PageHeader";
import { camposParaIso, isoParaCampos } from "../../lib/datas";
import type { Evento, EventoPayload, PalestraDetalhada, PalestraPayload, TipoEvento } from "../../types/dominio";
import { ROTULO_TIPO } from "./rotulos";
import { formularioVazio, validarFormulario, type ErrosFormulario, type FormularioPalestra } from "./validacaoPalestra";
import styles from "./PalestraFormPage.module.css";

/** Tela 9.6 — cadastro (/palestras/nova) e edição (/palestras/:id/editar) de palestra. */
export function PalestraFormPage() {
  const { id } = useParams();
  const editando = Boolean(id);

  const { result: palestra, query } = useOne<PalestraDetalhada>({
    resource: "palestras",
    id: id ?? "",
    queryOptions: { enabled: editando },
  });

  if (editando && query.isLoading) return <p>Carregando palestra...</p>;
  if (editando && (query.isError || !palestra)) {
    return (
      <Alert tone="danger" title="Palestra não encontrada">
        {query.error?.message ?? "Confira o endereço e tente de novo."}
      </Alert>
    );
  }
  if (palestra?.listaEncerrada) {
    return (
      <Alert tone="info" title="Palestra encerrada">
        A lista de presença desta palestra já foi encerrada, então ela não pode mais ser editada.
      </Alert>
    );
  }

  // A chave recria o formulário do zero ao trocar entre "nova" e "editar".
  return <FormularioPalestraConteudo key={id ?? "nova"} palestra={editando ? palestra : undefined} />;
}

function valoresIniciais(palestra?: PalestraDetalhada): FormularioPalestra {
  if (!palestra) return formularioVazio;
  const inicio = isoParaCampos(palestra.inicio);
  const fim = isoParaCampos(palestra.fim);
  return {
    ...formularioVazio,
    eventoId: palestra.eventoId,
    data: inicio.data,
    horaInicio: inicio.hora,
    horaFim: fim.hora,
    sala: palestra.sala ?? "",
    vagas: palestra.vagas === null ? "" : String(palestra.vagas),
  };
}

function FormularioPalestraConteudo({ palestra }: { palestra?: PalestraDetalhada }) {
  const editando = Boolean(palestra);
  const id = palestra?.id;
  const navigate = useNavigate();

  const [form, setForm] = useState<FormularioPalestra>(() => valoresIniciais(palestra));
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const { result: eventos, query: eventosQuery } = useList<Evento>({ resource: "eventos", pagination: { mode: "off" } });
  const { mutateAsync: criar } = useCreate();
  const { mutateAsync: atualizar } = useUpdate();

  const alterar = <K extends keyof FormularioPalestra>(campo: K, valor: FormularioPalestra[K]) => {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: undefined }));
  };

  const salvar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setErroGeral(null);

    const errosEncontrados = validarFormulario(form, {
      editando,
      confirmados: palestra?.contagem.confirmados ?? 0,
      hoje: isoParaCampos(new Date().toISOString()).data,
    });
    setErros(errosEncontrados);
    if (Object.keys(errosEncontrados).length > 0) return;

    setSalvando(true);
    try {
      let eventoId = form.eventoId;
      if (form.modoEvento === "novo") {
        const novoEvento: EventoPayload = {
          titulo: form.novoTitulo.trim(),
          descricao: form.novaDescricao.trim(),
          cargaHoraria: Number(form.novaCargaHoraria),
          tipo: form.novoTipo,
        };
        const criado = await criar({ resource: "eventos", values: novoEvento });
        eventoId = String(criado.data.id);
      }

      const dados: PalestraPayload = {
        eventoId,
        inicio: camposParaIso(form.data, form.horaInicio),
        fim: camposParaIso(form.data, form.horaFim),
        sala: form.sala.trim() || null,
        vagas: Number(form.vagas),
      };

      const salvo = editando
        ? await atualizar({ resource: "palestras", id: id!, values: dados })
        : await criar({ resource: "palestras", values: dados });

      navigate(`/palestras/${salvo.data.id}`);
    } catch (falha) {
      setErroGeral((falha as HttpError).message ?? "Não foi possível salvar. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  };

  const voltar = () => navigate(editando ? `/palestras/${id}` : "/palestras");

  const eventoEscolhido = eventos.data.find((e) => e.id === form.eventoId);

  return (
    <>
      <Button variant="ghost" size="sm" onClick={voltar} className={styles.voltar}>
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar
      </Button>

      <PageHeader
        title={editando ? "Editar palestra" : "Nova palestra"}
        description="O evento é o conteúdo fixo; a palestra é a edição com data e vagas."
      />

      <form onSubmit={salvar} noValidate className={styles.form}>
        {erroGeral && (
          <Alert tone="danger" title="Não foi possível salvar">
            {erroGeral}
          </Alert>
        )}

        <Card accent="purple">
          <h2 className={styles.secao}>Evento</h2>

          <fieldset className={styles.modo}>
            <legend className="visually-hidden">Origem do evento</legend>
            <label className={styles.opcao}>
              <input
                type="radio"
                name="modoEvento"
                checked={form.modoEvento === "existente"}
                onChange={() => alterar("modoEvento", "existente")}
              />
              Usar um evento já cadastrado
            </label>
            <label className={styles.opcao}>
              <input
                type="radio"
                name="modoEvento"
                checked={form.modoEvento === "novo"}
                onChange={() => alterar("modoEvento", "novo")}
              />
              Cadastrar um evento novo
            </label>
          </fieldset>

          {form.modoEvento === "existente" ? (
            <div className={styles.gridEvento}>
              <SelectField
                label="Evento"
                value={form.eventoId}
                onChange={(e) => alterar("eventoId", e.target.value)}
                error={erros.eventoId}
                disabled={eventosQuery.isLoading}
              >
                <option value="">{eventosQuery.isLoading ? "Carregando..." : "Escolha um evento"}</option>
                {eventos.data.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.titulo}
                  </option>
                ))}
              </SelectField>
              {eventoEscolhido && (
                <p className={styles.resumoEvento}>
                  {ROTULO_TIPO[eventoEscolhido.tipo]} · {eventoEscolhido.cargaHoraria}h
                  {eventoEscolhido.descricao && <> · {eventoEscolhido.descricao}</>}
                </p>
              )}
            </div>
          ) : (
            <div className={styles.grid}>
              <InputField
                label="Título"
                value={form.novoTitulo}
                onChange={(e) => alterar("novoTitulo", e.target.value)}
                error={erros.novoTitulo}
                maxLength={120}
              />
              <SelectField
                label="Tipo"
                value={form.novoTipo}
                onChange={(e) => alterar("novoTipo", e.target.value as TipoEvento)}
                hint="Soft skills ativa os grupos DISC e exige o teste DISC na inscrição."
              >
                <option value="PADRAO">{ROTULO_TIPO.PADRAO}</option>
                <option value="SOFT_SKILLS">{ROTULO_TIPO.SOFT_SKILLS}</option>
              </SelectField>
              <InputField
                label="Carga horária (horas)"
                type="number"
                min={1}
                step={0.5}
                inputMode="decimal"
                value={form.novaCargaHoraria}
                onChange={(e) => alterar("novaCargaHoraria", e.target.value)}
                error={erros.novaCargaHoraria}
                hint="Aparece no certificado."
              />
              <div className={styles.full}>
                <TextareaField
                  label="Descrição"
                  optional
                  value={form.novaDescricao}
                  onChange={(e) => alterar("novaDescricao", e.target.value)}
                  maxLength={500}
                />
              </div>
            </div>
          )}
        </Card>

        <Card accent="yellow">
          <h2 className={styles.secao}>Data e vagas</h2>
          <div className={styles.grid}>
            <InputField
              label="Data"
              type="date"
              value={form.data}
              onChange={(e) => alterar("data", e.target.value)}
              error={erros.data}
            />
            <InputField
              label="Início"
              type="time"
              value={form.horaInicio}
              onChange={(e) => alterar("horaInicio", e.target.value)}
              error={erros.horaInicio}
            />
            <InputField
              label="Término"
              type="time"
              value={form.horaFim}
              onChange={(e) => alterar("horaFim", e.target.value)}
              error={erros.horaFim}
            />
            <InputField
              label="Vagas"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={form.vagas}
              onChange={(e) => alterar("vagas", e.target.value)}
              error={erros.vagas}
              hint={editando ? `${palestra?.contagem.confirmados ?? 0} inscritos confirmados hoje.` : "Lotou, novas inscrições vão para a lista de espera."}
            />
            <InputField
              label="Sala"
              optional
              value={form.sala}
              onChange={(e) => alterar("sala", e.target.value)}
              maxLength={60}
            />
          </div>
        </Card>

        <div className={styles.acoes}>
          <Button variant="ghost" onClick={voltar} disabled={salvando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar palestra"}
          </Button>
        </div>
      </form>
    </>
  );
}
