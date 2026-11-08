# Próxima Etapa — Painel Administrativo (acesso online)

O painel web da equipe da ONG **Próxima Etapa** está publicado na internet.
Para usar, basta abrir o link no navegador. **Não é preciso clonar o repositório, instalar Node nem rodar nenhum comando.**

> Projeto Interdisciplinar do 3º semestre de ADS da FECAP (Grupo 1, turma 3NAADS).

---

## 🔗 Link de acesso

### **https://elegant-sopapillas-04a196.netlify.app**

Funciona no computador e no celular (Chrome, Edge, Firefox ou Safari atualizados).

---

## 🔑 Como entrar

1. Abra o link acima.
2. Na tela **Entrar**, preencha:

   | Campo  | Valor |
   |--------|-------|
   | E-mail | `admin@proximaetapa.test` |
   | Senha  | *(solicite ao grupo)* |

3. Clique em **Entrar**. Você será levado ao **Dashboard**.

> Só contas com papel de **administrador** conseguem entrar. Contas de aluno (do app Android) são recusadas de propósito.

---

## 🧭 O que dá para fazer no painel

| Menu | O que a equipe faz |
|---|---|
| **Dashboard** | Vê a palestra do dia (com atalho para o check-in), indicadores do mês, palestras por mês, perfis DISC e RIASEC e o ranking dos alunos |
| **Alunos** | Busca por nome ou e-mail, filtra por status e perfil DISC e abre o detalhe com inscrições, presenças, faltas, certificados e testes |
| **Palestras** | Cadastra e edita palestras. No detalhe de cada uma há as abas **Inscritos**, **Presença**, **Grupos DISC** e **Certificados** |
| **Check-in** | Pelo celular: escolhe a palestra do dia e lê o **QR Code** do convite do aluno com a câmera |
| **Testes de perfil** | Edita as perguntas e alternativas dos testes DISC e RIASEC |
| **Comunicação** | Envia mensagens (para todos, para inscritos de uma palestra ou por perfil DISC) e responde dúvidas |

---

## 📱 Roteiro rápido para testar

1. **Entre** com a conta de administrador.
2. No **Dashboard**, confira os indicadores do mês.
3. Abra **Palestras** e entre em uma palestra para ver as abas de inscritos e presença.
4. Abra **Alunos** e clique em um aluno para ver o histórico.
5. **No celular**, abra o mesmo link, vá em **Check-in**, permita o uso da câmera e aponte para o QR Code do convite gerado no app Android.

---

## ❓ Problemas comuns

| O que aparece | O que fazer |
|---|---|
| Página pedindo login do **Netlify** | O site ainda está em modo privado. Peça ao grupo para liberar o acesso público. |
| "E-mail ou senha inválidos" | Confira se não há espaço sobrando no começo ou no fim dos campos. |
| A câmera não abre no check-in | Permita a câmera quando o navegador perguntar (ou no cadeado ao lado do endereço). A câmera só funciona pelo link `https://`. |
| Tela em branco ou dados desatualizados | Recarregue a página (Ctrl + F5 no computador). |

---

## 🛠️ Para quem vai desenvolver

Instruções para rodar localmente, estrutura do código, banco de dados (Supabase) e testes estão em
[`admin-web/README.md`](admin-web/README.md).

O site é publicado automaticamente pelo **Netlify** a cada `git push` na branch **`laura-web`**.
