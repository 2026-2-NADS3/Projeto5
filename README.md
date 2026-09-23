# Próxima Etapa — App do Aluno (Entrega 1 — Programação Mobile)

Projeto Android (Java) do PI, referente à **Entrega 1** da Unidade Curricular de
Programação Mobile (3º ADS). Aplicação com 4 telas navegáveis, seguindo os
wireframes da UX (Login, Cadastro, Perfil e Calendário/Agenda).

## Como abrir e rodar

1. Abra a pasta `ProximaEtapa-Entrega1` no Android Studio (Open -> selecione a pasta).
2. Aguarde o Gradle sincronizar (baixa as dependências automaticamente).
3. Rode em um emulador ou celular com **Android 7.0 (API 24) ou superior**.
4. O app abre direto na tela de **Login**.

## Fluxo de telas (todas navegáveis entre si)

```
Login  --(Entrar)-->            Perfil
Login  --(Cadastrar conta)-->   Cadastro
Cadastro --(Cadastrar)-->       Login
Perfil --(Meus Eventos / ícone calendário)--> Calendário
Calendário --(ícone perfil)--> Perfil
```

## O que foi implementado nesta etapa (Entrega 1)

- 4 Activities (`LoginActivity`, `CadastroActivity`, `PerfilActivity`,
  `CalendarioActivity`) conectadas por `Intent` + `putExtra`/`getStringExtra`,
  exatamente como visto em aula (Aula04/Exemplo02, Aula05, Aula06).
- Layouts em `ConstraintLayout`, com `TextView`, `EditText`, `Button`,
  `ImageView`/`ImageButton`.
- Duas classes de modelo (POJO), no padrão de `Livro.java`/`Pet.java`:
  - `Usuario.java` — dados do aluno (nome, email, escola).
  - `Evento.java` — evento da agenda; calcula a **carga horária em horas**
    (dado numérico) a partir dos horários de início e fim.
- **Função principal da etapa**: exibição da Agenda individual do aluno
  (`CalendarioActivity`), com o mês navegável (setas `<`/`>` percorrendo um
  array de meses) e o evento do dia com sua carga horária calculada — está
  toda programada, comentada e funcionando.
- Validações simples de formulário (campos obrigatórios, confirmação de
  senha) usando apenas os recursos já vistos em aula.
- Logo da Próxima Etapa como **imagem** (`ImageView` +
  `drawable/logo_proxima_etapa.xml`).
- Cores 100% baseadas na paleta oficial do projeto (`res/values/colors.xml`):
  `#FFF4D0`, `#51C600`, `#FABB17`, `#7730E2`, `#191305`.

## Pendente de propósito para a Entrega 2 (fora do escopo desta etapa)

Conforme o Plano de Entrega, a Entrega 1 pede só a fundação da navegação e a
função principal (Login → Cursos/Agenda). Por isso ficaram de fora,
intencionalmente:

- Integração com API/banco de dados real (login e cadastro são simulados).
- Persistência local dos dados (SQLite/Room).
- QR Code de presença, certificados reais, testes de perfil, chat/mensagens.
- Os dois ícones extras da barra inferior (Início/Mensagens) estão nos
  layouts mas sem navegação — são placeholders comentados no código,
  reservados para funcionalidades da Entrega 2.
- A grade de dias do calendário é fixa (mostra Setembro/2026, como no
  protótipo); só o nome do mês no topo é dinâmico.

## Trocar o logo pela imagem oficial

O arquivo `app/src/main/res/drawable/logo_proxima_etapa.xml` é um placeholder
vetorial simples, só para o projeto compilar sem depender de arquivos
externos. Para usar a logo real (a mesma do wireframe):

1. Exporte a logo oficial como PNG, por exemplo `logo_proxima_etapa.png`.
2. Copie o arquivo para `app/src/main/res/drawable/`.
3. Apague o `logo_proxima_etapa.xml` (mesmo nome, extensão diferente).

Como o `ImageView` já referencia `@drawable/logo_proxima_etapa`, a troca é
automática — não precisa mexer em nenhum layout ou código Java.

## Estrutura do código-fonte

```
app/src/main/java/com/example/proximaetapa/
├── Usuario.java            (classe de modelo)
├── Evento.java              (classe de modelo)
├── LoginActivity.java       (tela inicial / main)
├── CadastroActivity.java
├── PerfilActivity.java
└── CalendarioActivity.java  (função principal da etapa)
```
