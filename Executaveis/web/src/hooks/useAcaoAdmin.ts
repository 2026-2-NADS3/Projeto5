import { useCustomMutation, useInvalidate, type BaseRecord, type HttpError } from "@refinedev/core";

/**
 * Executa uma ação da API que não é um CRUD simples (check-in, encerrar lista,
 * justificar falta...) e depois atualiza as listas afetadas na tela.
 */
const RECURSOS_AFETADOS = ["palestras", "presencas", "inscricoes", "certificados", "alunos", "mensagens", "duvidas", "grupos"];

export function useAcaoAdmin<TResposta extends BaseRecord = BaseRecord>() {
  const { mutateAsync, mutation } = useCustomMutation<TResposta, HttpError, Record<string, unknown>>();
  const invalidar = useInvalidate();

  const executar = async (metodo: "post" | "put" | "patch", url: string, corpo: Record<string, unknown> = {}) => {
    const resposta = await mutateAsync({ url, method: metodo, values: corpo });
    await Promise.all(
      RECURSOS_AFETADOS.map((resource) => invalidar({ resource, invalidates: ["resourceAll"] })),
    );
    return resposta.data;
  };

  return { executar, executando: mutation.isPending };
}
