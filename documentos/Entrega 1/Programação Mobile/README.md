# Próxima Etapa — App do Aluno (Entrega 1 — Programação Mobile)

Projeto Android (Java) do PI, referente à **Entrega 1** da Unidade Curricular de
Programação Mobile (3º ADS). Aplicação com 4 telas navegáveis, seguindo os
wireframes da UX (Login, Cadastro, Perfil e Calendário/Agenda).

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
  `CalendarioActivity`) conectadas por `Intent` + `putExtra`/`getStringExtra`
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
- Cores 100% baseadas na paleta oficial do projeto (`res/values/colors.xml`):
  `#FFF4D0`, `#51C600`, `#FABB17`, `#7730E2`, `#191305`.


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
