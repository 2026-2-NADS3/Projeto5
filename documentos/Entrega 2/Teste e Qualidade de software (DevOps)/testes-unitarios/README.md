# Testes unitários — Próxima Etapa (E2, Testes e Qualidade)

Quatro testes unitários em Jest + TypeScript, cobrindo peças do back-end (Node + Express):

| Nº | Arquivo de código | Arquivo de teste |
|---|---|---|
| 1 | `src/services/presencaService.ts` | `tests/presencaService.test.ts` |
| 2 | `src/utils/participacao.ts` | `tests/participacao.test.ts` |
| 3 | `src/utils/qrcode.ts` | `tests/qrcode.test.ts` |
| 4 | `src/middlewares/auth.ts` | `tests/auth.test.ts` |

## Como rodar

```bash
npm install
npm test
```

## Formato do QR Code adotado

Token JWT assinado pelo servidor com `{ atividadeId }` e prazo de validade (`exp`, padrão 15 min).
O app só aceita o QR se a assinatura bater com a chave do servidor e o token não tiver expirado.

## Integração com o back-end

O `PresencaService` recebe o repositório por injeção (`PresencaRepository`). No projeto real,
basta implementar essa interface com Prisma (`buscar` com `findUnique` na chave composta
aluno + atividade + encontro, e `salvar` com `create`). Recomenda-se também uma restrição
`@@unique([alunoId, atividadeId, encontro])` no schema, para garantir a regra no banco.
